$ErrorActionPreference = "Stop"
$env:PGSSLMODE = "disable"
Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue

$proposal = Split-Path $PSScriptRoot -Parent
$sql = Join-Path $proposal "preflight_phase5a_directory_visibility.sql"
$fixture = Join-Path $PSScriptRoot "pg1711_directory_visibility_fixture.sql"
$manifest = Join-Path $proposal "20261105170000_wa_afh_directory_visibility.sha256"
$bin = Join-Path $env:TEMP "pg1711\pgsql\bin"
$psql = Join-Path $bin "psql.exe"
$initdb = Join-Path $bin "initdb.exe"
$pgctl = Join-Path $bin "pg_ctl.exe"
$port = 55455
$run = Join-Path $env:TEMP "nchf-preflight-phase5a-run"
$data = Join-Path $run "data"
$log = Join-Path $run "postgresql.log"

$preflightText = Get-Content -Raw $sql
if ($preflightText -notmatch "aws-1-us-west-2\.pooler\.supabase\.com") { throw "documented command omits the development host" }
if ($preflightText -notmatch "postgres\.ajjsyloyihcqdomywhik") { throw "documented command omits the development login" }
if ($preflightText -notmatch "PGSSLMODE = `"verify-full`"") { throw "documented command omits TLS verification" }
if ($preflightText -notmatch "PGSSLROOTCERT") { throw "documented command omits the existing root certificate" }
if ($preflightText -notmatch "-v ON_ERROR_STOP=1") { throw "documented command omits ON_ERROR_STOP" }
if ($preflightText -match "PGPASSWORD\s*=") { throw "documented command assigns a password" }
Write-Output "CASE documented_command=pass"

$packaged = @(
  "20261105170000_wa_afh_directory_visibility.sql",
  "20261105170000_wa_afh_directory_visibility_ROLLBACK.sql",
  "20261105170000_wa_afh_directory_visibility_APP.md",
  "pg1711_directory_visibility_fixture.sql",
  "pg1711_directory_visibility_checks.sql",
  "pg1711_directory_visibility_rollback_checks.sql",
  "pg1711_directory_visibility_runner.ps1"
)
$recorded = @{}
foreach ($line in @(Get-Content $manifest)) {
  if ($line.Trim() -eq "") { continue }
  $parts = $line -split "  ", 2
  $recorded[$parts[1].Trim()] = $parts[0].Trim().ToLower()
}
foreach ($name in $packaged) {
  $path = if ($name -like "pg1711_*") { Join-Path $PSScriptRoot $name } else { Join-Path $proposal $name }
  $actual = (Get-FileHash -Algorithm SHA256 $path).Hash.ToLower()
  if ($actual -ne $recorded[$name]) { throw "package hash changed: $name" }
}
Write-Output "CASE package_hashes_unchanged=pass"

function Invoke-LocalPsql {
  param([string]$Database, [string]$User, [string]$File, [string]$Command)
  $arguments = "-h 127.0.0.1 -p $port -U $User -d $Database -v ON_ERROR_STOP=1"
  if ($File) { $arguments += " -f `"$File`"" } else { $arguments += " -c `"$Command`"" }
  $process = New-Object System.Diagnostics.Process
  $process.StartInfo.FileName = $psql
  $process.StartInfo.Arguments = $arguments
  $process.StartInfo.UseShellExecute = $false
  $process.StartInfo.RedirectStandardOutput = $true
  $process.StartInfo.RedirectStandardError = $true
  [void]$process.Start()
  $stdout = $process.StandardOutput.ReadToEndAsync()
  $stderr = $process.StandardError.ReadToEndAsync()
  $process.WaitForExit()
  return @{ Code = $process.ExitCode; Output = $stdout.Result + $stderr.Result }
}

function Assert-PreflightEnded {
  param([hashtable]$Result, [string]$Label)
  if ($Result.Code -ne 0) { throw "$Label exited $($Result.Code): $($Result.Output)" }
  if ($Result.Output -match "(?m)^ERROR:" -or $Result.Output -match "ERROR:") { throw "$Label raised an SQL error: $($Result.Output)" }
  if ([regex]::Matches($Result.Output, "(?m)^ROLLBACK\s*$").Count -ne 1) { throw "$Label did not end with ROLLBACK: $($Result.Output)" }
  if ([regex]::Matches($Result.Output, "(?m)^COMMIT\s*$").Count -ne 0) { throw "$Label committed: $($Result.Output)" }
}

