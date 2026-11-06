$ErrorActionPreference = "Stop"
$env:PGSSLMODE = "disable"
$proposal = Split-Path $PSScriptRoot -Parent
$bin = Join-Path $env:TEMP "pg1711\pgsql\bin"
$psql = Join-Path $bin "psql.exe"
$initdb = Join-Path $bin "initdb.exe"
$pgctl = Join-Path $bin "pg_ctl.exe"
$port = 55453
$run = Join-Path $env:TEMP "nchf-directory-visibility-run"
$data = Join-Path $run "data"
$log = Join-Path $run "postgresql.log"
$fixture = Join-Path $PSScriptRoot "pg1711_directory_visibility_fixture.sql"
$sql = Join-Path $proposal "20261105170000_wa_afh_directory_visibility.sql"
$rollback = Join-Path $proposal "20261105170000_wa_afh_directory_visibility_ROLLBACK.sql"
$checks = Join-Path $PSScriptRoot "pg1711_directory_visibility_checks.sql"
$rollbackChecks = Join-Path $PSScriptRoot "pg1711_directory_visibility_rollback_checks.sql"
$app = Join-Path $proposal "20261105170000_wa_afh_directory_visibility_APP.md"
$manifest = Join-Path $run "sha256.txt"
$results = Join-Path $run "results.txt"
$rollbackAuthorization = "select set_config('nchf.phase5a_rollback_authorization', 'authorize-directory-visibility-select-downgrade', false);"

