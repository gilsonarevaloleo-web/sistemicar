# Coloca esta carpeta scripts junto a package.json (copia todo el contenido de NETLIFY-REPLIT a la raíz del proyecto).
# Ejecutar desde la raíz del proyecto:
#   powershell -ExecutionPolicy Bypass -File .\scripts\verify-build.ps1

$ErrorActionPreference = "Stop"
$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path

Set-Location $root

Write-Host "Directorio del proyecto: $root" -ForegroundColor Cyan

if (-not (Test-Path (Join-Path $root "package.json"))) {
  Write-Host "ERROR: No se encontró package.json junto a la carpeta scripts." -ForegroundColor Red
  Write-Host "Copia .gitignore, netlify.toml y la carpeta scripts a la raíz de tu proyecto Replit/Netlify."
  exit 1
}

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
  Write-Host "ERROR: npm no está en el PATH. Instala Node.js LTS." -ForegroundColor Red
  exit 1
}

Write-Host "`n>>> npm ci (o npm install si no hay package-lock)" -ForegroundColor Yellow
if (Test-Path (Join-Path $root "package-lock.json")) {
  npm ci
} elseif (Test-Path (Join-Path $root "pnpm-lock.yaml")) {
  if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) { throw "Instala pnpm o usa npm con package-lock.json." }
  pnpm install --frozen-lockfile
} elseif (Test-Path (Join-Path $root "yarn.lock")) {
  if (-not (Get-Command yarn -ErrorAction SilentlyContinue)) { throw "Instala Yarn o genera package-lock con npm." }
  yarn install --frozen-lockfile
} else {
  npm install
}

Write-Host "`n>>> npm run build" -ForegroundColor Yellow
npm run build

Write-Host "`nOK: Build terminado. Revisa dist/build/out y luego despliega (Git+Netlify o netlify deploy --prod)." -ForegroundColor Green
exit 0
