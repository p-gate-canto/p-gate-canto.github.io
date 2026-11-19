@echo off
chcp 65001 > nul
cd /d "%~dp0"
rem 自動公開の設定ファイルが届いていたら、所定の場所へ移す
if exist setup\deploy.yml (
  if not exist .github\workflows mkdir .github\workflows
  move /y setup\deploy.yml .github\workflows\deploy.yml > nul
  rmdir setup 2> nul
)
rem 構成変更で不要になった古いファイルを片付ける
if exist src\pages\category rmdir /s /q src\pages\category
if exist src\pages\tools rmdir /s /q src\pages\tools
if exist src\pages\contents.astro del /q src\pages\contents.astro
if exist src\components\TocCard.astro del /q src\components\TocCard.astro
echo [1/3] GitHub の最新内容を取り込みます...
git pull --no-rebase --no-edit
if errorlevel 1 goto error
echo [2/3] 変更を記録します...
git add -A
git commit -m "更新 %date% %time:~0,5%"
echo [3/3] GitHub に送ります...
git push
if errorlevel 1 goto error
echo.
echo 完了しました。1〜2分後にサイトへ反映されます。
pause
exit /b 0
:error
echo.
echo エラーが出ました。この画面のスクリーンショットを Claude に貼ってください。
pause
exit /b 1
