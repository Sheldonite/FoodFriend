param(
    [Parameter(Mandatory = $true)]
    [string]$SourcePath
)

$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Drawing

$projectRoot = Split-Path -Parent $PSScriptRoot
$brandDirectory = Join-Path $projectRoot 'assets\branding'
$masterPath = Join-Path $brandDirectory 'foodfriend-logo-master.png'
$brandIconPath = Join-Path $brandDirectory 'foodfriend-app-icon-1024.png'
$appIconPath = Join-Path $projectRoot 'assets\icon.png'

New-Item -ItemType Directory -Force -Path $brandDirectory | Out-Null
Copy-Item -LiteralPath $SourcePath -Destination $masterPath -Force

$source = [System.Drawing.Bitmap]::FromFile($SourcePath)
$prepared = $null
$icon = $null
$preparedGraphics = $null
$iconGraphics = $null
$backgroundBrush = $null
$clipPath = $null
$imageAttributes = $null

try {
    $prepared = New-Object System.Drawing.Bitmap(
        $source.Width,
        $source.Height,
        [System.Drawing.Imaging.PixelFormat]::Format24bppRgb
    )

    $preparedGraphics = [System.Drawing.Graphics]::FromImage($prepared)
    $preparedGraphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $preparedGraphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $preparedGraphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    # Apple applies the final corner mask. Fill the supplied artwork's white outer
    # corners with its own dark background so the submitted icon is full-bleed.
    $backgroundRect = New-Object System.Drawing.Rectangle(0, 0, $source.Width, $source.Height)
    $topColor = [System.Drawing.Color]::FromArgb(21, 23, 28)
    $bottomColor = [System.Drawing.Color]::FromArgb(8, 11, 19)
    $backgroundBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        $backgroundRect,
        $topColor,
        $bottomColor,
        [System.Drawing.Drawing2D.LinearGradientMode]::Vertical
    )
    $preparedGraphics.FillRectangle($backgroundBrush, $backgroundRect)

    $edgeInset = [int][Math]::Max(4, [Math]::Round($source.Width * 0.004))
    $cornerRadius = [int][Math]::Round($source.Width * 0.24)
    $cornerDiameter = $cornerRadius * 2
    $right = $source.Width - 1 - $edgeInset
    $bottom = $source.Height - 1 - $edgeInset

    $clipPath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $clipPath.AddArc($edgeInset, $edgeInset, $cornerDiameter, $cornerDiameter, 180, 90)
    $clipPath.AddArc($right - $cornerDiameter, $edgeInset, $cornerDiameter, $cornerDiameter, 270, 90)
    $clipPath.AddArc($right - $cornerDiameter, $bottom - $cornerDiameter, $cornerDiameter, $cornerDiameter, 0, 90)
    $clipPath.AddArc($edgeInset, $bottom - $cornerDiameter, $cornerDiameter, $cornerDiameter, 90, 90)
    $clipPath.CloseFigure()

    $preparedGraphics.SetClip($clipPath)
    $imageAttributes = New-Object System.Drawing.Imaging.ImageAttributes
    $imageAttributes.SetColorKey(
        [System.Drawing.Color]::FromArgb(0, 0, 0),
        [System.Drawing.Color]::FromArgb(64, 64, 64),
        [System.Drawing.Imaging.ColorAdjustType]::Bitmap
    )
    $destinationRect = New-Object System.Drawing.Rectangle(0, 0, $source.Width, $source.Height)
    $preparedGraphics.DrawImage(
        $source,
        $destinationRect,
        0,
        0,
        $source.Width,
        $source.Height,
        [System.Drawing.GraphicsUnit]::Pixel,
        $imageAttributes
    )
    $preparedGraphics.ResetClip()

    $iconSize = 1024
    $icon = New-Object System.Drawing.Bitmap(
        $iconSize,
        $iconSize,
        [System.Drawing.Imaging.PixelFormat]::Format24bppRgb
    )
    $icon.SetResolution(72, 72)
    $iconGraphics = [System.Drawing.Graphics]::FromImage($icon)
    $iconGraphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
    $iconGraphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $iconGraphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $iconGraphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $iconGraphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $iconGraphics.DrawImage($prepared, 0, 0, $iconSize, $iconSize)

    $icon.Save($brandIconPath, [System.Drawing.Imaging.ImageFormat]::Png)
    Copy-Item -LiteralPath $brandIconPath -Destination $appIconPath -Force
}
finally {
    if ($iconGraphics) { $iconGraphics.Dispose() }
    if ($preparedGraphics) { $preparedGraphics.Dispose() }
    if ($backgroundBrush) { $backgroundBrush.Dispose() }
    if ($clipPath) { $clipPath.Dispose() }
    if ($imageAttributes) { $imageAttributes.Dispose() }
    if ($icon) { $icon.Dispose() }
    if ($prepared) { $prepared.Dispose() }
    if ($source) { $source.Dispose() }
}

Write-Output $masterPath
Write-Output $brandIconPath
Write-Output $appIconPath