$runCreated = $false
try {
  if (Test-Path $run) { Remove-Item -Recurse -Force $run }
  New-Item -ItemType Directory -Force -Path $run | Out-Null
  $runCreated = $true
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

  $loaded = Invoke-LocalPsql -Database "postgres" -User "bootstrap" -File $fixture
  if ($loaded.Code -ne 0) { throw $loaded.Output }
  $normal = Invoke-LocalPsql -Database "postgres" -User "postgres" -File $sql
  Assert-PreflightEnded -Result $normal -Label "normal preflight"
  if ($normal.Output -notmatch "RESULT\|distribution\|INFO\|total=6267") { throw "normal distribution total was not reported: $($normal.Output)" }
  if ($normal.Output -notmatch "RESULT\|distribution\|INFO\|source=wa_dshs_afh\|status=source_matched\|rows=6265") { throw "normal source distribution was not reported" }
  if ($normal.Output -match "RESULT\|distribution\|(total|grouped)\|FAIL") { throw "normal distribution failed" }
  $unchanged = Invoke-LocalPsql -Database "postgres" -User "postgres" -Command "select (to_regclass('public.nchf_phase5a_facilities_acl_snapshot') is null)::text || '|' || (select count(*) from pg_policy where polname = 'facilities_public_read_wa_afh_source_matched')::text;"
  if ($unchanged.Code -ne 0 -or $unchanged.Output -notmatch "true\|0") { throw "normal preflight changed the database: $($unchanged.Output)" }
  Write-Output "CASE normal_preflight=pass"
  Write-Output "CASE normal_rollback=pass"
  Write-Output "CASE normal_no_persistent_changes=pass"

  $reset = "drop schema public cascade; create schema public; grant usage, create on schema public to postgres;"
  $missingRelation = Invoke-LocalPsql -Database "postgres" -User "bootstrap" -Command $reset
  if ($missingRelation.Code -ne 0) { throw $missingRelation.Output }
  $missingRun = Invoke-LocalPsql -Database "postgres" -User "postgres" -File $sql
  Assert-PreflightEnded -Result $missingRun -Label "missing facilities"
  if ($missingRun.Output -notmatch "RESULT\|distribution\|total\|FAIL\|rows=<unavailable>\|missing=relation") { throw "missing relation did not fail the total query: $($missingRun.Output)" }
  if ($missingRun.Output -notmatch "RESULT\|distribution\|grouped\|FAIL\|rows=<unavailable>\|missing=relation") { throw "missing relation did not fail the grouped query: $($missingRun.Output)" }
  $stillMissing = Invoke-LocalPsql -Database "postgres" -User "postgres" -Command "select (to_regclass('public.facilities') is null)::text;"
  if ($stillMissing.Code -ne 0 -or $stillMissing.Output -notmatch "true") { throw "missing-relation preflight created facilities: $($stillMissing.Output)" }
  Write-Output "CASE missing_facilities_relation=pass"

  $withoutSource = Invoke-LocalPsql -Database "postgres" -User "postgres" -Command "create table public.facilities (id uuid primary key, record_status text);"
  if ($withoutSource.Code -ne 0) { throw $withoutSource.Output }
  $sourceRun = Invoke-LocalPsql -Database "postgres" -User "postgres" -File $sql
  Assert-PreflightEnded -Result $sourceRun -Label "missing source_name"
  if ($sourceRun.Output -notmatch "RESULT\|distribution\|total\|FAIL\|rows=<unavailable>\|missing=source_name") { throw "missing source_name did not fail both distribution queries: $($sourceRun.Output)" }
  if ($sourceRun.Output -notmatch "RESULT\|distribution\|grouped\|FAIL\|rows=<unavailable>\|missing=source_name") { throw "missing source_name did not fail the grouped query: $($sourceRun.Output)" }
  $sourceRemains = Invoke-LocalPsql -Database "postgres" -User "postgres" -Command "select (count(*) = 0)::text from pg_attribute where attrelid = 'public.facilities'::regclass and attname = 'source_name' and attnum > 0 and not attisdropped;"
  if ($sourceRemains.Code -ne 0 -or $sourceRemains.Output -notmatch "true") { throw "missing source_name was altered: $($sourceRemains.Output)" }
  Write-Output "CASE missing_source_name=pass"

  $dropFacilities = Invoke-LocalPsql -Database "postgres" -User "postgres" -Command "drop table public.facilities;"
  if ($dropFacilities.Code -ne 0) { throw $dropFacilities.Output }
  $withoutStatus = Invoke-LocalPsql -Database "postgres" -User "postgres" -Command "create table public.facilities (id uuid primary key, source_name text);"
  if ($withoutStatus.Code -ne 0) { throw $withoutStatus.Output }
  $statusRun = Invoke-LocalPsql -Database "postgres" -User "postgres" -File $sql
  Assert-PreflightEnded -Result $statusRun -Label "missing record_status"
  if ($statusRun.Output -notmatch "RESULT\|distribution\|total\|FAIL\|rows=<unavailable>\|missing=record_status") { throw "missing record_status did not fail both distribution queries: $($statusRun.Output)" }
  if ($statusRun.Output -notmatch "RESULT\|distribution\|grouped\|FAIL\|rows=<unavailable>\|missing=record_status") { throw "missing record_status did not fail the grouped query: $($statusRun.Output)" }
  Write-Output "CASE missing_record_status=pass"

  $dropAgain = Invoke-LocalPsql -Database "postgres" -User "postgres" -Command "drop table public.facilities;"
  if ($dropAgain.Code -ne 0) { throw $dropAgain.Output }
  $incomplete = Invoke-LocalPsql -Database "postgres" -User "postgres" -Command "create table public.facilities (id uuid primary key);"
  if ($incomplete.Code -ne 0) { throw $incomplete.Output }
  $incompleteRun = Invoke-LocalPsql -Database "postgres" -User "postgres" -File $sql
  Assert-PreflightEnded -Result $incompleteRun -Label "incomplete facilities"
  if ($incompleteRun.Output -notmatch "RESULT\|distribution\|total\|FAIL\|rows=<unavailable>\|missing=record_status,source_name") { throw "incomplete schema did not fail the total query: $($incompleteRun.Output)" }
  if ($incompleteRun.Output -notmatch "RESULT\|distribution\|grouped\|FAIL\|rows=<unavailable>\|missing=record_status,source_name") { throw "incomplete schema did not fail the grouped query: $($incompleteRun.Output)" }
  $columnCount = Invoke-LocalPsql -Database "postgres" -User "postgres" -Command "select count(*)::text from pg_attribute where attrelid = 'public.facilities'::regclass and attnum > 0 and not attisdropped;"
  if ($columnCount.Code -ne 0 -or $columnCount.Output -notmatch "(?m)^\s*1\s*$") { throw "incomplete facilities schema changed: $($columnCount.Output)" }
  Write-Output "CASE incomplete_facilities_schema=pass"

  $dropFinal = Invoke-LocalPsql -Database "postgres" -User "postgres" -Command "drop table public.facilities; create sequence public.facilities;"
  if ($dropFinal.Code -ne 0) { throw $dropFinal.Output }
  $structureRun = Invoke-LocalPsql -Database "postgres" -User "postgres" -File $sql
  Assert-PreflightEnded -Result $structureRun -Label "incomplete relation kind"
  if ($structureRun.Output -notmatch "RESULT\|distribution\|total\|FAIL\|rows=<unavailable>\|missing=structure") { throw "non-table facilities did not fail safely: $($structureRun.Output)" }
  if ($structureRun.Output -notmatch "RESULT\|distribution\|grouped\|FAIL\|rows=<unavailable>\|missing=structure") { throw "non-table facilities did not fail the grouped query: $($structureRun.Output)" }
  Write-Output "CASE incomplete_relation_kind=pass"

  Write-Output "PREFLIGHT_DISTRIBUTION_REGRESSION_PASS"
} finally {
  if (Test-Path $data) {
    & $pgctl -D $data stop -m fast | Out-Null
    if ($LASTEXITCODE -ne 0) { & $pgctl -D $data stop -m immediate | Out-Null }
  }
  if ($runCreated -and (Test-Path $run)) { Remove-Item -Recurse -Force $run }
  if (Test-Path $run) { throw "preflight regression left $run" }
}
