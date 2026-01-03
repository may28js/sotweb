try {
    $targetPath = "F:\工作区\模块开发\StoryOfTimeLauncher\WebBackend\Client\src\app\layout.tsx"
    if (Test-Path $targetPath) {
        Write-Host "Found file: $targetPath"
        $content = [System.IO.File]::ReadAllText($targetPath)
        $newContent = $content -replace "Story of Time - WoW Server", "时光故事 - World of Warcraft"
        $newContent = $newContent -replace "Official website for Story of Time World of Warcraft Server", "时光故事 - Story of Time World of Warcraft Server"
        
        if ($content -ne $newContent) {
            [System.IO.File]::WriteAllText($targetPath, $newContent)
            Write-Host "Layout updated successfully."
        } else {
            Write-Host "No changes needed."
        }
    } else {
        Write-Host "File not found: $targetPath"
    }
} catch {
    Write-Host "Error: $_"
}