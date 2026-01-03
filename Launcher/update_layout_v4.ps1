
$ErrorActionPreference = "Stop"

try {
    # Get the script's directory
    $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
    
    # Construct relative path to the target file
    # Assuming script is in F:\工作区\模块开发\StoryOfTimeLauncher\Launcher
    # Target is F:\工作区\模块开发\StoryOfTimeLauncher\WebBackend\Client\src\app\layout.tsx
    $relativePath = "..\WebBackend\Client\src\app\layout.tsx"
    $targetPath = Join-Path $scriptDir $relativePath
    $targetPath = $targetPath -replace "/", "\" # Ensure Windows separators

    Write-Host "Target path: $targetPath"

    if (Test-Path $targetPath) {
        Write-Host "Found file: $targetPath"
        # Read with explicit UTF8 encoding
        $content = [System.IO.File]::ReadAllText($targetPath, [System.Text.Encoding]::UTF8)
        
        $newContent = $content -replace "Story of Time - WoW Server", "时光故事 - World of Warcraft"
        $newContent = $newContent -replace "Official website for Story of Time World of Warcraft Server", "时光故事 - Story of Time World of Warcraft Server"
        
        if ($content -ne $newContent) {
            # Write with explicit UTF8 encoding
            [System.IO.File]::WriteAllText($targetPath, $newContent, [System.Text.Encoding]::UTF8)
            Write-Host "Layout updated successfully."
        } else {
            Write-Host "No changes needed."
        }
    } else {
        Write-Host "File not found at resolved path: $targetPath"
        # Debug: list directory to see where we are
        Get-ChildItem -Path (Join-Path $scriptDir "..") -Depth 2 | Select-Object FullName
    }
} catch {
    Write-Host "Error: $_"
    Write-Host "Stack Trace: $($_.ScriptStackTrace)"
}
