$ErrorActionPreference = "Stop"
$env:PGSSLMODE = "disable"
$proposal = Split-Path $PSScriptRoot -Parent
$bin = Join-Path $env:TEMP "pg1711\pgsql\bin"
$psql = Join-Path $bin "psql.exe"
$initdb = Join-Path $bin "initdb.exe"
$pgctl = Join-Path $bin "pg_ctl.exe"
$port = 55453
$data = Join-Path $env:TEMP "nchf-directory-visibility-pg"
$log = Join-Path $env:TEMP "nchf-directory-visibility-pg.log"
$fixture = Join-Path $PSScriptRoot "pg1711_directory_visibility_fixture.sql"
$sql = Join-Path $proposal "20261105170000_wa_afh_directory_visibility.sql"
$rollback = Join-Path $proposal "20261105170000_wa_afh_directory_visibility_ROLLBACK.sql"
$checks = Join-Path $PSScriptRoot "pg1711_directory_visibility_checks.sql"
$rollbackChecks = Join-Path $PSScriptRoot "pg1711_directory_visibility_rollback_checks.sql"
$app = Join-Path $proposal "20261105170000_wa_afh_directory_visibility_APP.md"
$results = Join-Path $PSScriptRoot "pg1711_directory_visibility_results.txt"

function Invoke-LocalPsql {
  param([string]$Database, [string]$User, [string]$File, [string]$Command)
  $previous = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  if ($File) {
    $output = & $psql -h 127.0.0.1 -p $port -U $User -d $Database -v ON_ERROR_STOP=1 -f $File 2>&1 | Out-String
  } else {
    $output = & $psql -h 127.0.0.1 -p $port -U $User -d $Database -v ON_ERROR_STOP=1 -c $Command 2>&1 | Out-String
  }
  $code = $LASTEXITCODE
  $ErrorActionPreference = $previous
  return @{ Code = $code; Output = $output }
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
$dropCount = [regex]::Matches($rollbackText, "(?i)drop\s+policy").Count
if ($dropCount -ne 1) { throw "rollback drops $dropCount policies" }

if (Test-Path $data) {
  & $pgctl -D $data stop -m fast | Out-Null
  Remove-Item -Recurse -Force $data
}
& $initdb -D $data -U bootstrap -A trust --encoding=UTF8 --locale=C | Out-Null
& $pgctl -D $data -l $log -o "-p $port -h 127.0.0.1" start
if ($LASTEXITCODE -ne 0) { throw "local PostgreSQL did not start" }

try {
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
  $checked = Invoke-LocalPsql -Database "visibility_pass" -User "postgres" -File $checks
  if ($checked.Code -ne 0 -or $checked.Output -notmatch "DIRECTORY_VISIBILITY_CHECKS_PASS") {
    throw "visibility checks failed: $($checked.Output)"
  }
  $rolled = Invoke-LocalPsql -Database "visibility_pass" -User "postgres" -File $rollback
  if ($rolled.Code -ne 0 -or $rolled.Output -notmatch "DIRECTORY_VISIBILITY_ROLLED_BACK" -or $rolled.Output -notmatch "(?m)^COMMIT\s*$") {
    throw "visibility rollback failed: $($rolled.Output)"
  }
  $rolledChecks = Invoke-LocalPsql -Database "visibility_pass" -User "postgres" -File $rollbackChecks
  if ($rolledChecks.Code -ne 0 -or $rolledChecks.Output -notmatch "DIRECTORY_VISIBILITY_ROLLBACK_CHECKS_PASS") {
    throw "rollback checks failed: $($rolledChecks.Output)"
  }

  $shortLoaded = Invoke-LocalPsql -Database "visibility_short" -User "bootstrap" -File $fixture
  if ($shortLoaded.Code -ne 0) { throw $shortLoaded.Output }
  $trimmed = Invoke-LocalPsql -Database "visibility_short" -User "bootstrap" -Command "delete from public.listing_edits; delete from public.owner_claims; delete from public.facilities where source_name = 'wa_dshs_afh' and license_number <> '000001';"
  if ($trimmed.Code -ne 0) { throw $trimmed.Output }
  $refused = Invoke-LocalPsql -Database "visibility_short" -User "postgres" -File $sql
  if ($refused.Code -eq 0 -or $refused.Output -notmatch "source_matched rows 1, qualifying rows 1,\s+expected 6265" -or $refused.Output -match "(?m)^COMMIT\s*$") {
    throw "short directory did not refuse cleanly: $($refused.Output)"
  }
  $unchanged = Invoke-LocalPsql -Database "visibility_short" -User "postgres" -Command "select (select count(*) from pg_policy where polname = 'facilities_public_read_wa_afh_source_matched')::text || '|' || (select string_agg(attname, ',' order by attnum) from pg_attribute where attrelid = 'public.wa_dshs_listed_facilities'::regclass and attnum > 0 and not attisdropped) || '|' || has_table_privilege('anon', 'public.facilities', 'select')::text;"
  if ($unchanged.Code -ne 0 -or $unchanged.Output -notmatch "0\|id,canonical_name,address_line1,city,county,license_number\|true") {
    throw "short directory changed after refusal: $($unchanged.Output)"
  }

  $hashes = @(
    $sql, $rollback, $app, $fixture, $checks, $rollbackChecks, $PSCommandPath
  ) | ForEach-Object {
    $hash = Get-FileHash -Algorithm SHA256 $_
    "{0}  {1}" -f $hash.Hash.ToLower(), (Split-Path $_ -Leaf)
  }
  $manifest = Join-Path $proposal "20261105170000_wa_afh_directory_visibility.sha256"
  Set-Content -Path $manifest -Value ($hashes -join "`n") -Encoding ascii
  Set-Content -Path $results -Value @(
    "DIRECTORY_VISIBILITY_REGRESSION_PASS",
    "server=PostgreSQL 17.11",
    "host=127.0.0.1",
    "port=$port",
    "anon_listed=6265",
    "anon_map=6265",
    "test_facility_hidden=true",
    "claims_and_edits_unchanged=true",
    "rollback=pass",
    "short_count_refused=true"
  ) -Encoding ascii
  Write-Output "DIRECTORY_VISIBILITY_REGRESSION_PASS"
  $hashes | ForEach-Object { Write-Output $_ }
} finally {
  & $pgctl -D $data stop -m fast | Out-Null
  if (Test-Path $data) { Remove-Item -Recurse -Force $data }
}
