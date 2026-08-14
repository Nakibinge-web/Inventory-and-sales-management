<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: sans-serif; color: #333; line-height: 1.6; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4f46e5; color: white; padding: 15px; border-radius: 8px; text-align: center; }
        .content { padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; margin-top: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: left; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>{{ str_replace('_', ' ', ucfirst($reportType)) }}</h2>
            <p>{{ $periodStart }} to {{ $periodEnd }}</p>
        </div>
        <div class="content">
            <p>Your automated report is ready.</p>
            <h3>Summary</h3>
            <ul>
                @isset($reportData['total_sales']) <li>Total Sales: UGX {{ number_format($reportData['total_sales']) }}</li> @endisset
                @isset($reportData['total_amount']) <li>Total Amount: UGX {{ number_format($reportData['total_amount']) }}</li> @endisset
                @isset($reportData['total_profit']) <li>Total Profit: UGX {{ number_format($reportData['total_profit']) }}</li> @endisset
            </ul>
        </div>
    </div>
</body>
</html>
