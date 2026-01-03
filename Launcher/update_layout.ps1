$path = "F:\工作区\模块开发\StoryOfTimeLauncher\WebBackend\Client\src\app\layout.tsx"
$content = [System.IO.File]::ReadAllText($path)
$content = $content -replace "Story of Time - WoW Server", "时光故事 - World of Warcraft"
$content = $content -replace "Official website for Story of Time World of Warcraft Server", "时光故事 - Story of Time World of Warcraft Server"
[System.IO.File]::WriteAllText($path, $content)
Write-Host "Layout updated."
