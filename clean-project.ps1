# Deep Clean Script for Print Shop Manager

Write-Host "🧹 Starting Deep Clean..." -ForegroundColor Yellow

# Kill any node processes (optional but recommended to release file locks)
Write-Host "Killing any lingering Node.js processes..."
Stop-Process -Name "node" -ErrorAction SilentlyContinue

# Remove .next folder
if (Test-Path ".next") {
    Write-Host "Removing .next cache folder..."
    Remove-Item -Recurse -Force ".next" -ErrorAction SilentlyContinue
}

# Remove node_modules
if (Test-Path "node_modules") {
    Write-Host "Removing node_modules (this might take a moment)..."
    Remove-Item -Recurse -Force "node_modules" -ErrorAction SilentlyContinue
}

# Remove package-lock.json
if (Test-Path "package-lock.json") {
    Write-Host "Removing package-lock.json..."
    Remove-Item -Force "package-lock.json" 
}

Write-Host "✅ Clean complete!" -ForegroundColor Green
Write-Host "🚀 ready to re-install." -ForegroundColor Cyan
