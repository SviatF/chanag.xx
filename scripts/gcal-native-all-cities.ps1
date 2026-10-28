$ErrorActionPreference="Stop"
$dir=Join-Path $PWD "artifacts/gcal-city-run"
New-Item -ItemType Directory -Force $dir | Out-Null
$origin="https://raw.githubusercontent.com/gopaladasa/GCAL-for-Windows/master/gcal_11c/gcal.exe"
$exe=Join-Path $dir "gcal.exe"
Invoke-WebRequest $origin -OutFile $exe
$raw=[IO.File]::ReadAllBytes($exe)
$pref=[Text.Encoding]::ASCII.GetBytes("blob "+$raw.Length+[char]0)
$hash=[Convert]::ToHexString([Security.Cryptography.SHA1]::HashData([byte[]]($pref+$raw))).ToLowerInvariant()
if($hash -ne "1d20f6e0caf29b6293157d258d02287e4edf0481"){throw "GCal binary hash mismatch"}
$manifest=Get-Content (Join-Path $dir "manifest.json") -Raw | ConvertFrom-Json
if($manifest.count -lt 400){throw "Expected all city registry, got $($manifest.count)"}
$records=[Collections.Generic.List[object]]::new()
$failures=[Collections.Generic.List[string]]::new()
foreach($city in $manifest.cities){
 foreach($year in @(2026,2027)){
  $name="$($city.slug)-$year"
  $output=Join-Path $dir "$name.xml"
  $args=@("-R","calendar","-L",$city.coordinateArgument,"-N",$city.slug,"-TZ","5:30","-SG","1-1-$year","-EC","365","-O",$output)
  try{
   $p=Start-Process -FilePath $exe -ArgumentList $args -Wait -PassThru -NoNewWindow
   if($p.ExitCode -ne 0 -or !(Test-Path $output)){throw "GCal exit $($p.ExitCode)"}
   [xml]$doc=Get-Content $output -Raw
   $request=$doc.xml.request
   $tz=[double]::Parse([string]($request.arg | Where-Object name -eq "timezone").val,[Globalization.CultureInfo]::InvariantCulture)
   $lat=[double]::Parse([string]($request.arg | Where-Object name -eq "latitude").val,[Globalization.CultureInfo]::InvariantCulture)
   $lng=[double]::Parse([string]($request.arg | Where-Object name -eq "longitude").val,[Globalization.CultureInfo]::InvariantCulture)
   if([math]::Abs($tz-5.5) -gt 0.001 -or [math]::Abs($lat-$city.lat) -gt 0.01 -or [math]::Abs($lng-$city.lng) -gt 0.01){throw "Incorrect timezone or position in generated XML"}
   $days=@($doc.SelectNodes("//result/masa/day"))
   if($days.Count -ne 365){throw "Unexpected day count $($days.Count)"}
   $fast=[Collections.Generic.List[object]]::new()
   $parana=[Collections.Generic.List[object]]::new()
   $mahadvadasi=[Collections.Generic.List[object]]::new()
   foreach($d in $days){
    $date=[string]$d.date
    $sunTithi=[string]$d.sunrise.tithi.name
    $arunodaya=[string]$d.arunodaya.tithi.name
    if($d.fast){$fast.Add(@{date=$date;sunriseTithi=$sunTithi;arunodayaTithi=$arunodaya})}
    if($d.parana){$parana.Add(@{date=$date;from=[string]$d.parana.from;to=[string]$d.parana.to;after=[string]$d.parana.after;before=[string]$d.parana.before;sunriseTithi=$sunTithi})}
    foreach($festival in @($d.festival)){if($festival -and [string]$festival.name -match "Mahadvadasi"){$mahadvadasi.Add(@{date=$date;subtype=[string]$festival.name})}}
   }
   $records.Add(@{city=$city.slug;year=$year;lat=$lat;lng=$lng;timezone=$tz;days=$days.Count;fasts=@($fast.ToArray());parana=@($parana.ToArray());mahadvadasi=@($mahadvadasi.ToArray())})
  }catch{
   $failures.Add("$name : "+$_)
  }finally{
   if(Test-Path $output){Remove-Item $output -Force}
  }
 }
}
$summary=@{gcalOriginalExeGitBlob=$hash;cityCount=$manifest.count;expectedCityYears=$manifest.count*2;completedCityYears=$records.Count;failures=@($failures.ToArray());records=@($records.ToArray());researchOnly=$true;publicRitualApproved=$false;hasIndependentSecondMethod=$false}
$summary | ConvertTo-Json -Depth 16 | Set-Content (Join-Path $dir "native-city-year-summary.json")
Remove-Item $exe -Force
Write-Host "GCal Windows complete city-years=$($records.Count)/$($manifest.count*2), failures=$($failures.Count)"
if($failures.Count -gt 0 -or $records.Count -ne $manifest.count*2){$failures | Select-Object -First 20 | ForEach-Object {Write-Error $_};throw "Full-city native GCal comparison is INCOMPLETE. Public ritual release remains blocked."}
