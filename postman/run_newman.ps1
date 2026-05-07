$ErrorActionPreference = "Stop"

# try { [Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false) } catch {}
# $OutputEncoding = New-Object System.Text.UTF8Encoding($false)

$Collection = ".\AutomationExercise_API_Test.postman_collection.json"
$Environment = ".\ENV_AutomationExercise_API_Test.postman_environment.json"
$ReportDir = ".\reports"

if (!(Test-Path $ReportDir)) {
    New-Item -ItemType Directory -Path $ReportDir | Out-Null
}

$Stamp = Get-Date -Format "yyMMdd_HHmmss"
$JsonReport = ".\reports\newman_result_$Stamp.json"
$HtmlReport = ".\reports\newman_result_$Stamp.html"
$CliLog = ".\reports\newman_cli_$Stamp.log"

Write-Host "=== Newman Run Start ==="
Write-Host ("Collection : {0}" -f $Collection)
Write-Host ("Environment: {0}" -f $Environment)
Write-Host ("JSON Report: {0}" -f $JsonReport)
Write-Host ("HTML Report: {0}" -f $HtmlReport)
Write-Host ("CLI Log    : {0}" -f $CliLog)
Write-Host ""

if (!(Test-Path $Collection)) {
    throw "Collection file not found: $Collection"
}

if (!(Test-Path $Environment)) {
    throw "Environment file not found: $Environment"
}

$oldNodeNoWarnings = $env:NODE_NO_WARNINGS
$env:NODE_NO_WARNINGS = "1"

try {
    & newman run $Collection `
        -e $Environment `
        -n 2 `
        -r "cli,json,htmlextra" `
        --reporter-json-export $JsonReport `
        --reporter-htmlextra-export $HtmlReport 2>&1 | Tee-Object -FilePath $CliLog

    $exitCode = $LASTEXITCODE

    Write-Host ""
    Write-Host "=== Newman Run End ==="
    Write-Host ("Exit Code  : {0}" -f $exitCode)
    Write-Host ("CLI Log    : {0}" -f $CliLog)
    Write-Host ("JSON Report: {0}" -f $JsonReport)
    Write-Host ("HTML Report: {0}" -f $HtmlReport)

    if ($exitCode -ne 0) {
        throw "Newman run failed with exit code $exitCode"
    }
}
finally {
    if ($null -eq $oldNodeNoWarnings) {
        Remove-Item Env:NODE_NO_WARNINGS -ErrorAction SilentlyContinue
    }
    else {
        $env:NODE_NO_WARNINGS = $oldNodeNoWarnings
    }
}