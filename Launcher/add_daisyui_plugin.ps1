
$path = "..\WebBackend\Client\tailwind.config.js"
$resolvedPath = Resolve-Path $path
$content = [System.IO.File]::ReadAllText($resolvedPath)
$newContent = $content.Replace("plugins: [],", "plugins: [require('daisyui')],")
[System.IO.File]::WriteAllText($resolvedPath, $newContent)
Write-Host "Updated tailwind.config.js with daisyui plugin"
