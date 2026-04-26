[CmdletBinding()]
param(
    [switch]$Reload
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootDir = Split-Path -Parent $scriptDir
$backendDir = Join-Path $rootDir "backend"
$venvPython = Join-Path $rootDir ".venv\Scripts\python.exe"
$backendEnv = Join-Path $backendDir ".env"
$backendEnvExample = Join-Path $backendDir ".env.example"

if (-not (Test-Path $venvPython)) {
    throw "No se encontro el entorno virtual. Ejecute scripts\Setup-Project.ps1 primero."
}

if (-not (Test-Path $backendEnv)) {
    Copy-Item -Path $backendEnvExample -Destination $backendEnv
}

Push-Location $backendDir
try {
    if ($Reload) {
        & $venvPython -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
    }
    else {
        & $venvPython -m uvicorn app.main:app --host 0.0.0.0 --port 8000
    }
}
finally {
    Pop-Location
}
