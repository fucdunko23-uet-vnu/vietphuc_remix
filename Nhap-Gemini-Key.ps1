$ErrorActionPreference = 'Stop'
try {
    $secret = Read-Host 'Dan Gemini API key roi nhan Enter (noi dung duoc an)' -AsSecureString
    if ($secret.Length -lt 20) { throw 'Key qua ngan. Hay sao chep lai key tu Google AI Studio.' }
    $secretDir = 'D:\n8n\secrets'
    New-Item -ItemType Directory -Path $secretDir -Force | Out-Null
    $secret | ConvertFrom-SecureString | Set-Content -LiteralPath (Join-Path $secretDir 'gemini-key.dpapi') -Encoding ASCII
    $secret.Dispose()
    Write-Host 'Da luu key duoi dang ma hoa Windows. Hay bao tro ly: da luu key.' -ForegroundColor Green
} catch {
    Write-Host $_.Exception.Message -ForegroundColor Red
}
Read-Host 'Nhan Enter de dong cua so'
