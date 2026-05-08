# export-db.ps1
# Script untuk export database lokal (XAMPP) ke file SQL
# Jalankan: .\export-db.ps1

$mysqlDump = "C:\xampp\mysql\bin\mysqldump.exe"
$outputFile = "$PSScriptRoot\prototype_teh_export.sql"
$dbName = "prototype_teh"
$dbUser = "root"

Write-Host "📦 Exporting database '$dbName'..." -ForegroundColor Cyan

& $mysqlDump -u $dbUser $dbName | Out-File -FilePath $outputFile -Encoding utf8

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Export berhasil! File: $outputFile" -ForegroundColor Green
    Write-Host "📝 Upload file ini ke Aiven menggunakan MySQL Workbench atau CLI." -ForegroundColor Yellow
} else {
    Write-Host "❌ Export gagal. Pastikan XAMPP MySQL sedang berjalan." -ForegroundColor Red
}
