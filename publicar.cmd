@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ============================================================
echo  Publicar o portfolio no GitHub
echo ============================================================
echo.

where git >nul 2>nul || (echo [ERRO] Git nao encontrado neste computador. & goto fim)

rem Evita a pergunta "Deletion of directory ... failed" causada pelo OneDrive.
git config gc.auto 0

where node >nul 2>nul
if errorlevel 1 (
  echo [AVISO] Node.js nao encontrado: pulando o teste de build local.
  echo         O GitHub Actions fara o build na publicacao.
) else (
  echo [1/3] Testando o build local...
  call npm run build
  if errorlevel 1 (
    echo.
    echo [ERRO] O build falhou. Nada foi publicado.
    echo        Copie as mensagens acima e envie para o Claude.
    goto fim
  )
)

echo.
echo [2/3] Registrando as alteracoes...
git add -A -- . ":(exclude)publicar.cmd"
git diff --cached --quiet
if not errorlevel 1 goto semcommit
set "MSG="
set /p MSG=Mensagem do commit (Enter usa "atualiza o site"): 
if not defined MSG set "MSG=atualiza o site"
git commit -m "%MSG%"
goto aposcommit
:semcommit
echo Nada novo para registrar; o commit ja existe.
:aposcommit

echo.
echo [3/3] Enviando para o GitHub...
git push
if errorlevel 1 (
  echo.
  echo [ERRO] O push falhou. Copie as mensagens acima e envie para o Claude.
  goto fim
)

echo.
echo Ultimo commit publicado:
git log -1 --oneline
echo.
echo Pronto. O GitHub Actions publica o site em cerca de 2 minutos.
echo Pode apagar este arquivo publicar.cmd depois.

:fim
echo.
pause
