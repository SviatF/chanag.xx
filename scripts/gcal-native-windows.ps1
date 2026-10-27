$ErrorActionPreference = "Stop"
$root = Join-Path $PWD "artifacts/gcal-native"
New-Item -ItemType Directory -Force $root | Out-Null
$exe = Join-Path $root "gcal.exe"
$help = Join-Path $root "gcal.chm"
$origin = "https://raw.githubusercontent.com/gopaladasa/GCAL-for-Windows/master/gcal_11c"
Invoke-WebRequest "$origin/gcal.exe" -OutFile $exe
Invoke-WebRequest "$origin/gcal.chm" -OutFile $help
$bytes = [IO.File]::ReadAllBytes($exe)
$prefix = [Text.Encoding]::ASCII.GetBytes("blob " + $bytes.Length + [char]0)
$sha1 = [Security.Cryptography.SHA1]::HashData([byte[]]($prefix + $bytes))
$gitBlob = [Convert]::ToHexString($sha1).ToLowerInvariant()
if ($gitBlob -ne "1d20f6e0caf29b6293157d258d02287e4edf0481") { throw "Original GCAL executable Git blob checksum mismatch: $gitBlob" }
$parameters = @("-R","calendar","-L","28N40;77E13","-N","Delhi","-SG","1-1-2027","-EC","365","-O",(Join-Path $root "delhi-2027.xml"))
$metadata = @{
 source="gopaladasa/GCAL-for-Windows/gcal_11c/gcal.exe"
 expectedBlob="1d20f6e0caf29b6293157d258d02287e4edf0481"
 actualBlob=$gitBlob
 parameters=$parameters
 note="Research-only actual binary execution, not an independent ISKCON algorithm implementation"
}
$metadata | ConvertTo-Json -Depth 8 | Set-Content (Join-Path $root "provenance.json")
$process = Start-Process -FilePath $exe -ArgumentList $parameters -Wait -PassThru -RedirectStandardOutput (Join-Path $root "stdout.txt") -RedirectStandardError (Join-Path $root "stderr.txt")
"ExitCode=$($process.ExitCode)" | Set-Content (Join-Path $root "exit.txt")
$output = Join-Path $root "delhi-2027.xml"
if($process.ExitCode -ne 0 -or !(Test-Path $output) -or (Get-Item $output).Length -lt 1000) {
 throw "Original GCal 11 binary did not produce a usable Delphi/Delhi 2027 calendar. See downloadable diagnostic artifact; NO certification."
}
Write-Host "Original GCal binary generated $( (Get-Item $output).Length ) bytes. This is an execution smoke test, not a full annual reconciliation."
