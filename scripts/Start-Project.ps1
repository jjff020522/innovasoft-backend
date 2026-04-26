[CmdletBinding()]
param(
    [switch]$SkipSetup
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$setupScript = Join-Path $scriptDir "Setup-Project.ps1"
$frontendScript = Join-Path $scriptDir "Start-Frontend.ps1"
$rootDir = Split-Path -Parent $scriptDir
$backendDir = Join-Path $rootDir "backend"
$venvPython = Join-Path $rootDir ".venv\Scripts\python.exe"
$powerShellExe = (Get-Command powershell.exe -ErrorAction Stop).Source

function Test-MongoListening {
    try {
        $client = New-Object System.Net.Sockets.TcpClient
        $async = $client.BeginConnect("localhost", 27017, $null, $null)
        $connected = $async.AsyncWaitHandle.WaitOne(500)

        if ($connected -and $client.Connected) {
            $client.EndConnect($async)
            $client.Close()
            return $true
        }

        $client.Close()
        return $false
    }
    catch {
        return $false
    }
}

if (-not $SkipSetup) {
    & $setupScript
}

if (-not (Test-MongoListening)) {
    Write-Warning "MongoDB no esta escuchando en localhost:27017. El login y las operaciones con sesion fallaran hasta iniciarlo."
}

Start-Process -FilePath $powerShellExe -WorkingDirectory $rootDir -ArgumentList "-ExecutionPolicy", "Bypass", "-NoExit", "-File", $frontendScript

Write-Host ""
Write-Host "Frontend iniciado en una ventana separada." -ForegroundColor Green
Write-Host "Frontend: http://localhost:5173"
Write-Host "Backend iniciara en esta misma consola. Mantenga esta ventana abierta." -ForegroundColor Yellow
Write-Host "Backend:  http://localhost:8000/docs"

Push-Location $backendDir
try {
    & $venvPython -m uvicorn app.main:app --host 0.0.0.0 --port 8000
}
finally {
    Pop-Location
}
