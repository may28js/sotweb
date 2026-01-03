$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Definition
$rootPath = Resolve-Path "$scriptPath\..\WebBackend\Client\src\app"
$path = Join-Path $rootPath "layout.tsx"

if (Test-Path $path) {
    $content = [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)
    # Fix the broken className
    $newContent = $content.Replace('className={h-full bg-[#1a1a1a]  }', 'className={`${inter.variable} ${cinzel.variable} h-full bg-[#1a1a1a]`}')
    
    # If the replace didn't work (maybe whitespace diff), try a regex or just overwrite the file with known good content if I had it.
    # But for now, let's try strict replace. 
    # Actually, the Read output showed exactly: className={h-full bg-[#1a1a1a]  }
    # Note the double space.
    
    if ($newContent -eq $content) {
        # Fallback: Replace the whole html tag line
        $newContent = $content -replace '<html lang="en" className=\{h-full bg-\[#1a1a1a\]\s+\}>', '<html lang="en" className={`${inter.variable} ${cinzel.variable} h-full bg-[#1a1a1a]`}>'
    }

    [System.IO.File]::WriteAllText($path, $newContent, [System.Text.Encoding]::UTF8)
    Write-Host "Fixed layout.tsx"
} else {
    Write-Error "File not found: $path"
}