function Invoke-LocalPsql {
  param([string]$Database, [string]$User, [string]$File, [string]$Command, [string]$Prefix)
  if ($File) {
    $body = Get-Content -Raw $File
    if ($Prefix) { $body = $Prefix + "`r`n" + $body }
  } else {
    $body = $Command
  }
  $statement = Join-Path $run "statement.sql"
  Set-Content -Path $statement -Value $body -Encoding ascii
  $process = New-Object System.Diagnostics.Process
  $process.StartInfo.FileName = $psql
  $process.StartInfo.Arguments = "-h 127.0.0.1 -p $port -U $User -d $Database -v ON_ERROR_STOP=1 -f `"$statement`""
  $process.StartInfo.UseShellExecute = $false
  $process.StartInfo.RedirectStandardOutput = $true
  $process.StartInfo.RedirectStandardError = $true
  [void]$process.Start()
  $stdout = $process.StandardOutput.ReadToEndAsync()
  $stderr = $process.StandardError.ReadToEndAsync()
  $process.WaitForExit()
  $output = $stdout.Result + $stderr.Result
  return @{ Code = $process.ExitCode; Output = $output }
}

$proposalText = Get-Content -Raw $sql
$rollbackText = Get-Content -Raw $rollback
if ($proposalText -match "(?i)service_role|next_public_supabase|delete\s+from\s+public\.(owner_claims|listing_edits)|update\s+public\.(owner_claims|listing_edits)|alter\s+table\s+public\.(owner_claims|listing_edits)") {
  throw "visibility proposal contains a forbidden change"
}
if ([regex]::Matches($proposalText, "(?i)drop\s+policy").Count -ne 1 -or $proposalText -notmatch 'drop policy "Development test facility read" on public.facilities') {
  throw "visibility proposal does not drop only the test facility policy"
}
if ($rollbackText -notmatch "drop policy facilities_public_read_wa_afh_source_matched on public.facilities") {
  throw "rollback does not drop the intended policy"
}
if ($rollbackText -notmatch "requires separate authorization") {
  throw "rollback does not require separate authorization for the select downgrade"
}
$dropCount = [regex]::Matches($rollbackText, "(?i)drop\s+policy").Count
if ($dropCount -ne 1) { throw "rollback drops $dropCount policies" }

$runCreated = $false
try {
  New-Item -ItemType Directory -Force -Path $run | Out-Null
  $runCreated = $true
  if (Test-Path (Join-Path $data "postmaster.pid")) {
    & $pgctl -D $data stop -m fast | Out-Null
  }
  if (Test-Path $data) { Remove-Item -Recurse -Force $data }
  & $initdb -D $data -U bootstrap -A trust --encoding=UTF8 --locale=C | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "local PostgreSQL initdb failed" }
  & $pgctl -D $data -l $log -o "-p $port -h 127.0.0.1" start
  if ($LASTEXITCODE -ne 0) { throw "local PostgreSQL did not start" }

  $ready = $false
  foreach ($attempt in 1..30) {
    $probe = Invoke-LocalPsql -Database "postgres" -User "bootstrap" -Command "select 1;"
    if ($probe.Code -eq 0) { $ready = $true; break }
    Start-Sleep -Milliseconds 200
  }
  if (-not $ready) { throw "local PostgreSQL did not become ready" }
  $version = Invoke-LocalPsql -Database "postgres" -User "bootstrap" -Command "show server_version;"
  if ($version.Output -notmatch "17\.11") { throw "expected PostgreSQL 17.11: $($version.Output)" }

  $createdPass = Invoke-LocalPsql -Database "postgres" -User "bootstrap" -Command "create database visibility_pass;"
  if ($createdPass.Code -ne 0) { throw $createdPass.Output }
  $createdShort = Invoke-LocalPsql -Database "postgres" -User "bootstrap" -Command "create database visibility_short;"
  if ($createdShort.Code -ne 0) { throw $createdShort.Output }
  $loaded = Invoke-LocalPsql -Database "visibility_pass" -User "bootstrap" -File $fixture
  if ($loaded.Code -ne 0) { throw $loaded.Output }
  $applied = Invoke-LocalPsql -Database "visibility_pass" -User "postgres" -File $sql
  if ($applied.Code -ne 0 -or $applied.Output -notmatch "DIRECTORY_VISIBILITY_READY listed=6265 map=6265" -or $applied.Output -notmatch "(?m)^COMMIT\s*$") {
    throw "visibility proposal failed: $($applied.Output)"
  }
  Write-Output "CASE successful_migration=pass"
  $checked = Invoke-LocalPsql -Database "visibility_pass" -User "postgres" -File $checks
  if ($checked.Code -ne 0 -or $checked.Output -notmatch "DIRECTORY_VISIBILITY_CHECKS_PASS") {
    throw "visibility checks failed: $($checked.Output)"
  }
  Write-Output "CASE restricted_column_denial=pass"
  $unauthorized = Invoke-LocalPsql -Database "visibility_pass" -User "postgres" -File $rollback
  if ($unauthorized.Code -eq 0 -or $unauthorized.Output -notmatch "requires separate authorization" -or $unauthorized.Output -match "(?m)^COMMIT\s*$") {
    throw "unauthorized rollback did not refuse: $($unauthorized.Output)"
  }
  $unauthorizedUnchanged = Invoke-LocalPsql -Database "visibility_pass" -User "postgres" -Command "select (to_regclass('public.nchf_phase5a_facilities_acl_snapshot') is not null)::text || '|' || has_column_privilege('anon', 'public.facilities', 'public_phone', 'select')::text || '|' || has_column_privilege('public', 'public.facilities', 'source_hash', 'select')::text || '|' || (select count(*) from pg_policy where polname = 'facilities_public_read_wa_afh_source_matched')::text;"
  if ($unauthorizedUnchanged.Code -ne 0 -or $unauthorizedUnchanged.Output -notmatch "true\|false\|false\|1") {
    throw "unauthorized rollback changed the database: $($unauthorizedUnchanged.Output)"
  }
  Write-Output "CASE unauthorized_rollback_refused=pass"
  $rolled = Invoke-LocalPsql -Database "visibility_pass" -User "postgres" -File $rollback -Prefix $rollbackAuthorization
  if ($rolled.Code -ne 0 -or $rolled.Output -notmatch "DIRECTORY_VISIBILITY_ROLLED_BACK" -or $rolled.Output -notmatch "(?m)^COMMIT\s*$") {
    throw "visibility rollback failed: $($rolled.Output)"
  }
  $rolledChecks = Invoke-LocalPsql -Database "visibility_pass" -User "postgres" -File $rollbackChecks
  if ($rolledChecks.Code -ne 0 -or $rolledChecks.Output -notmatch "DIRECTORY_VISIBILITY_ROLLBACK_CHECKS_PASS") {
    throw "rollback checks failed: $($rolledChecks.Output)"
  }
  Write-Output "CASE authorized_rollback_acl_restored=pass"

  $shortLoaded = Invoke-LocalPsql -Database "visibility_short" -User "bootstrap" -File $fixture
  if ($shortLoaded.Code -ne 0) { throw $shortLoaded.Output }
  $trimmed = Invoke-LocalPsql -Database "visibility_short" -User "bootstrap" -Command "delete from public.listing_edits; delete from public.owner_claims; delete from public.facilities where source_name = 'wa_dshs_afh' and license_number <> '000001';"
  if ($trimmed.Code -ne 0) { throw $trimmed.Output }
  $refused = Invoke-LocalPsql -Database "visibility_short" -User "postgres" -File $sql
  if ($refused.Code -eq 0 -or $refused.Output -notmatch "source_matched rows 1, qualifying rows 1,\s+expected 6265" -or $refused.Output -match "(?m)^COMMIT\s*$") {
    throw "short directory did not refuse cleanly: $($refused.Output)"
  }
  $unchanged = Invoke-LocalPsql -Database "visibility_short" -User "postgres" -Command "select (select count(*) from pg_policy where polname = 'facilities_public_read_wa_afh_source_matched')::text || '|' || (select string_agg(attname, ',' order by attnum) from pg_attribute where attrelid = 'public.wa_dshs_listed_facilities'::regclass and attnum > 0 and not attisdropped) || '|' || has_table_privilege('anon', 'public.facilities', 'select')::text || '|' || has_column_privilege('anon', 'public.facilities', 'public_phone', 'select')::text || '|' || has_column_privilege('public', 'public.facilities', 'public_phone', 'select')::text || '|' || (to_regclass('public.nchf_phase5a_facilities_acl_snapshot') is null)::text;"
  if ($unchanged.Code -ne 0 -or $unchanged.Output -notmatch "0\|id,canonical_name,address_line1,city,county,license_number\|true\|true\|true\|true") {
    throw "short directory changed after refusal: $($unchanged.Output)"
  }
  Write-Output "CASE short_count_refused=pass"
  Write-Output "CASE direct_and_public_column_grants_unchanged_after_refusal=pass"

  $createdInherit = Invoke-LocalPsql -Database "postgres" -User "bootstrap" -Command "create database visibility_inherit;"
  if ($createdInherit.Code -ne 0) { throw $createdInherit.Output }
  $inheritLoaded = Invoke-LocalPsql -Database "visibility_inherit" -User "bootstrap" -File $fixture
  if ($inheritLoaded.Code -ne 0) { throw $inheritLoaded.Output }
  $inheritRole = Invoke-LocalPsql -Database "visibility_inherit" -User "bootstrap" -Command "create role phone_parent nologin;"
  if ($inheritRole.Code -ne 0) { throw $inheritRole.Output }
  $inheritMember = Invoke-LocalPsql -Database "visibility_inherit" -User "bootstrap" -Command "grant phone_parent to anon with inherit true, set false, admin false;"
  if ($inheritMember.Code -ne 0) { throw $inheritMember.Output }
  $inheritGrant = Invoke-LocalPsql -Database "visibility_inherit" -User "bootstrap" -Command "grant select (public_phone) on table public.facilities to phone_parent;"
  if ($inheritGrant.Code -ne 0) { throw $inheritGrant.Output }
  $inheritRefused = Invoke-LocalPsql -Database "visibility_inherit" -User "postgres" -File $sql
  if ($inheritRefused.Code -eq 0 -or $inheritRefused.Output -notmatch "inherited role phone_parent grants select on public.facilities" -or $inheritRefused.Output -match "(?m)^COMMIT\s*$") {
    throw "inherited column grant did not refuse cleanly: $($inheritRefused.Output)"
  }
  $inheritUnchanged = Invoke-LocalPsql -Database "visibility_inherit" -User "postgres" -Command "select (select count(*) from pg_policy where polname = 'facilities_public_read_wa_afh_source_matched')::text || '|' || (to_regclass('public.nchf_phase5a_facilities_acl_snapshot') is null)::text || '|' || has_column_privilege('phone_parent', 'public.facilities', 'public_phone', 'select')::text || '|' || has_table_privilege('anon', 'public.facilities', 'select')::text;"
  if ($inheritUnchanged.Code -ne 0 -or $inheritUnchanged.Output -notmatch "0\|true\|true\|true") {
    throw "inherited refusal changed privileges: $($inheritUnchanged.Output)"
  }
  Write-Output "CASE inherited_column_grant_refused=pass"

  $tableParent = Invoke-LocalPsql -Database "visibility_inherit" -User "bootstrap" -Command "revoke phone_parent from anon;"
  if ($tableParent.Code -ne 0) { throw $tableParent.Output }
  $tableRole = Invoke-LocalPsql -Database "visibility_inherit" -User "bootstrap" -Command "create role table_parent nologin;"
  if ($tableRole.Code -ne 0) { throw $tableRole.Output }
  $tableMember = Invoke-LocalPsql -Database "visibility_inherit" -User "bootstrap" -Command "grant table_parent to authenticated with inherit true, set false, admin false;"
  if ($tableMember.Code -ne 0) { throw $tableMember.Output }
  $tableGrant = Invoke-LocalPsql -Database "visibility_inherit" -User "bootstrap" -Command "grant select on table public.facilities to table_parent;"
  if ($tableGrant.Code -ne 0) { throw $tableGrant.Output }
  $tableRefused = Invoke-LocalPsql -Database "visibility_inherit" -User "postgres" -File $sql
  if ($tableRefused.Code -eq 0 -or $tableRefused.Output -notmatch "inherited role table_parent grants select on public.facilities" -or $tableRefused.Output -match "(?m)^COMMIT\s*$") {
    throw "inherited table grant did not refuse cleanly: $($tableRefused.Output)"
  }
  Write-Output "CASE inherited_table_grant_refused=pass"

  $readerParent = Invoke-LocalPsql -Database "visibility_inherit" -User "bootstrap" -Command "revoke table_parent from authenticated;"
  if ($readerParent.Code -ne 0) { throw $readerParent.Output }
  $readerMember = Invoke-LocalPsql -Database "visibility_inherit" -User "bootstrap" -Command "grant pg_read_all_data to anon with inherit true, set false, admin false;"
  if ($readerMember.Code -ne 0) { throw $readerMember.Output }
  $readerRefused = Invoke-LocalPsql -Database "visibility_inherit" -User "postgres" -File $sql
  if ($readerRefused.Code -eq 0 -or $readerRefused.Output -notmatch "inherited role pg_read_all_data grants select on public.facilities" -or $readerRefused.Output -match "(?m)^COMMIT\s*$") {
    throw "inherited pg_read_all_data did not refuse cleanly: $($readerRefused.Output)"
  }
  $readerUnchanged = Invoke-LocalPsql -Database "visibility_inherit" -User "postgres" -Command "select (to_regclass('public.nchf_phase5a_facilities_acl_snapshot') is null)::text || '|' || has_column_privilege('public', 'public.facilities', 'public_phone', 'select')::text || '|' || has_table_privilege('anon', 'public.facilities', 'select')::text;"
  if ($readerUnchanged.Code -ne 0 -or $readerUnchanged.Output -notmatch "true\|true\|true") {
    throw "inherited reader refusal changed privileges: $($readerUnchanged.Output)"
  }
  Write-Output "CASE inherited_pg_read_all_data_refused=pass"

  $hashes = @(
    $sql, $rollback, $app, $fixture, $checks, $rollbackChecks, $PSCommandPath
  ) | ForEach-Object {
    $hash = Get-FileHash -Algorithm SHA256 $_
    "{0}  {1}" -f $hash.Hash.ToLower(), (Split-Path $_ -Leaf)
  }
  Set-Content -Path $manifest -Value ($hashes -join "`n") -Encoding ascii
  Set-Content -Path $results -Value @(
    "DIRECTORY_VISIBILITY_REGRESSION_PASS",
    "server=PostgreSQL 17.11",
    "host=127.0.0.1",
    "port=$port",
    "successful_migration=true",
    "public_phone_column_grant=removed_and_restored",
    "public_column_grant=removed_and_restored",
    "table_select_grant=restored_with_grant_option",
    "restricted_columns_denied=anon,authenticated,public",
    "unauthorized_rollback_refused=true",
    "authorized_rollback_acl_restored=true",
    "short_count_refused=true",
    "inherited_column_grant_refused=true",
    "inherited_table_grant_refused=true",
    "inherited_pg_read_all_data_refused=true",
    "repository_files_modified=false"
  ) -Encoding ascii
  Write-Output "DIRECTORY_VISIBILITY_REGRESSION_PASS"
  Write-Output "results=$results"
  Write-Output "manifest=$manifest"
  Write-Output "log=$log"
  $hashes | ForEach-Object { Write-Output $_ }
} finally {
  $previous = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  if ($runCreated) {
    $pidFile = Join-Path $data "postmaster.pid"
    if (Test-Path $pidFile) {
      & $pgctl -D $data stop -m fast | Out-Null
      if (Test-Path $pidFile) { & $pgctl -D $data stop -m immediate | Out-Null }
    }
    if (Test-Path $run) { Remove-Item -Recurse -Force $run }
  }
  $ErrorActionPreference = $previous
}
if ($runCreated -and (Test-Path $run)) {
  throw "temporary regression artifacts remain at $run"
}
