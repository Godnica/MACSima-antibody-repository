@echo off
echo ============================================
echo   Antibody Repository — Starting...
echo ============================================
echo.

docker compose up -d --build

echo.
echo ============================================
echo   Application is ready!
echo   Open: http://localhost:3000
echo   Default login: admin / admin
echo ============================================
pause
