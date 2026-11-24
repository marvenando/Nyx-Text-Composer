@echo off
setlocal
set "EXT_ID=com.textcomposer.panel"
set "SRC=%~dp0"
if "%SRC:~-1%"=="\" set "SRC=%SRC:~0,-1%"
set "DEST_ROOT=%APPDATA%\Adobe\CEP\extensions"
set "DEST=%DEST_ROOT%\%EXT_ID%"

:: If already installed, offer a simple Reinstall / Uninstall / Cancel popup
if exist "%DEST%" (
    for /f %%R in ('powershell -NoProfile -Command "Add-Type -AssemblyName PresentationFramework; [System.Windows.MessageBox]::Show('Nyx Text Composer is already installed.' + [Environment]::NewLine + [Environment]::NewLine + 'YES = Reinstall / Update' + [Environment]::NewLine + 'NO = Uninstall' + [Environment]::NewLine + 'CANCEL = Close', 'Nyx Text Composer Installer', 'YesNoCancel', 'Question')"') do set "CHOICE=%%R"
    if /i "%CHOICE%"=="Cancel" exit /b 0
    if /i "%CHOICE%"=="No" (
        rmdir "%DEST%" 2>nul || rmdir /s /q "%DEST%" 2>nul
        powershell -NoProfile -Command "Add-Type -AssemblyName PresentationFramework; [System.Windows.MessageBox]::Show('Nyx Text Composer has been uninstalled.', 'Nyx Text Composer Installer', 'OK', 'Information')" >nul
        exit /b 0
    )
    rmdir "%DEST%" 2>nul || rmdir /s /q "%DEST%" 2>nul
)

:: 1. Enable Adobe CEP PlayerDebugMode (AE 2021 - 2026+)
for %%V in (10 11 12 13) do (
    reg add "HKCU\Software\Adobe\CSXS.%%V" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1
)

:: 2. Link extension folder (falls back to copy if needed)
if not exist "%DEST_ROOT%" mkdir "%DEST_ROOT%"
mklink /J "%DEST%" "%SRC%" >nul 2>&1
if errorlevel 1 (
    mkdir "%DEST%" >nul 2>&1
    xcopy /E /I /Y /Q "%SRC%\CSXS" "%DEST%\CSXS" >nul
    xcopy /E /I /Y /Q "%SRC%\client" "%DEST%\client" >nul
    xcopy /E /I /Y /Q "%SRC%\host" "%DEST%\host" >nul
)

:: 3. Done popup
powershell -NoProfile -Command "Add-Type -AssemblyName PresentationFramework; [System.Windows.MessageBox]::Show('Nyx Text Composer is installed!' + [Environment]::NewLine + [Environment]::NewLine + 'Restart After Effects, then open:' + [Environment]::NewLine + 'Window > Extensions > Nyx Text Composer', 'Nyx Text Composer Installer', 'OK', 'Information')" >nul
exit /b 0
