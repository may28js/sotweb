
$pathHero = "F:\工作区\模块开发\StoryOfTimeLauncher\WebBackend\Client\src\components\Hero.tsx"
$pathNavbar = "F:\工作区\模块开发\StoryOfTimeLauncher\WebBackend\Client\src\components\Navbar.tsx"
$pathFooter = "F:\工作区\模块开发\StoryOfTimeLauncher\WebBackend\Client\src\components\Footer.tsx"

$shiguang = [System.Text.RegularExpressions.Regex]::Unescape("\u65f6\u5149")
$gushi = [System.Text.RegularExpressions.Regex]::Unescape("\u6545\u4e8b")
$shiguanggushi = $shiguang + $gushi
$shiguangzhiyu = [System.Text.RegularExpressions.Regex]::Unescape("\u65f6\u5149\u4e4b\u8bed")

# Helper function
function Update-FileContent {
    param (
        [string]$Path,
        [string]$SearchPattern,
        [string]$Replacement
    )
    if (Test-Path $Path) {
        try {
            $content = [System.IO.File]::ReadAllText($Path, [System.Text.Encoding]::UTF8)
            # Use regex replace
            $newContent = [System.Text.RegularExpressions.Regex]::Replace($content, $SearchPattern, $Replacement)
            if ($newContent -ne $content) {
                [System.IO.File]::WriteAllText($Path, $newContent, [System.Text.Encoding]::UTF8)
                Write-Host "Updated $Path"
            } else {
                Write-Host "Pattern not found or already updated in $Path"
            }
        } catch {
            Write-Error "Failed to update $Path : $_"
        }
    } else {
        Write-Error "File not found: $Path"
    }
}

# Update Hero.tsx
$heroPattern = 'Story of\s*<span className="text-primary">Time</span>'
$heroReplacement = "$shiguang<span className=`"text-primary`">$gushi</span>"
Update-FileContent -Path $pathHero -SearchPattern $heroPattern -Replacement $heroReplacement

# Update Navbar.tsx
$navbarPattern = 'Story of Time'
$navbarReplacement = $shiguanggushi
Update-FileContent -Path $pathNavbar -SearchPattern $navbarPattern -Replacement $navbarReplacement

# Update Footer.tsx
$footerPattern = $shiguangzhiyu + '\s*\(Story of Time\)'
Update-FileContent -Path $pathFooter -SearchPattern $footerPattern -Replacement $shiguanggushi
