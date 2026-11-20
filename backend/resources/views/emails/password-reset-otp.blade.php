<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #0f172a; line-height: 1.6; background-color: #f8fafc; margin: 0; padding: 24px; }
        .container { max-width: 540px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
        .header { background: #4f46e5; color: #ffffff; padding: 24px; text-align: center; }
        .header h2 { margin: 0; font-size: 20px; font-weight: 700; }
        .header p { margin: 6px 0 0; font-size: 13px; opacity: 0.9; }
        .content { padding: 28px 24px; }
        .otp-box { margin: 24px 0; padding: 18px; background: #eef2ff; border: 1px dashed #6366f1; border-radius: 10px; text-align: center; }
        .otp-code { font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #312e81; }
        .meta { font-size: 13px; color: #64748b; margin-top: 16px; }
        .footer { padding: 16px 24px; background: #f1f5f9; font-size: 12px; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>StockPro Password Reset</h2>
            <p>Workspace: {{ $tenantName }}</p>
        </div>
        <div class="content">
            <p>Hello <strong>{{ $userName }}</strong>,</p>
            <p>We received a request to reset the owner password for your <strong>{{ $tenantName }}</strong> workspace on StockPro. Use the One-Time Password (OTP) below to verify your identity:</p>

            <div class="otp-box">
                <div class="otp-code">{{ $otp }}</div>
            </div>

            <p class="meta">This OTP is valid for <strong>{{ $expiresInMinutes }} minutes</strong> and can only be used for the <strong>{{ $tenantName }}</strong> workspace.</p>
            <p class="meta">If you did not request a password reset, you can safely ignore this email — your account password will remain unchanged.</p>
        </div>
        <div class="footer">
            StockPro Inventory &amp; Sales Management &bull; Multi-tenant Isolated Security
        </div>
    </div>
</body>
</html>
