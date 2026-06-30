$url = 'https://github.com/superfly/flyctl/releases/download/v0.4.60/flyctl_0.4.60_Windows_x86_64.zip'
$out = Join-Path $PSScriptRoot 'flyctl.zip'
$dest = Join-Path $PSScriptRoot 'flyctl-bin'

Write-Host "Downloading flyctl from $url"
Invoke-WebRequest -Uri $url -OutFile $out

if (Test-Path $dest) {
    Remove-Item $dest -Recurse -Force
}
Expand-Archive -LiteralPath $out -DestinationPath $dest -Force
Remove-Item $out -Force
Write-Host "Extracted flyctl to $dest"
Get-ChildItem -Path $dest -Filter flyctl.exe -Recurse | Select-Object FullName | Format-List
