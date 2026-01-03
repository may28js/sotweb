$targetPath = Resolve-Path "..\WebBackend\Client\src\app\layout.tsx"
if ($targetPath) {
    Write-Host "Found file: $targetPath"
    $content = [System.IO.File]::ReadAllText($targetPath)
    $content = $content -replace "Story of Time - WoW Server", "时光故事 - World of Warcraft"
    $content = $content -replace "Official website for Story of Time World of Warcraft Server", "时光故事 - Story of Time World of Warcraft Server"
    [System.IO.File]::WriteAllText($targetPath, $content)
    Write-Host "Layout updated successfully."
} else {
    Write-Host "File not found."
}