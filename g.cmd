@echo off
REM === Great Owl Git Quick Commit ===
REM Automatically adds, commits, pulls latest, and pushes with timestamp.

setlocal enabledelayedexpansion

:: Change directory to your repo root (optional safeguard)
cd /d C:\repos\gom_ai_receptionist

:: Capture current branch name
for /f "tokens=2 delims=*" %%b in ('git branch --show-current') do set BRANCH=%%b

:: Create timestamp
for /f "tokens=1-4 delims=/ " %%a in ('date /t') do set DATE=%%d-%%b-%%c
for /f "tokens=1 delims= " %%a in ('time /t') do set TIME=%%a

:: Stage all changes
git add .

:: Create commit with branch name and timestamp
git commit -m "Quick commit on !DATE! !TIME! [branch: !BRANCH!]"

:: Pull and push
git pull --rebase
git push

echo.
echo ✅ Git push complete for branch: !BRANCH!
pause
