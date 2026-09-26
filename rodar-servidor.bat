@echo off
cd /d "%~dp0"
echo.
echo  ========================================
echo   Bomba Duo - iniciando servidor...
echo  ========================================
echo.
where node >nul 2>nul
if errorlevel 1 (
  echo  [ERRO] Node.js nao encontrado. Instale em https://nodejs.org
  echo.
  pause
  exit /b 1
)
node server.js
pause
