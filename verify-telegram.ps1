# Check if the telegram endpoints are working
$domain = "https://salescopilot-tawny.vercel.app"

Write-Host "Testing Telegram endpoints..."
Write-Host ""

# Test setup endpoint
Write-Host "1. Testing /api/telegram/setup"
try {
    $response = Invoke-WebRequest -Uri "$domain/api/telegram/setup" -Method GET -ErrorAction Stop
    Write-Host "✓ Setup endpoint: $($response.StatusCode)" -ForegroundColor Green
    Write-Host $response.Content
} catch {
    Write-Host "✗ Setup endpoint failed: $_" -ForegroundColor Red
}

Write-Host ""

# Test webhook GET
Write-Host "2. Testing /api/telegram/webhook (GET)"
try {
    $response = Invoke-WebRequest -Uri "$domain/api/telegram/webhook" -Method GET -ErrorAction Stop
    Write-Host "✓ Webhook GET: $($response.StatusCode)" -ForegroundColor Green
    Write-Host $response.Content
} catch {
    Write-Host "✗ Webhook GET failed: $_" -ForegroundColor Red
}

Write-Host ""

# Test webhook POST
Write-Host "3. Testing /api/telegram/webhook (POST)"
try {
    $body = @{ 
        update_id = 123
        message = @{
            message_id = 1
            date = [int][double]::Parse((Get-Date -UFormat %s))
            from = @{
                id = 123456
                is_bot = $false
                first_name = "Test"
            }
            chat = @{
                id = 123456
                type = "private"
            }
            text = "Test message"
        }
    }
    
    $response = Invoke-WebRequest -Uri "$domain/api/telegram/webhook" `
        -Method POST `
        -ContentType "application/json" `
        -Body ($body | ConvertTo-Json -Depth 10) `
        -ErrorAction Stop
    
    Write-Host "✓ Webhook POST: $($response.StatusCode)" -ForegroundColor Green
    Write-Host $response.Content
} catch {
    Write-Host "✗ Webhook POST failed: $_" -ForegroundColor Red
}

Write-Host ""

# Test test endpoint
Write-Host "4. Testing /api/telegram/test"
try {
    $response = Invoke-WebRequest -Uri "$domain/api/telegram/test" -Method GET -ErrorAction Stop
    Write-Host "✓ Test endpoint: $($response.StatusCode)" -ForegroundColor Green
    Write-Host $response.Content
} catch {
    Write-Host "✗ Test endpoint failed: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "Verification complete!" -ForegroundColor Cyan
