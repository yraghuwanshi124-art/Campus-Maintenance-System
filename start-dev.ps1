Write-Host "Starting Campus Maintenance System (Frontend & Backend)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd server; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd client; npm run dev"

