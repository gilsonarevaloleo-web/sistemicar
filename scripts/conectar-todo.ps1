# Conecta Sistemicar: repo local -> GitHub -> Netlify
# Ejecutar desde la raiz del proyecto:
#   powershell -ExecutionPolicy Bypass -File .\scripts\conectar-todo.ps1

$ErrorActionPreference = "Stop"
$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location $root

function Get-GitExe {
    $candidates = @(
        (Get-Command git -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source),
        "C:\Program Files\Git\cmd\git.exe",
        "C:\Program Files\Git\bin\git.exe"
    ) | Where-Object { $_ -and (Test-Path $_) }
    if (-not $candidates) {
        throw "Git no esta instalado. Instala Git for Windows y vuelve a ejecutar este script."
    }
    return $candidates[0]
}

$git = Get-GitExe
Write-Host "Proyecto: $root" -ForegroundColor Cyan
Write-Host "Git: $git" -ForegroundColor Cyan

if (-not (& $git config user.email 2>$null)) {
    & $git config user.email "gilsonarevalo.leo@gmail.com"
    & $git config user.name "Gilson Arevalo"
}

if (-not (Test-Path (Join-Path $root "package.json"))) {
    throw "No se encontro package.json en $root"
}

if (-not (Test-Path (Join-Path $root ".git"))) {
    Write-Host "`n>>> Inicializando repositorio git" -ForegroundColor Yellow
    & $git init -b main
}

Write-Host "`n>>> Preparando commit local" -ForegroundColor Yellow
& $git add -A
$status = & $git status --porcelain
if ($status) {
    & $git commit -m "Preparar despliegue Netlify de Sistemicar"
    Write-Host "Commit creado." -ForegroundColor Green
} else {
    Write-Host "No hay cambios nuevos para commitear." -ForegroundColor DarkYellow
}

$remote = (& $git remote get-url origin 2>$null)
if (-not $remote) {
    Write-Host "`nFalta enlazar GitHub." -ForegroundColor Yellow
    Write-Host "1) Crea un repositorio vacio en GitHub (sin README ni .gitignore)."
    Write-Host "2) Copia la URL HTTPS del repo."
    Write-Host "3) Ejecuta:"
    Write-Host "   git remote add origin https://github.com/TU_USUARIO/TU_REPO.git"
    Write-Host "   git push -u origin main"
    Start-Process "https://github.com/new"
} else {
    Write-Host "`nRemoto GitHub detectado: $remote" -ForegroundColor Green
    Write-Host "Para publicar cambios: git push"
}

Write-Host "`nVariables que deben existir en Netlify (Site settings -> Environment variables):" -ForegroundColor Cyan
if (Test-Path (Join-Path $root ".env.example")) {
    Get-Content (Join-Path $root ".env.example") | Where-Object { $_ -and $_ -notmatch '^\s*#' } | ForEach-Object { Write-Host "  $_" }
}

Write-Host "`nNetlify debe importar el repo y usar netlify.toml (publish = dist/public)." -ForegroundColor Cyan
Start-Process "https://app.netlify.com/start"

Write-Host "`nFirebase (login Google) se configura aparte en Firebase Console:" -ForegroundColor Cyan
Write-Host "  Authentication -> Google habilitado"
Write-Host "  Authorized domains: sistemicar.app, www.sistemicar.app, tu-sitio.netlify.app, localhost"

Write-Host "`nCuando GitHub y Netlify esten conectados, cada git push vuelve a desplegar el sitio." -ForegroundColor Green
