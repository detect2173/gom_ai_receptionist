
@echo off
REM ==========================================
REM 🦉 Great Owl Marketing - Smart Git Utility
REM ==========================================
setlocal enabledelayedexpansion
cd /d C:\repos\gom_ai_receptionist
color 0A

echo.
echo ==========================================
echo   🦉 Great Owl Marketing - Smart Commit
echo ==========================================
echo.

:: Get current branch
for /f %%b in ('git rev-parse --abbrev-ref HEAD') do set BRANCH=%%b

:: Create timestamp
for /f "tokens=1-3 delims=/ " %%a in ('date /t') do (
    set DATE=%%c-%%a-%%b
)
for /f "tokens=1-2 delims=: " %%a in ('time /t') do (
    set TIME=%%a%%b
)

:: Stage all changes
echo 🧩 Staging modified files...
git add -A

:: Detect changed files
for /f "tokens=* delims=" %%f in ('git diff --cached --name-only') do (
    set FILES=!FILES! %%f
)

:: Generate smart commit message
set MSG=

if not "!FILES!"=="" (
    echo 🔍 Analyzing changes...
    if "!FILES!"==" " set MSG=Update repository (no file changes)
    echo Files changed: !FILES!

    echo !FILES! | findstr /I "frontend" >nul && set MSG=Update frontend components and UI
    echo !FILES! | findstr /I "ChatBox" >nul && set MSG=Update ChatBox logic and layout
    echo !FILES! | findstr /I "MessageBubble" >nul && set MSG=Refine MessageBubble rendering
    echo !FILES! | findstr /I "backend" >nul && set MSG=Update backend logic and API routes
    echo !FILES! | findstr /I "tests" >nul && set MSG=Add or update backend tests
    echo !FILES! | findstr /I "globals.css" >nul && set MSG=Adjust color scheme and link styling
    echo !FILES! | findstr /I "config" >nul && set MSG=Update configuration or environment settings
    echo !FILES! | findstr /I "package.json" >nul && set MSG=Update dependencies or scripts
)

if "!MSG!"=="" set MSG=Quick maintenance commit on %DATE% %TIME% [branch: %BRANCH%]

echo 📝 Commit message: "!MSG!"
echo.

:: Commit and push
git commit -m "!MSG!"
git pull --rebase
git push

:: Optional subcommands
if /I "%1"=="test" (
    echo 🧪 Running backend tests...
    cd backend
    call venv\Scripts\activate
    python -m pytest tests -v
    cd ..
)

if /I "%1"=="run" (
    echo ⚙️ Starting backend server...
    cd backend
    call venv\Scripts\activate
    start cmd /k "uvicorn main:app --reload"
    cd ../frontend
    echo ⚛️ Starting frontend...
    start cmd /k "npm run dev"
    cd ..
)

echo.
echo ✅ Commit complete! [%MSG%]
echo ==========================================
pause
endlocal
