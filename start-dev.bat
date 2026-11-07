@echo off
echo Starting Campus Maintenance System (Frontend & Backend)...
start "CampusFix Backend" cmd /k "cd server && npm run dev"
start "CampusFix Frontend" cmd /k "cd client && npm run dev"

