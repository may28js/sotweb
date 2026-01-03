
$basePath = Resolve-Path "..\WebBackend\Client\public\demo-assets"
$homePath = Join-Path $basePath "home"
$storePath = Join-Path $basePath "store"

# Helper to copy if source exists
function Copy-If-Exists ($src, $dest) {
    if (Test-Path $src) {
        Copy-Item $src $dest -Force
        Write-Host "Copied $src to $dest"
    } else {
        Write-Host "Source not found: $src"
    }
}

# Map Hero Background
Copy-If-Exists (Join-Path $homePath "24.jpeg") (Join-Path $basePath "hero-bg.jpg")

# Map News Images (placeholder mapping)
Copy-If-Exists (Join-Path $homePath "7.jpg") (Join-Path $basePath "news-1.jpg")
Copy-If-Exists (Join-Path $homePath "5.jpeg") (Join-Path $basePath "news-2.jpg")
Copy-If-Exists (Join-Path $homePath "8.webp") (Join-Path $basePath "news-3.webp")

# Map Store Images
Copy-If-Exists (Join-Path $storePath "gold-crate.webp") (Join-Path $basePath "gold-crate.webp")
Copy-If-Exists (Join-Path $storePath "phoenix-alar.jpg") (Join-Path $basePath "phoenix-alar.jpg")
Copy-If-Exists (Join-Path $storePath "level-boost.jpg") (Join-Path $basePath "level-boost.jpg")
Copy-If-Exists (Join-Path $storePath "faction-change.avif") (Join-Path $basePath "faction-change.avif")
Copy-If-Exists (Join-Path $storePath "name-change.avif") (Join-Path $basePath "name-change.avif")
Copy-If-Exists (Join-Path $storePath "race-change.webp") (Join-Path $basePath "race-change.webp")

Write-Host "Asset mapping complete."
