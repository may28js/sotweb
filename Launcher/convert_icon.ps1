Add-Type -AssemblyName System.Drawing
$pngPath = "F:\工作区\模块开发\StoryOfTimeLauncher\Launcher\Frontend\public\images\sot.png"
$icoPath = "F:\工作区\模块开发\StoryOfTimeLauncher\Launcher\Host\sot.ico"

try {
    $img = [System.Drawing.Image]::FromFile($pngPath)
    $ms = New-Object System.IO.MemoryStream

    # ICO Header (6 bytes)
    # Reserved (2)
    $ms.WriteByte(0); $ms.WriteByte(0)
    # Type (2) - 1 for Icon
    $ms.WriteByte(1); $ms.WriteByte(0)
    # Count (2) - 1 image
    $ms.WriteByte(1); $ms.WriteByte(0)

    # ICO Directory Entry (16 bytes)
    $w = $img.Width
    $h = $img.Height
    # 0 means 256
    if ($w -ge 256) { $bW = 0 } else { $bW = [byte]$w }
    if ($h -ge 256) { $bH = 0 } else { $bH = [byte]$h }
    
    $ms.WriteByte($bW) # Width
    $ms.WriteByte($bH) # Height
    $ms.WriteByte(0)   # ColorCount (0 if >= 8bpp)
    $ms.WriteByte(0)   # Reserved
    $ms.WriteByte(1)   # Planes (0 or 1, usually 1)
    $ms.WriteByte(0)   
    $ms.WriteByte(32)  # BitCount (32 for RGBA)
    $ms.WriteByte(0)

    # Convert image to PNG in memory to get size
    $pngMs = New-Object System.IO.MemoryStream
    $img.Save($pngMs, [System.Drawing.Imaging.ImageFormat]::Png)
    $pngBytes = $pngMs.ToArray()
    $size = $pngBytes.Length

    # SizeInBytes (4)
    $ms.Write([BitConverter]::GetBytes([int]$size), 0, 4)
    
    # FileOffset (4) - 6 (header) + 16 (entry) = 22
    $offset = 22
    $ms.Write([BitConverter]::GetBytes([int]$offset), 0, 4)

    # Write Image Data (PNG)
    $ms.Write($pngBytes, 0, $size)

    # Save to file
    [System.IO.File]::WriteAllBytes($icoPath, $ms.ToArray())
    
    Write-Host "SUCCESS: Created $icoPath"
} catch {
    Write-Error "Failed: $_"
} finally {
    if ($img) { $img.Dispose() }
    if ($ms) { $ms.Dispose() }
    if ($pngMs) { $pngMs.Dispose() }
}
