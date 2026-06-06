$files = Get-ChildItem -Path . -Recurse -File -Include *.tsx,*.ts,*.md,*.json,*.jsonc,*.yml,*.yaml,*.toml,.dockerignore,Dockerfile | Where-Object { $_.FullName -notmatch "\\node_modules\\" -and $_.FullName -notmatch "\\dist\\" -and $_.FullName -notmatch "\\.git\\" }
foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $newContent = $content -replace "artifacts/renewal-radar", "artifacts/frontend" `
                           -replace "@workspace/renewal-radar", "@workspace/frontend" `
                           -replace "components/risk-radar", "components/core" `
                           -replace "pages/risk-intake", "pages/intake" `
                           -replace "pages/risk-record", "pages/record" `
                           -replace "pages/risk-register", "pages/register" `
                           -replace "renewal-radar", "frontend" `
                           -replace "risk-radar", "core" `
                           -replace "Risk Radar", "DueRadar" `
                           -replace "RiskRadar", "DueRadar" `
                           -replace "Renewal Radar", "DueRadar" `
                           -replace "RenewalRadar", "DueRadar"
    if ($content -cne $newContent) {
        Set-Content -Path $file.FullName -Value $newContent -NoNewline
        Write-Host "Updated $($file.FullName)"
    }
}
