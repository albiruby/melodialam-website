@echo off
rem ---------------------------------------------------------------------------
rem  Melodi Alam - dev server launcher
rem
rem  Double-click this file, or run `dev.cmd` from a terminal.
rem  Add `noopen` to skip opening the browser:  dev.cmd noopen
rem
rem  What it does, in order:
rem    1. Switches to this folder, so it works from anywhere (and from a
rem       double-click, where the working directory would otherwise be System32).
rem    2. Checks Node.js is on PATH.
rem    3. Installs dependencies when node_modules is missing.
rem    4. Frees port 3100 if a stale server is still holding it.
rem    5. Starts the dev server, then opens the browser once it actually answers.
rem
rem  It never kills every node.exe. Only the single process listening on 3100 is
rem  ever touched, because killing all node processes also takes down any local
rem  MCP servers running on this machine.
rem
rem  ASCII only on purpose: a .cmd file with non-ASCII bytes renders as mojibake
rem  under the default console code page. `chcp 65001` below is only there so the
rem  dev server's own output (Next.js prints a U+25B2 triangle) looks right.
rem ---------------------------------------------------------------------------

setlocal
chcp 65001 >nul
title Melodi Alam - dev server (port 3100)
cd /d "%~dp0"

set "PORT=3100"
set "URL=http://localhost:%PORT%"
if /i "%~1"=="noopen" set "NOOPEN=1"

echo.
echo  ==========================================================
echo   MELODI ALAM  -  dev server
echo  ==========================================================
echo.

rem --- 1. Node ---------------------------------------------------------------
where node >nul 2>nul
if errorlevel 1 (
  echo  [ERROR] Node.js tidak ditemukan di PATH.
  echo          Pasang Node.js 24.22.1 atau lebih baru, lihat .nvmrc
  echo.
  pause
  exit /b 1
)
for /f "delims=" %%v in ('node --version') do set "NODEVER=%%v"
echo  [ OK ] Node %NODEVER%

rem --- 2. Dependencies -------------------------------------------------------
if not exist "node_modules\" (
  echo  [INFO] node_modules belum ada, menjalankan npm install...
  call npm install
  if errorlevel 1 (
    echo.
    echo  [ERROR] npm install gagal. Periksa pesan di atas.
    echo.
    pause
    exit /b 1
  )
  echo  [ OK ] Dependensi terpasang.
) else (
  echo  [ OK ] node_modules ada.
)

rem --- 3. Port 3100 ----------------------------------------------------------
rem Two things matter here. First, the PowerShell one-liner avoids a pipe: a `|`
rem inside a `for /f` command needs `^|` escaping, and inside a quoted -Command
rem that escaping silently yields an empty result instead of failing loudly. An
rem earlier version did exactly that, concluded the port was free, and started a
rem second server that died with EADDRINUSE. Measured: the piped form returns
rem nothing, the array-index form below returns the pid.
rem Second, netstat is a fallback for machines where PowerShell is locked down.
set "HOLDER="
for /f "delims=" %%p in ('powershell -NoProfile -Command "$c = @(Get-NetTCPConnection -State Listen -LocalPort %PORT% -ErrorAction SilentlyContinue)[0]; if ($c) { $c.OwningProcess }" 2^>nul') do set "HOLDER=%%p"

if not defined HOLDER (
  for /f "tokens=5" %%p in ('netstat -ano ^| findstr /r /c:"LISTENING" ^| findstr /c:":%PORT% " 2^>nul') do set "HOLDER=%%p"
)

if not defined HOLDER goto :start_server

set "HOLDERNAME=?"
for /f "delims=" %%n in ('powershell -NoProfile -Command "(Get-Process -Id %HOLDER% -ErrorAction SilentlyContinue).ProcessName"') do set "HOLDERNAME=%%n"

echo.
echo  [WARN] Port %PORT% sedang dipakai oleh pid %HOLDER% (%HOLDERNAME%).
echo.
choice /c yn /n /m "  Hentikan proses itu supaya port %PORT% bebas? [y/n] "
rem errorlevel 1 = y, 2 = n, 0 = interrupted (Ctrl+C). Only 1 may free the port.
if errorlevel 2 goto :cancelled
if not errorlevel 1 goto :cancelled

taskkill /PID %HOLDER% /F >nul 2>nul
if errorlevel 1 (
  echo.
  echo  [ERROR] Gagal menghentikan pid %HOLDER%. Coba jalankan ulang sebagai admin.
  echo.
  pause
  exit /b 1
)
echo  [ OK ] pid %HOLDER% dihentikan, port %PORT% bebas.
rem `timeout` aborts with "Input redirection is not supported" when stdin is
rem redirected, which breaks any piped or scripted invocation. `ping` is the
rem conventional stdin-independent delay in batch files.
ping -n 3 127.0.0.1 >nul
goto :start_server

:cancelled
echo.
echo  Dibatalkan. Tidak ada yang dijalankan.
echo.
pause
exit /b 1

rem --- 4. Start --------------------------------------------------------------
:start_server
echo.
echo  [INFO] Menjalankan dev server di %URL%
echo         Tekan Ctrl+C untuk berhenti.
echo.

rem Open the browser when the server actually answers, instead of guessing at a
rem delay. Runs detached so it never blocks the dev server itself.
if not defined NOOPEN start "" /b powershell -NoProfile -WindowStyle Hidden -Command "for ($i = 0; $i -lt 120; $i++) { try { $r = Invoke-WebRequest '%URL%' -UseBasicParsing -TimeoutSec 2; if ($r.StatusCode -ge 200) { Start-Process '%URL%'; break } } catch { }; Start-Sleep -Milliseconds 500 }"

call npm run dev
set "EXITCODE=%ERRORLEVEL%"

echo.
if not "%EXITCODE%"=="0" (
  echo  [ERROR] Dev server keluar dengan kode %EXITCODE%.
  echo.
  pause
  exit /b %EXITCODE%
)
echo  Dev server berhenti.
endlocal
