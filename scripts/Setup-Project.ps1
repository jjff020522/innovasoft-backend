[CmdletBinding()]
param(
    [switch]$SkipBackendInstall,
    [switch]$SkipFrontendInstall
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootDir = Split-Path -Parent $scriptDir
$backendDir = Join-Path $rootDir "backend"
$frontendDir = Join-Path $rootDir "frontend"
$venvPython = Join-Path $rootDir ".venv\Scripts\python.exe"

function Write-Step {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Cyan
}

function Ensure-EnvFile {
    param(
        [string]$ExamplePath,
        [string]$TargetPath
    )

    if (-not (Test-Path $TargetPath)) {
        Copy-Item -Path $ExamplePath -Destination $TargetPath
        Write-Step "Archivo creado: $TargetPath"
    }
}

function New-ProjectVenv {
    if (Test-Path $venvPython) {
        return
    }

    $pythonCommand = Get-Command python -ErrorAction SilentlyContinue
    if ($pythonCommand) {
        Write-Step "Creando entorno virtual en .venv"
        & $pythonCommand.Source -m venv (Join-Path $rootDir ".venv")
        return
    }

    $pyCommand = Get-Command py -ErrorAction SilentlyContinue
    if ($pyCommand) {
        Write-Step "Creando entorno virtual en .venv"
        & $pyCommand.Source -3 -m venv (Join-Path $rootDir ".venv")
        return
    }

    throw "No se encontro Python 3.10 o superior en el sistema."
}

Write-Step "Preparando archivos .env"
Ensure-EnvFile -ExamplePath (Join-Path $backendDir ".env.example") -TargetPath (Join-Path $backendDir ".env")
Ensure-EnvFile -ExamplePath (Join-Path $frontendDir ".env.example") -TargetPath (Join-Path $frontendDir ".env")

New-ProjectVenv

if (-not $SkipBackendInstall) {
    Write-Step "Instalando dependencias del backend"
    & $venvPython -m pip install -r (Join-Path $backendDir "requirements.txt")
}

if (-not $SkipFrontendInstall) {
    Write-Step "Instalando dependencias del frontend"
    Push-Location $frontendDir
    try {
        & npm.cmd install
    }
    finally {
        Pop-Location
    }
}

Write-Host ""
Write-Host "Proyecto preparado correctamente." -ForegroundColor Green
Write-Host "Backend:  $backendDir"
Write-Host "Frontend: $frontendDir"
