@echo off
echo ====================================================
echo   ScholarHub ERP - Production Deploy to Firebase
echo ====================================================
echo.
echo [1/2] Building production bundle...
call npm run build
if %ERRORLEVEL% NEQ 0 (
  echo BUILD FAILED. Fix errors above before deploying.
  pause
  exit /b 1
)
echo.
echo [2/2] Deploying to Firebase Hosting...
call firebase deploy --only hosting
if %ERRORLEVEL% NEQ 0 (
  echo DEPLOY FAILED. Make sure you are logged in: firebase login
  pause
  exit /b 1
)
echo.
echo ====================================================
echo   SUCCESS! ScholarHub ERP is live.
echo ====================================================
pause
