
$sourceVideo = "F:\工作区\模块开发\StoryOfTimeLauncher\WebBackend\关键页面截图\header-video.mp4"
$destDir = "F:\工作区\模块开发\StoryOfTimeLauncher\WebBackend\Client\public\video"
$destVideo = Join-Path $destDir "hero-bg.mp4"

# Create directory if it doesn't exist
if (-not (Test-Path $destDir)) {
    New-Item -ItemType Directory -Path $destDir -Force | Out-Null
    Write-Host "Created directory: $destDir"
}

# Copy video file
if (Test-Path $sourceVideo) {
    Copy-Item $sourceVideo $destVideo -Force
    Write-Host "Copied video to $destVideo"
} else {
    Write-Host "Error: Source video not found at $sourceVideo"
}
