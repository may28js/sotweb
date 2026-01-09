Add-Type -AssemblyName System.Drawing
$currentDir = Get-Location
Write-Host "Current Dir: $currentDir"

$pngPath = ".\Frontend\public\images\sot.png"
$icoPath = ".\Host\sot.ico"

$absPng = [System.IO.Path]::GetFullPath($pngPath)
Write-Host "Absolute PNG Path: $absPng"

if (-not (Test-Path $absPng)) {
    Write-Error "PNG file not found at $absPng"
    exit
}

try {
    $img = [System.Drawing.Image]::FromFile($absPng)
    $ms = New-Object System.IO.MemoryStream

    # ICO Header (6 bytes)
    $ms.WriteByte(0); $ms.WriteByte(0)
    $ms.WriteByte(1); $ms.WriteByte(0)
    $ms.WriteByte(1); $ms.WriteByte(0)

    # ICO Directory Entry
    $w = $img.Width
    $h = $img.Height
    if ($w -ge 256) { $bW = 0 } else { $bW = [byte]$w }
    if ($h -ge 256) { $bH = 0 } else { $bH = [byte]$h }
    
    $ms.WriteByte($bW)
    $ms.WriteByte($bH)
    $ms.WriteByte(0)
    $ms.WriteByte(0)
    $ms.WriteByte(1); $ms.WriteByte(0)
    $ms.WriteByte(32); $ms.WriteByte(0)

    $pngMs = New-Object System.IO.MemoryStream
    $img.Save($pngMs, [System.Drawing.Imaging.ImageFormat]::Png)
    $pngBytes = $pngMs.ToArray()
    $size = $pngBytes.Length

    $ms.Write([BitConverter]::GetBytes([int]$size), 0, 4)
    $offset = 22
    $ms.Write([BitConverter]::GetBytes([int]$offset), 0, 4)
    $ms.Write($pngBytes, 0, $size)

    $absIco = [System.IO.Path]::GetFullPath($icoPath)
    [System.IO.File]::WriteAllBytes($absIco, $ms.ToArray())
    
    Write-Host "SUCCESS: Created $absIco"
} catch {
    Write-Error "Failed: $_"
} finally {
    if ($img) { $img.Dispose() }
    if ($ms) { $ms.Dispose() }
    if ($pngMs) { $pngMs.Dispose() }
}
