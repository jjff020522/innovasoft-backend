[CmdletBinding()]
param(
    [switch]$UseViteDevServer
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootDir = Split-Path -Parent $scriptDir
$frontendDir = Join-Path $rootDir "frontend"
$frontendEnv = Join-Path $frontendDir ".env"
$frontendEnvExample = Join-Path $frontendDir ".env.example"
$venvPython = Join-Path $rootDir ".venv\Scripts\python.exe"

if (-not (Test-Path (Join-Path $frontendDir "node_modules"))) {
    throw "No se encontraron las dependencias del frontend. Ejecute scripts\Setup-Project.ps1 primero."
}

if (-not (Test-Path $frontendEnv)) {
    Copy-Item -Path $frontendEnvExample -Destination $frontendEnv
}

Push-Location $frontendDir
try {
    if ($UseViteDevServer) {
        & npm.cmd run dev -- --host 0.0.0.0 --port 5173
    }
    else {
        Write-Host "[INFO] Construyendo frontend para servirlo localmente..." -ForegroundColor Cyan
        & npm.cmd run build
        & $venvPython (Join-Path $rootDir "scripts\serve_frontend.py") --port 5173 --directory (Join-Path $frontendDir "dist")
        return
    }

    if ($LASTEXITCODE -ne 0) {
        Write-Warning "Vite no pudo iniciar en este entorno. Se usara un servidor estatico local como alternativa."
        & npm.cmd run build
        & $venvPython (Join-Path $rootDir "scripts\serve_frontend.py") --port 5173 --directory (Join-Path $frontendDir "dist")
    }
}
finally {
    Pop-Location
}
