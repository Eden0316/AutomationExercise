# ================================================
# Playwright UI Test Runner - Headed Mode
# Project: AutomationExercise
# Environment: Windows 11 / PowerShell 5
# ================================================

$ErrorActionPreference = "Stop"

# PowerShell 5 UTF-8 출력 보정
try {
    [Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)
    $OutputEncoding = New-Object System.Text.UTF8Encoding($false)
} catch {
    # 인코딩 설정 실패 시 테스트 실행은 계속 진행
}

$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ProjectRoot

$Timestamp = Get-Date -Format "yyMMdd_HHmmss"

$ReportRoot = Join-Path $ProjectRoot "reports"
$LogDir = Join-Path $ReportRoot "logs"

if (!(Test-Path $ReportRoot)) {
    New-Item -ItemType Directory -Force -Path $ReportRoot | Out-Null
}

if (!(Test-Path $LogDir)) {
    New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
}

$CliLog = Join-Path $LogDir ("playwright_cli_headed_{0}.log" -f $Timestamp)

Write-Host "==============================================="
Write-Host " Playwright UI Test Runner - Headed"
Write-Host " ProjectRoot : $ProjectRoot"
Write-Host " CLI Log     : $CliLog"
Write-Host "==============================================="
Write-Host ""

function Remove-AnsiCode {
    param([string]$Text)

    $esc = [char]27

    # CSI ANSI escape 제거: ESC [ ... letter
    $Text = $Text -replace "$esc\[[0-?]*[ -/]*[@-~]", ""

    # OSC ANSI escape 제거: ESC ] ... BEL
    $Text = $Text -replace "$esc\][^\a]*\a", ""

    return $Text
}

npx playwright test --headed 2>&1 | ForEach-Object {
    $line = $_.ToString()

    # 콘솔에는 원본 그대로 출력
    Write-Host $line

    # 로그에는 ANSI 제거 후 저장
    $cleanLine = Remove-AnsiCode $line
    Add-Content -LiteralPath $CliLog -Value $cleanLine -Encoding UTF8
}

$ExitCode = $LASTEXITCODE

# Playwright HTML Report 폴더 보관
$LatestReportDir = Join-Path $ProjectRoot "playwright-report"
$SavedReportDir = Join-Path $ReportRoot ("playwright_report_headed_{0}" -f $Timestamp)
$SavedReportIndex = Join-Path $SavedReportDir "index.html"

if (Test-Path $LatestReportDir) {
    if (Test-Path $SavedReportDir) {
        Remove-Item -LiteralPath $SavedReportDir -Recurse -Force
    }

    New-Item -ItemType Directory -Force -Path $SavedReportDir | Out-Null
    Copy-Item -Path (Join-Path $LatestReportDir "*") -Destination $SavedReportDir -Recurse -Force
} else {
    Write-Host "[WARN] Playwright HTML Report folder not found: $LatestReportDir"
}

Write-Host ""
Write-Host "==============================================="
Write-Host " Playwright headed finished. ExitCode: $ExitCode"
Write-Host " Latest HTML Report : $ProjectRoot\playwright-report\index.html"
Write-Host " Saved HTML Report  : $SavedReportIndex"
Write-Host " CLI Log            : $CliLog"
Write-Host "==============================================="

exit $ExitCode