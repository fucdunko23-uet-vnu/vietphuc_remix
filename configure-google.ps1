$ErrorActionPreference = 'Stop'
$encryptedPath = 'D:\n8n\secrets\gemini-key.dpapi'
if (-not (Test-Path -LiteralPath $encryptedPath)) { throw 'Run Nhap-Gemini-Key.cmd first.' }
$secureValue = (Get-Content -LiteralPath $encryptedPath -Raw).Trim() | ConvertTo-SecureString
$secretPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureValue)
try {
    $env:VIET_PHUC_GEMINI_KEY = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($secretPointer)
    & node (Join-Path $PSScriptRoot 'configure-google.cjs')
    if ($LASTEXITCODE -ne 0) { throw 'Google validation failed. Demo remains available.' }
} finally {
    Remove-Item Env:\VIET_PHUC_GEMINI_KEY -ErrorAction SilentlyContinue
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($secretPointer)
    $secureValue.Dispose()
}
$env:N8N_USER_FOLDER = 'D:\n8n\data'
$env:N8N_LOG_LEVEL = 'warn'
$cli = 'D:\n8n\node_modules\n8n\bin\n8n'
& 'D:\n8n\Stop-n8n.ps1'
try {
    & node $cli import:credentials --input=D:\n8n\temp\viet-phuc-google-credential.json
    if ($LASTEXITCODE -ne 0) { throw 'Credential import failed.' }
    & node $cli import:workflow --input=D:\n8n\temp\viet-phuc-studio-ai-import.json
    if ($LASTEXITCODE -ne 0) { throw 'Workflow import failed.' }
    & node $cli publish:workflow --id=vietPhucRemixStudio
    if ($LASTEXITCODE -ne 0) { throw 'Workflow publish failed.' }
} finally {
    Remove-Item -LiteralPath 'D:\n8n\temp\viet-phuc-google-credential.json' -ErrorAction SilentlyContinue
    & 'D:\n8n\Start-n8n.ps1'
}
