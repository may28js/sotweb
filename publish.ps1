$ErrorActionPreference = "Stop"

Write-Host "Building Frontend..."
Push-Location Launcher/Frontend
# npm install # Skip install to save time if already installed
npm run build
if ($LASTEXITCODE -ne 0) { throw "Frontend build failed" }
Pop-Location

Write-Host "Publishing Host..."
$publishDir = "$PSScriptRoot/PublishOutput"
if (Test-Path $publishDir) { Remove-Item -Recurse -Force $publishDir }
dotnet publish Launcher/Host/StoryOfTimeLauncher.csproj -c Release -r win-x64 --self-contained true -o $publishDir -p:PublishSingleFile=true -p:IncludeNativeLibrariesForSelfExtract=true

Write-Host "Copying Frontend Assets..."
$wwwroot = "$publishDir/wwwroot"
New-Item -ItemType Directory -Force -Path $wwwroot | Out-Null
Copy-Item -Recurse -Force Launcher/Frontend/dist/* $wwwroot

Write-Host "Creating Zip Archive..."
$zipFile = "$PSScriptRoot/launcher.zip"
if (Test-Path $zipFile) { Remove-Item -Force $zipFile }
Compress-Archive -Path "$publishDir/*" -DestinationPath $zipFile

Write-Host "Done! Launcher zip created at: $zipFile"
