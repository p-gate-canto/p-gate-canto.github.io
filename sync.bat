@echo off
chcp 65001 > nul
cd /d "%~dp0"
echo [1/1] GitHub の最新内容を取り込みます...
git pull --no-rebase --no-edit
echo.
echo 完了しました。このウィンドウは閉じてかまいません。
pause
