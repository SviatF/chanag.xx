# Research-only exact GCal 11 dawn trace for every remaining disagreement.
# Dates come from a read-only comparison ledger. GCal observations are never
# supplied to the independent fasting-day classifier or public rendering.
$ErrorActionPreference = "Stop"
$root = Join-Path $PWD "artifacts/gcal-original-dawn-trace"
New-Item -ItemType Directory -Force $root | Out-Null
$ledger = Get-Content (Join-Path $PWD "artifacts/gcal-evidence/independent-454-adjudication.json") -Raw | ConvertFrom-Json
$manifest = Get-Content (Join-Path $PWD "artifacts/native/manifest.json") -Raw | ConvertFrom-Json
if ($ledger.status -ne "RESEARCH_GAPS_FULLY_ACCOUNTED_FOR_NOT_CERTIFIED" -or
    $ledger.independentCertification -ne $false -or $ledger.publicRitualApproval -ne $false -or
    $ledger.totals.fastDateDisagreements -ne 128 -or
    $ledger.totals.bidirectionalSubtypeDisagreements -ne 104 -or
    $manifest.count -ne 454) { throw "Wrong original fixed 454-city research evidence" }
$targets = @{}
foreach ($kind in @("fastDateCases","sourceOnlySubtypeCases","independentOnlySubtypeCases")) {
  foreach ($case in $ledger.$kind) {
    if ($case.year -notin @(2026,2027)) { throw "Invalid research year" }
    $key = "$($case.city)/$($case.year)"
    if (-not $targets.ContainsKey($key)) {
      $targets[$key] = [Collections.Generic.HashSet[string]]::new([StringComparer]::Ordinal)
    }
    [void]$targets[$key].Add([string]$case.date)
  }
}
if ($targets.Count -lt 1 -or $targets.Count -gt 908) { throw "Missing or incorrect source trace targets" }
$origin = "https://raw.githubusercontent.com/gopaladasa/GCAL-for-Windows/master/gcal_11c/gcal.exe"
$exe = Join-Path $root "gcal.exe"
Invoke-WebRequest $origin -OutFile $exe
$raw = [IO.File]::ReadAllBytes($exe)
$header = [Text.Encoding]::ASCII.GetBytes("blob " + $raw.Length + [char]0)
$hash = [Convert]::ToHexString(
  [Security.Cryptography.SHA1]::HashData([byte[]]($header + $raw))
).ToLowerInvariant()
if ($hash -ne "1d20f6e0caf29b6293157d258d02287e4edf0481") {
  throw "Original GCal native executable SHA mismatch"
}
$found = [Collections.Generic.List[object]]::new()
$cases = [Collections.Generic.List[object]]::new()
foreach ($key in @($targets.Keys | Sort-Object)) {
  $parts=$key.Split("/")
  $slug=$parts[0];$year=[int]$parts[1]
  $city=$manifest.cities | Where-Object slug -eq $slug | Select-Object -First 1
  if (-not $city) { throw "Missing GCal source city $slug" }
  $dates = $targets[$key]
  $all = [Collections.Generic.HashSet[string]]::new([StringComparer]::Ordinal)
  foreach ($iso in $dates) {
    $base=[datetime]::ParseExact($iso,"yyyy-MM-dd",[Globalization.CultureInfo]::InvariantCulture)
    for($d=-2;$d -le 9;$d++){
      $add=$base.AddDays($d)
      if ($add.Year -eq $year) {[void]$all.Add($add.ToString("d MMM yyyy",[Globalization.CultureInfo]::InvariantCulture))}
    }
  }
  $xmlPath = Join-Path $root "$slug-$year.xml"
  $args=@("-R","calendar","-L",$city.coordinateArgument,"-N",$slug,"-TZ","5:30",
    "-SG","1-1-$year","-EC","365","-O",$xmlPath)
  $p=Start-Process -FilePath $exe -ArgumentList $args -Wait -PassThru -NoNewWindow
  if ($p.ExitCode -ne 0 -or !(Test-Path $xmlPath)){throw "GCal raw XML trace execution failed $key"}
  [xml]$xml=Get-Content $xmlPath -Raw
  $dayMap=@{}
  foreach ($day in @($xml.SelectNodes("//result/masa/day"))) {
    $nativeDate=[string]$day.date
    if (-not $all.Contains($nativeDate)) { continue }
    $dayMap[$nativeDate]=$day
    $iso=[datetime]::ParseExact($nativeDate,"d MMM yyyy",[Globalization.CultureInfo]::InvariantCulture).ToString("yyyy-MM-dd")
    $found.Add([pscustomobject]@{
      city=$slug;year=$year;date=$iso;latitude=$city.lat;longitude=$city.lng
      sunriseXml=$day.sunrise.OuterXml
      arunodayaXml=$day.arunodaya.OuterXml
      sunsetXml=$day.sunset.OuterXml
      fastXml=$day.fast.OuterXml
      paranaXml=$day.parana.OuterXml
      festivalXml=@($day.festival | ForEach-Object {$_.OuterXml})
    })
  }
  foreach ($iso in $dates) {
    $nativeDate=([datetime]::ParseExact($iso,"yyyy-MM-dd",[Globalization.CultureInfo]::InvariantCulture)).ToString("d MMM yyyy",[Globalization.CultureInfo]::InvariantCulture)
    if (-not $dayMap.ContainsKey($nativeDate)) {throw "Missing exact original GCal event $key $iso"}
    $cases.Add([pscustomobject]@{city=$slug;year=$year;date=$iso})
  }
  Remove-Item $xmlPath -Force
}
Remove-Item $exe -Force
$report=[pscustomobject]@{
  status="RAW_GCAL_DAWN_TRACE_COMPLETE_RESEARCH_ONLY"
  originalExeGitBlob=$hash
  matchedComparisonCases=$cases.Count
  uniqueCityYears=$targets.Count
  observedDayXmlRows=$found.Count
  independentlyCertified=$false;publicRitualApproval=$false
  matchedCases=@($cases.ToArray());dailySourceEvidence=@($found.ToArray())
  warning="Original GCal dawn XML is a reference trace only, not direct evidence that either astronomical model or ritual rule is physically correct."
}
$path=Join-Path $root "original-gcal-dawn-trace.json"
$report | ConvertTo-Json -Depth 20 | Set-Content $path
Write-Host "[gcal-dawn-replay] cityYears=$($targets.Count) cases=$($cases.Count) sourceDayRows=$($found.Count)"
if ($found.Count -lt $cases.Count){throw "Incomplete raw GCal research dawn coverage"}
