# Pflanzenbilder zu Supabase hochladen
# Einfach ausführen: .\upload_images.ps1

$ErrorActionPreference = "Continue"

# Supabase Konfiguration
$supabaseUrl = "https://xbzufokfcflpweudtoen.supabase.co"
$supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhienVmb2tmY2ZscHdldWR0b2VuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4OTk5OTQsImV4cCI6MjA3NzQ3NTk5NH0.G-p4JpGBOSRlzGg4av2G7WiC90xRwRIPOFcLXyWeL_I"

# Bildordner
$baseFolder = "C:\Temp\06_Plants Pictures"

Write-Host "=== Pflanzenbilder Upload ===" -ForegroundColor Green
Write-Host "Suche Bilder in: $baseFolder" -ForegroundColor Cyan

# Zähler
$successCount = 0
$errorCount = 0
$uploadedImages = @()

# Durch alle Unterordner (IDs) gehen
Get-ChildItem -Path $baseFolder -Directory | ForEach-Object {
    $plantId = $_.Name
    $folderPath = $_.FullName

    Write-Host "`n[Plant ID: $plantId]" -ForegroundColor Yellow

    # Alle Bilder in diesem Ordner finden
    $images = Get-ChildItem -Path $folderPath -Include *.jpg,*.jpeg,*.png,*.gif -File

    if ($images.Count -eq 0) {
        Write-Host "  Keine Bilder gefunden" -ForegroundColor Gray
        return
    }

    $isPrimary = $true

    foreach ($image in $images) {
        try {
            $imageName = $image.Name
            $extension = $image.Extension.ToLower()

            # Eindeutiger Dateiname: plantID_originalname
            $storageFileName = "${plantId}_${imageName}"

            Write-Host "  Uploading: $imageName..." -NoNewline

            # Content-Type bestimmen
            $contentType = switch ($extension) {
                ".jpg"  { "image/jpeg" }
                ".jpeg" { "image/jpeg" }
                ".png"  { "image/png" }
                ".gif"  { "image/gif" }
                default { "application/octet-stream" }
            }

            # Datei lesen
            $fileBytes = [System.IO.File]::ReadAllBytes($image.FullName)

            # Upload zu Supabase Storage
            $uploadUri = "$supabaseUrl/storage/v1/object/plant-images/$storageFileName"
            $headers = @{
                "Authorization" = "Bearer $supabaseKey"
                "Content-Type" = $contentType
            }

            $uploadResponse = Invoke-RestMethod -Uri $uploadUri -Method Post -Headers $headers -Body $fileBytes

            # Öffentliche URL
            $publicUrl = "$supabaseUrl/storage/v1/object/public/plant-images/$storageFileName"

            # In Datenbank speichern
            $dbData = @{
                plant_id = [int]$plantId
                image_url = $publicUrl
                is_primary = $isPrimary
                display_order = if ($isPrimary) { 0 } else { 1 }
            } | ConvertTo-Json

            $dbUri = "$supabaseUrl/rest/v1/plant_images"
            $dbHeaders = @{
                "Authorization" = "Bearer $supabaseKey"
                "apikey" = $supabaseKey
                "Content-Type" = "application/json"
                "Prefer" = "return=minimal"
            }

            $dbResponse = Invoke-RestMethod -Uri $dbUri -Method Post -Headers $dbHeaders -Body $dbData

            Write-Host " OK" -ForegroundColor Green
            $successCount++
            $uploadedImages += @{
                PlantID = $plantId
                Image = $imageName
                URL = $publicUrl
            }

            # Erstes Bild ist primary, weitere nicht
            $isPrimary = $false

        } catch {
            Write-Host " FEHLER: $($_.Exception.Message)" -ForegroundColor Red
            $errorCount++
        }
    }
}

# Zusammenfassung
Write-Host "`n=== ZUSAMMENFASSUNG ===" -ForegroundColor Green
Write-Host "Erfolgreich hochgeladen: $successCount Bilder" -ForegroundColor Green
Write-Host "Fehler: $errorCount" -ForegroundColor $(if ($errorCount -gt 0) { "Red" } else { "Gray" })

# Log-Datei erstellen
$logFile = "upload_log_$(Get-Date -Format 'yyyyMMdd_HHmmss').txt"
$uploadedImages | Format-Table -AutoSize | Out-File $logFile
Write-Host "`nLog gespeichert: $logFile" -ForegroundColor Cyan
