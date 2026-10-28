$ErrorActionPreference = "Stop"
$root = Join-Path $PWD "artifacts/gcal-original-clock-proof"
New-Item -ItemType Directory -Force $root | Out-Null
$sourceRoot = Join-Path $PWD "artifacts/native"
$manifest = Get-Content (Join-Path $sourceRoot "manifest.json") -Raw | ConvertFrom-Json
$summary = Get-Content (Join-Path $sourceRoot "native-city-year-summary.json") -Raw | ConvertFrom-Json
if ($summary.gcalOriginalExeGitBlob -ne "1d20f6e0caf29b6293157d258d02287e4edf0481" -or
    $summary.completedCityYears -ne 908 -or $summary.failures.Count -gt 0) {
  throw "Wrong original GCal 11 source snapshot"
}
$targets = [Collections.Generic.List[object]]::new()
foreach ($record in $summary.records) {
  foreach ($p in $record.parana) {
    if ([string]::IsNullOrWhiteSpace([string]$p.from) -or
        [string]::IsNullOrWhiteSpace([string]$p.to)) {
      $targets.Add([pscustomobject]@{
        city = [string]$record.city; year = [int]$record.year;
        date = [string]$p.date; sourceFrom = [string]$p.from; sourceTo = [string]$p.to
      })
    }
  }
}
if ($targets.Count -ne 19) { throw "Expected 19 missing GCal source clocks; got $($targets.Count)" }
$origin = "https://raw.githubusercontent.com/gopaladasa/GCAL-for-Windows/master/gcal_11c/gcal.exe"
$exe = Join-Path $root "gcal.exe"
Invoke-WebRequest $origin -OutFile $exe
$raw = [IO.File]::ReadAllBytes($exe)
$pref = [Text.Encoding]::ASCII.GetBytes("blob " + $raw.Length + [char]0)
$hash = [Convert]::ToHexString(
  [Security.Cryptography.SHA1]::HashData([byte[]]($pref + $raw))
).ToLowerInvariant()
if ($hash -ne "1d20f6e0caf29b6293157d258d02287e4edf0481") { throw "Original GCal executable changed" }
$results = [Collections.Generic.List[object]]::new()
foreach ($target in $targets) {
  $city = $manifest.cities | Where-Object slug -eq $target.city | Select-Object -First 1
  if (-not $city) { throw "Missing original source location $($target.city)" }
  $output = Join-Path $root "$($target.city)-$($target.year).xml"
  $arguments = @("-R","calendar","-L",$city.coordinateArgument,"-N",$target.city,
    "-TZ","5:30","-SG","1-1-$($target.year)","-EC","365","-O",$output)
  $p = Start-Process -FilePath $exe -ArgumentList $arguments -Wait -PassThru -NoNewWindow
  if ($p.ExitCode -ne 0 -or !(Test-Path $output)) { throw "Original GCal replay failed $($target.city) $($target.year)" }
  [xml]$xml = Get-Content $output -Raw
  $day = @($xml.SelectNodes("//result/masa/day")) |
    Where-Object { [string]$_.date -eq $target.date } | Select-Object -First 1
  if (-not $day -or -not $day.parana) { throw "Missing original XML Parana node $($target.city) $($target.date)" }
  $from = [string]$day.parana.from
  $to = [string]$day.parana.to
  $after = [string]$day.parana.after
  $before = [string]$day.parana.before
  $results.Add([pscustomobject]@{
    city=$target.city;year=$target.year;date=$target.date;
    sourceSummaryFrom=$target.sourceFrom;sourceSummaryTo=$target.sourceTo;
    originalXmlFrom=$from;originalXmlTo=$to;
    originalXmlAfter=$after;originalXmlBefore=$before;
    originalParanaXml=$day.parana.OuterXml;
    originalSunriseXml=$day.sunrise.OuterXml;
    originalArunodayaXml=$day.arunodaya.OuterXml;
    verifiedOneSidedAfter=([string]::IsNullOrWhiteSpace($from) -and [string]::IsNullOrWhiteSpace($to) -and
      $after -match "^\d{2}:\d{2}$" -and [string]::IsNullOrWhiteSpace($before))
  })
  Remove-Item $output -Force
}
if ($results.Count -ne 19) { throw "Original XML source proof incomplete" }
$afterOnly = @($results | Where-Object { $_.verifiedOneSidedAfter -eq $true }).Count
$report = [pscustomobject]@{
  status = $(if ($afterOnly -eq 19) {"GCAL_ORIGINAL_19_AFTER_ONLY_CLOCKS_CONFIRMED"} else {"GCAL_SOURCE_CLOCK_PROVENANCE_MISMATCH"})
  originalExeGitBlob=$hash;expected=19;replayed=$results.Count;verifiedAfterOnly=$afterOnly;
  independentlyCertified=$false;publicRitualApproval=$false;
  warning="Original GCal after-only Parana is a genuine one-sided lower bound; never fabricate a source upper bound."
  records=@($results.ToArray())
}
$report | ConvertTo-Json -Depth 12 | Set-Content (Join-Path $root "original-gcal-clock-proof.json")
Remove-Item $exe -Force
Write-Host "[gcal-source-proof] replayed=$($results.Count) after-only=$afterOnly"
if ($afterOnly -ne 19) { throw "Original source after-only Parana could not be verified for all 19 cases" }
