$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

Write-Output "=== Building web app ==="
npm run build:web

Write-Output "`n=== Building Electron (unpacked) ==="
npx electron-builder --config electron-builder.json --dir

Write-Output "`n=== Building NSIS installer ==="
npx electron-builder --config electron-builder.json --prepackaged dist-electron\win-unpacked --win nsis

Write-Output "`n=== Building portable exe ==="
npx electron-builder --config electron-builder.json --prepackaged dist-electron\win-unpacked --win portable

Write-Output "`n=== Deploying to Desktop ==="
$desktop = [Environment]::GetFolderPath("Desktop")
Copy-Item "dist-electron\Folusho Victory Setup 0.0.0.exe" "$desktop\Folusho Victory webapp\Folusho Victory Setup 0.0.0.exe" -Force
Copy-Item "dist-electron\Folusho-Victory-0.0.0.exe" "$desktop\Folusho Victory webapp\Folusho Victory.exe" -Force

Write-Output "`nDone! Deployed to Desktop."
