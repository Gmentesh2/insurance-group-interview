param([switch]$NoBrowser)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$env:Path = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' +
    [Environment]::GetEnvironmentVariable('Path', 'User') + ';' +
    "$env:APPDATA\npm;C:\Program Files\Docker\Docker\resources\bin"

function Invoke-ProjectCommand {
    param([string]$Program, [string[]]$CommandArguments)
    & $Program @CommandArguments
    if ($LASTEXITCODE -ne 0) { throw "$Program failed (exit $LASTEXITCODE)." }
}

function Test-LocalEndpoint {
    param([string]$Url)
    try { return (Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5).StatusCode -eq 200 }
    catch { return $false }
}

function Start-ServerTerminal {
    param([string]$Action)
    $escapedRoot = $projectRoot.Replace("'", "''")
    $command = "Set-Location -LiteralPath '$escapedRoot'; node scripts/run.mjs $Action"
    $encoded = [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($command))
    # These interactive terminals show startup errors and support Ctrl+C to stop.
    Start-Process -FilePath 'powershell.exe' -ArgumentList '-NoExit', '-NoProfile', '-EncodedCommand', $encoded
}

Push-Location -LiteralPath $projectRoot
try {
    foreach ($program in @('node.exe', 'pnpm.cmd', 'dotnet.exe', 'docker.exe')) {
        if (!(Get-Command $program -ErrorAction SilentlyContinue)) { throw "Missing $program. See README.md for installation." }
    }
    if (!(Test-Path -LiteralPath '.env')) { Invoke-ProjectCommand 'node.exe' @('scripts/configure.mjs') }
    if (!(Test-Path -LiteralPath 'frontend/node_modules')) {
        Invoke-ProjectCommand 'pnpm.cmd' @('--dir', 'frontend', 'install', '--frozen-lockfile')
    }
    & docker.exe info --format '{{.ServerVersion}}' *> $null
    if ($LASTEXITCODE -ne 0) {
        $desktopApp = @('C:\Program Files\Docker\Docker\Docker Desktop.exe', "$env:LOCALAPPDATA\Programs\DockerDesktop\Docker Desktop.exe") |
            Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
        if (!$desktopApp) { throw 'Open Docker Desktop and wait for its engine to start.' }
        Start-Process -FilePath $desktopApp -WindowStyle Hidden
        Write-Host 'Waiting for Docker Desktop. Finish its setup if prompted...'
        $deadline = (Get-Date).AddMinutes(2)
        do {
            Start-Sleep -Seconds 3
            & docker.exe info --format '{{.ServerVersion}}' *> $null
            $dockerReady = $LASTEXITCODE -eq 0
        } until ($dockerReady -or (Get-Date) -gt $deadline)
        if (!$dockerReady) { throw 'Docker did not become ready. Check Docker Desktop for restart or virtualization requirements.' }
    }
    Invoke-ProjectCommand 'node.exe' @('scripts/run.mjs', 'db')
    if (!(Test-LocalEndpoint 'http://127.0.0.1:5081/health')) {
        Push-Location -LiteralPath 'backend'
        try { Invoke-ProjectCommand 'dotnet.exe' @('tool', 'restore') }
        finally { Pop-Location }
        Invoke-ProjectCommand 'node.exe' @('scripts/run.mjs', 'migrate')
        Invoke-ProjectCommand 'dotnet.exe' @('build', 'backend/InsuranceGroup.Api.csproj', '--no-restore')
        Start-ServerTerminal 'api'
    }
    if (!(Test-LocalEndpoint 'http://localhost:3001/en')) { Start-ServerTerminal 'web' }
    $deadline = (Get-Date).AddMinutes(2)
    do {
        $ready = (Test-LocalEndpoint 'http://127.0.0.1:5081/health') -and
            (Test-LocalEndpoint 'http://localhost:3001/en') -and
            (Test-LocalEndpoint 'http://localhost:3001/api/v1/auth/session')
        if (!$ready) { Start-Sleep -Seconds 3 }
    } until ($ready -or (Get-Date) -gt $deadline)
    if (!$ready) { throw 'App readiness checks failed. Check the API and web terminals.' }
    Write-Host 'Insurance Group is ready: http://localhost:3001/en' -ForegroundColor Green
    Write-Host 'Keep Docker and both servers running during the presentation.'
    if (!$NoBrowser) { Start-Process 'http://localhost:3001/en' }
} finally { Pop-Location }
