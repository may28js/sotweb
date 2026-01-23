
# StoryOfTime Launcher Build & Run Script

$ErrorActionPreference = "Stop"

$scriptPath = $PSScriptRoot
$frontendPath = Join-Path $scriptPath "Frontend"
$hostPath = Join-Path $scriptPath "Host"
$wwwrootPath = Join-Path $hostPath "wwwroot"
$buildOutputPath = Join-Path $scriptPath "BuildOutput"

Write-Host "=== Step 1: Building Frontend ===" -ForegroundColor Cyan
Push-Location $frontendPath
try {
    Write-Host "Installing dependencies..."
    npm install
    Write-Host "Building React app..."
    npm run build
}
finally {
    Pop-Location
}

Write-Host "=== Step 2: Updating Host Resources ===" -ForegroundColor Cyan
if (Test-Path $wwwrootPath) {
    Write-Host "Removing old wwwroot..."
    Remove-Item $wwwrootPath -Recurse -Force
}
Write-Host "Copying dist to wwwroot..."
Copy-Item (Join-Path $frontendPath "dist") -Destination $wwwrootPath -Recurse

Write-Host "=== Step 3: Publishing Host (C#) ===" -ForegroundColor Cyan
Push-Location $hostPath
try {
    Write-Host "Cleaning intermediate files..."
    dotnet clean
    if (Test-Path "bin") { Remove-Item "bin" -Recurse -Force }
    if (Test-Path "obj") { Remove-Item "obj" -Recurse -Force }
    
    Write-Host "Cleaning output directory: $buildOutputPath"
    if (Test-Path $buildOutputPath) { Remove-Item $buildOutputPath -Recurse -Force }
    
    Write-Host "Publishing to isolated directory..."
    dotnet publish -c Release -o $buildOutputPath
}
finally {
    Pop-Location
}

Write-Host "=== Step 4: Running Launcher ===" -ForegroundColor Cyan
$exePath = Join-Path $buildOutputPath "SotLauncher.exe"

if (Test-Path $exePath) {
    Write-Host "Starting isolated build: $exePath" -ForegroundColor Green
    Start-Process $exePath
    Write-Host "Launcher started." -ForegroundColor Green
} else {
    Write-Error "Executable not found at $exePath"
}
