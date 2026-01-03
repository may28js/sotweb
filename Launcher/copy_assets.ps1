param (
    [string]$SourceHome,
    [string]$DestHome,
    [string]$SourceStore,
    [string]$DestStore
)

[System.IO.Directory]::CreateDirectory($DestHome)
[System.IO.Directory]::CreateDirectory($DestStore)

function Copy-Files-DotNet {
    param (
        [string]$Source,
        [string]$Destination
    )
    
    if (-not [System.IO.Directory]::Exists($Source)) {
        Write-Host "Source directory not found: $Source"
        return
    }

    $files = [System.IO.Directory]::GetFiles($Source, "*", [System.IO.SearchOption]::AllDirectories)
    foreach ($file in $files) {
        $relativePath = $file.Substring($Source.Length)
        if ($relativePath.StartsWith("\")) { $relativePath = $relativePath.Substring(1) }
        $targetPath = [System.IO.Path]::Combine($Destination, $relativePath)
        $targetDir = [System.IO.Path]::GetDirectoryName($targetPath)
        
        if (-not [System.IO.Directory]::Exists($targetDir)) {
            [System.IO.Directory]::CreateDirectory($targetDir)
        }
        
        [System.IO.File]::Copy($file, $targetPath, $true)
    }
}

try {
    Write-Host "Copying Home assets..."
    Copy-Files-DotNet -Source $SourceHome -Destination $DestHome
    
    Write-Host "Copying Store assets..."
    Copy-Files-DotNet -Source $SourceStore -Destination $DestStore
    
    Write-Host "Assets copied successfully via .NET"
} catch {
    Write-Host "Error: $($_.Exception.Message)"
    Write-Host "Stack Trace: $($_.Exception.StackTrace)"
}
