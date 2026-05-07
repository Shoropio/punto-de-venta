@echo off
title Punto de Venta Dev Server

echo ============================
echo Iniciando Backend Laravel...
echo ============================

start "Laravel Backend" cmd /k "cd /d C:\Users\Shoropio\Desktop\punto-de-venta\backend && php artisan serve --host=127.0.0.1 --port=8000"

timeout /t 2 >nul

echo ============================
echo Iniciando Frontend React...
echo ============================

start "React Frontend" cmd /k "cd /d C:\Users\Shoropio\Desktop\punto-de-venta\frontend && npm run dev -- --host 127.0.0.1 --port 5173"

echo ============================
echo Servidores iniciados
echo Backend:  http://127.0.0.1:8000
echo Frontend: http://127.0.0.1:5173
echo ============================

pause