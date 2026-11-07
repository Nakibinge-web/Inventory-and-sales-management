<?php

namespace App\Http\Controllers;

use App\Models\GeneratedReport;
use App\Services\ReportService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use PhpOffice\PhpWord\PhpWord;
use PhpOffice\PhpWord\IOFactory;
use Carbon\Carbon;

class ReportExportController extends Controller
{
    public function __construct(private ReportService $reportService)
    {
    }

    private function authorizeReportAccess()
    {
        $user = Auth::user();
        if (!$user) {
            abort(401, 'Unauthenticated.');
        }

        if (isset($user->is_active) && !$user->is_active) {
            abort(403, 'Your account has been disabled.');
        }
        
        // Owner, admin, and manager roles have access by default
        if ($user->hasRole('owner') || $user->hasRole('admin') || $user->hasRole('manager')) {
            return;
        }
        
        // Otherwise check for specific permission
        if (!$user->hasPermission('reports.view') && !$user->hasPermission('sales.report')) {
            abort(403, 'You do not have permission to export reports.');
        }
    }

    /**
     * Export a stored generated report as PDF or Word
     */
    public function exportGeneratedReport(Request $request, int $id)
    {
        $this->authorizeReportAccess();

        $validated = $request->validate([
            'format' => 'required|in:pdf,docx',
        ]);

        $report = GeneratedReport::findOrFail($id);
        $format = $validated['format'];

        $fileName = $this->generateFileName($report->report_type, $report->generated_at, $format);

        if ($format === 'pdf') {
            return $this->exportAsPdf($report, $fileName);
        }

        return $this->exportAsWord($report, $fileName);
    }

    /**
     * Generate and export a business overview report on-demand
     */
    public function exportOverviewReport(Request $request)
    {
        $this->authorizeReportAccess();

        $validated = $request->validate([
            'format' => 'required|in:pdf,docx',
        ]);

        $format = $validated['format'];
        $reportData = $this->reportService->getOverviewReport();

        $fileName = $this->generateFileName("business_overview", now(), $format);

        $report = (object) [
            'report_type' => "business_overview",
            'generated_at' => now(),
            'data' => $reportData,
        ];

        if ($format === 'pdf') {
            return $this->exportAsPdf($report, $fileName);
        }

        return $this->exportAsWord($report, $fileName);
    }

    /**
     * Generate and export a sales report on-demand
     */
    public function exportSalesReport(Request $request)
    {
        $this->authorizeReportAccess();

        $validated = $request->validate([
            'report_type' => 'required|in:daily,weekly,monthly,yearly',
            'format' => 'required|in:pdf,docx',
            'date' => 'required_if:report_type,daily,weekly|date',
            'month' => 'required_if:report_type,monthly|date_format:Y-m',
            'year' => 'required_if:report_type,yearly|integer|min:2020|max:2100',
        ]);

        $reportType = $validated['report_type'];
        $format = $validated['format'];

        // Generate report data based on type
        $reportData = match ($reportType) {
            'daily' => $this->reportService->getDailySalesReport($validated['date']),
            'weekly' => $this->reportService->getWeeklySalesReport($validated['date']),
            'monthly' => $this->reportService->getMonthlySalesReport($validated['month']),
            'yearly' => $this->reportService->getYearlySalesReport((int)$validated['year']),
        };

        $fileName = $this->generateFileName("sales_{$reportType}", now(), $format);

        $report = (object) [
            'report_type' => "sales_{$reportType}",
            'generated_at' => now(),
            'data' => $reportData,
        ];

        if ($format === 'pdf') {
            return $this->exportAsPdf($report, $fileName);
        }

        return $this->exportAsWord($report, $fileName);
    }

    /**
     * Generate and export a purchases report on-demand
     */
    public function exportPurchasesReport(Request $request)
    {
        $this->authorizeReportAccess();

        $validated = $request->validate([
            'report_type' => 'required|in:daily,monthly',
            'format' => 'required|in:pdf,docx',
            'date' => 'required_if:report_type,daily|date',
            'month' => 'required_if:report_type,monthly|date_format:Y-m',
        ]);

        $reportType = $validated['report_type'];
        $format = $validated['format'];

        // Generate report data based on type
        $reportData = match ($reportType) {
            'daily' => $this->reportService->getDailyPurchasesReport($validated['date']),
            'monthly' => $this->reportService->getMonthlyPurchasesReport($validated['month']),
        };

        $fileName = $this->generateFileName("purchases_{$reportType}", now(), $format);

        $report = (object) [
            'report_type' => "purchases_{$reportType}",
            'generated_at' => now(),
            'data' => $reportData,
        ];

        if ($format === 'pdf') {
            return $this->exportAsPdf($report, $fileName);
        }

        return $this->exportAsWord($report, $fileName);
    }

    /**
     * Export report as PDF
     */
    private function exportAsPdf($report, string $fileName)
    {
        $html = $this->generateReportHtml($report);
        
        $pdf = Pdf::loadHTML($html)
            ->setPaper('a4', 'portrait')
            ->setOptions([
                'isHtml5ParserEnabled' => true,
                'isRemoteEnabled' => false,
                'defaultFont' => 'sans-serif',
            ]);

        return $pdf->download($fileName);
    }

    /**
     * Export report as Word document
     */
    private function exportAsWord($report, string $fileName)
    {
        $tenant = $this->getTenant();
        $tenantName = $tenant?->name ?? 'InventoryPro';

        $phpWord = new PhpWord();
        
        // Set document properties
        $properties = $phpWord->getDocInfo();
        $properties->setCreator($tenantName);
        $properties->setTitle(ucwords(str_replace('_', ' ', $report->report_type)));
        $properties->setDescription('Generated Business Report');

        $section = $phpWord->addSection([
            'marginTop' => 1000,
            'marginBottom' => 1000,
            'marginLeft' => 1000,
            'marginRight' => 1000,
        ]);

        // Add header
        $section->addText(
            strtoupper($tenantName),
            ['bold' => true, 'size' => 16, 'color' => '1E3A8A']
        );

        $section->addText(
            ucwords(str_replace('_', ' ', $report->report_type)) . ' Report',
            ['bold' => true, 'size' => 13, 'color' => '374151']
        );

        $section->addText(
            'Generated: ' . Carbon::parse($report->generated_at)->format('F j, Y g:i A'),
            ['size' => 10, 'color' => '6B7280']
        );

        if ($tenant?->phone || $tenant?->email || $tenant?->address) {
            $contacts = array_filter([$tenant->phone, $tenant->email, $tenant->address]);
            $section->addText(implode(' | ', $contacts), ['size' => 9, 'color' => '9CA3AF']);
        }

        $section->addTextBreak(1);

        // Add report content
        $this->addReportContentToWord($section, $report);

        // Save to temporary file
        $tempFile = tempnam(sys_get_temp_dir(), 'report_');
        $tempFile .= '.docx';
        
        $writer = IOFactory::createWriter($phpWord, 'Word2007');
        $writer->save($tempFile);

        return response()->download($tempFile, $fileName, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ])->deleteFileAfterSend(true);
    }

    private function getTenant()
    {
        return Auth::user()?->tenant ?? (app()->bound('current_tenant') ? app('current_tenant') : null);
    }

    /**
     * Generate HTML for PDF report
     */
    private function generateReportHtml($report): string
    {
        $reportType = $report->report_type;
        $data = is_array($report->data) ? $report->data : (array) $report->data;
        $generatedAt = Carbon::parse($report->generated_at)->format('F j, Y g:i A');

        $tenant = $this->getTenant();
        $tenantName = $tenant?->name ?? 'InventoryPro';
        $tenantContacts = [];
        if ($tenant?->phone) $tenantContacts[] = "Tel: {$tenant->phone}";
        if ($tenant?->email) $tenantContacts[] = "Email: {$tenant->email}";
        if ($tenant?->address) $tenantContacts[] = $tenant->address;
        $contactStr = implode(' | ', $tenantContacts);

        $title = ucwords(str_replace('_', ' ', $reportType));

        $html = "
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='utf-8'>
            <title>{$title} - {$tenantName}</title>
            <style>
                body {
                    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                    font-size: 10pt;
                    color: #1F2937;
                    margin: 20px;
                }
                .header {
                    text-align: center;
                    margin-bottom: 24px;
                    border-bottom: 2px solid #2563EB;
                    padding-bottom: 14px;
                }
                .header .tenant-name {
                    font-size: 20pt;
                    font-weight: bold;
                    color: #1E3A8A;
                    margin: 0 0 4px 0;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .header h1 {
                    color: #374151;
                    font-size: 15pt;
                    margin: 0 0 4px 0;
                }
                .header .date {
                    color: #6B7280;
                    font-size: 9pt;
                }
                .header .contacts {
                    color: #9CA3AF;
                    font-size: 8.5pt;
                    margin-top: 4px;
                }
                .summary {
                    background: #F8FAFC;
                    border: 1px solid #E2E8F0;
                    border-radius: 8px;
                    padding: 14px;
                    margin: 18px 0;
                }
                .summary-grid {
                    width: 100%;
                }
                .summary-item {
                    display: inline-block;
                    width: 48%;
                    margin-bottom: 12px;
                    vertical-align: top;
                }
                .summary-label {
                    font-weight: 700;
                    color: #64748B;
                    font-size: 8.5pt;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }
                .summary-value {
                    font-size: 13pt;
                    color: #0F172A;
                    font-weight: 800;
                    margin-top: 3px;
                }
                .summary-value.profit {
                    color: #16A34A;
                }
                .summary-value.cost {
                    color: #DC2626;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 16px 0 24px 0;
                }
                th {
                    background: #2563EB;
                    color: #ffffff;
                    padding: 8px 10px;
                    text-align: left;
                    font-size: 9pt;
                    font-weight: bold;
                    text-transform: uppercase;
                    letter-spacing: 0.04em;
                }
                td {
                    border-bottom: 1px solid #E2E8F0;
                    padding: 7px 10px;
                    font-size: 8.5pt;
                    color: #334155;
                }
                tr:nth-child(even) td {
                    background: #F8FAFC;
                }
                .text-right {
                    text-align: right;
                }
                .text-center {
                    text-align: center;
                }
                .section-title {
                    color: #0F172A;
                    font-size: 12pt;
                    font-weight: 800;
                    margin: 22px 0 8px 0;
                    border-bottom: 1.5px solid #CBD5E1;
                    padding-bottom: 4px;
                }
                .footer {
                    margin-top: 30px;
                    text-align: center;
                    color: #94A3B8;
                    font-size: 8pt;
                    border-top: 1px solid #E2E8F0;
                    padding-top: 8px;
                }
            </style>
        </head>
        <body>
            <div class='header'>
                <div class='tenant-name'>{$tenantName}</div>
                <h1>{$title} Report</h1>
                <div class='date'>Generated: {$generatedAt}</div>
                " . ($contactStr ? "<div class='contacts'>{$contactStr}</div>" : "") . "
            </div>
        ";

        // Add report-specific content
        if (str_contains($reportType, 'overview')) {
            $html .= $this->generateOverviewReportHtml($data);
        } elseif (str_contains($reportType, 'sales')) {
            $html .= $this->generateSalesReportHtml($data, $reportType);
        } elseif (str_contains($reportType, 'purchase')) {
            $html .= $this->generatePurchasesReportHtml($data, $reportType);
        }

        $html .= "
            <div class='footer'>
                <p>{$tenantName} &bull; Generated automatically via Inventory &amp; Sales Management System</p>
            </div>
        </body>
        </html>
        ";

        return $html;
    }

    /**
     * Generate HTML for Overview report
     */
    private function generateOverviewReportHtml(array $data): string
    {
        $totalSales = floatval($data['total_sales'] ?? 0);
        $totalPurchases = floatval($data['total_purchases'] ?? $data['total_cost'] ?? 0);
        $netProfit = floatval($data['net_profit'] ?? ($totalSales - $totalPurchases));

        $html = "<div class='summary'>";
        $html .= "<div class='summary-item'>
            <div class='summary-label'>Total Sales Revenue</div>
            <div class='summary-value'>UGX " . number_format($totalSales, 2) . "</div>
        </div>";

        $html .= "<div class='summary-item'>
            <div class='summary-label'>Total Purchases / Costs</div>
            <div class='summary-value cost'>UGX " . number_format($totalPurchases, 2) . "</div>
        </div>";

        $html .= "<div class='summary-item'>
            <div class='summary-label'>Net Profit</div>
            <div class='summary-value profit'>UGX " . number_format($netProfit, 2) . "</div>
        </div>";

        $html .= "<div class='summary-item'>
            <div class='summary-label'>Inventory Status</div>
            <div class='summary-value'>" . number_format($data['total_products'] ?? 0) . " products (" . ($data['low_stock_count'] ?? 0) . " low stock)</div>
        </div>";
        $html .= "</div>";

        if (!empty($data['by_payment'])) {
            $html .= $this->generateTableHtml('Sales by Payment Method', $data['by_payment'], [
                'method' => 'Payment Method',
                'total' => 'Total Amount (UGX)',
                'count' => 'Transactions'
            ]);
        }

        if (!empty($data['top_products'])) {
            $html .= $this->generateTableHtml('Top Products by Revenue', $data['top_products'], [
                'rank' => '#',
                'name' => 'Product Name',
                'revenue' => 'Revenue (UGX)'
            ]);
        }

        if (!empty($data['top_suppliers'])) {
            $html .= $this->generateTableHtml('Top Suppliers by Spend', $data['top_suppliers'], [
                'rank' => '#',
                'name' => 'Supplier Name',
                'spend' => 'Spend (UGX)'
            ]);
        }

        return $html;
    }

    /**
     * Generate HTML for sales report data
     */
    private function generateSalesReportHtml(array $data, string $reportType): string
    {
        $html = "<div class='summary'>";

        // Summary metrics
        if (isset($data['total_sales'])) {
            $html .= "<div class='summary-item'>
                <div class='summary-label'>Total Sales</div>
                <div class='summary-value'>UGX " . number_format((float)$data['total_sales'], 2) . "</div>
            </div>";
        }

        if (isset($data['total_profit'])) {
            $profit = (float)$data['total_profit'];
            $class = $profit >= 0 ? 'profit' : 'cost';
            $html .= "<div class='summary-item'>
                <div class='summary-label'>Total Profit</div>
                <div class='summary-value {$class}'>UGX " . number_format($profit, 2) . "</div>
            </div>";
        }

        if (isset($data['total_cost'])) {
            $html .= "<div class='summary-item'>
                <div class='summary-label'>Total Cost</div>
                <div class='summary-value'>UGX " . number_format((float)$data['total_cost'], 2) . "</div>
            </div>";
        }

        if (isset($data['total_transactions'])) {
            $html .= "<div class='summary-item'>
                <div class='summary-label'>Total Transactions</div>
                <div class='summary-value'>" . number_format((int)$data['total_transactions']) . "</div>
            </div>";
        }

        $html .= "</div>";

        // Add breakdown tables based on report type
        if (!empty($data['by_day'])) {
            $html .= $this->generateTableHtml('Daily Breakdown', $data['by_day'], [
                'date' => 'Date',
                'total' => 'Sales (UGX)',
                'profit' => 'Profit (UGX)',
                'transactions' => 'Transactions'
            ]);
        }

        if (!empty($data['by_month'])) {
            $html .= $this->generateTableHtml('Monthly Breakdown', $data['by_month'], [
                'month_name' => 'Month',
                'total' => 'Sales (UGX)',
                'profit' => 'Profit (UGX)',
                'transactions' => 'Transactions'
            ]);
        }

        if (!empty($data['by_quarter'])) {
            $html .= $this->generateTableHtml('Quarterly Breakdown', $data['by_quarter'], [
                'quarter' => 'Quarter',
                'total' => 'Sales (UGX)',
                'profit' => 'Profit (UGX)',
                'transactions' => 'Transactions'
            ]);
        }

        if (!empty($data['by_payment'])) {
            $html .= $this->generateTableHtml('Payment Methods', $data['by_payment'], [
                'method' => 'Method',
                'total' => 'Amount (UGX)',
                'count' => 'Transactions'
            ]);
        }

        // Add sales transactions detail table if present
        if (!empty($data['sales'])) {
            $salesRows = [];
            foreach ($data['sales'] as $sale) {
                $saleArr = is_array($sale) ? $sale : (method_exists($sale, 'toArray') ? $sale->toArray() : (array)$sale);
                $customer = $saleArr['customer']['name'] ?? 'Walk-in';
                $cashier = $saleArr['user']['name'] ?? 'Staff';
                $itemsCount = count($saleArr['sale_items'] ?? $saleArr['saleItems'] ?? []);
                $saleDate = Carbon::parse($saleArr['sale_date'] ?? $saleArr['created_at'] ?? now())->format('Y-m-d H:i');
                
                $salesRows[] = [
                    'date' => $saleDate,
                    'customer' => $customer,
                    'cashier' => $cashier,
                    'payment' => ucwords(str_replace('_', ' ', $saleArr['payment_method'] ?? 'cash')),
                    'items' => $itemsCount,
                    'amount' => number_format((float)($saleArr['total_amount'] ?? 0), 2),
                    'profit' => number_format((float)($saleArr['profit'] ?? 0), 2),
                ];
            }

            $html .= $this->generateTableHtml('Sales Transactions Detail', $salesRows, [
                'date' => 'Date/Time',
                'customer' => 'Customer',
                'cashier' => 'Cashier',
                'payment' => 'Payment',
                'items' => 'Items',
                'amount' => 'Total (UGX)',
                'profit' => 'Profit (UGX)',
            ]);
        }

        return $html;
    }

    /**
     * Generate HTML for purchases report data
     */
    private function generatePurchasesReportHtml(array $data, string $reportType): string
    {
        $html = "<div class='summary'>";

        if (isset($data['total_amount'])) {
            $html .= "<div class='summary-item'>
                <div class='summary-label'>Total Purchases</div>
                <div class='summary-value cost'>UGX " . number_format((float)$data['total_amount'], 2) . "</div>
            </div>";
        }

        if (isset($data['total_purchases'])) {
            $html .= "<div class='summary-item'>
                <div class='summary-label'>Total Purchases</div>
                <div class='summary-value cost'>UGX " . number_format((float)$data['total_purchases'], 2) . "</div>
            </div>";
        }

        if (isset($data['total_transactions'])) {
            $html .= "<div class='summary-item'>
                <div class='summary-label'>Total Transactions</div>
                <div class='summary-value'>" . number_format((int)$data['total_transactions']) . "</div>
            </div>";
        }

        if (isset($data['total_items'])) {
            $html .= "<div class='summary-item'>
                <div class='summary-label'>Total Items</div>
                <div class='summary-value'>" . number_format((int)$data['total_items']) . "</div>
            </div>";
        }

        $html .= "</div>";

        if (!empty($data['by_supplier'])) {
            $html .= $this->generateTableHtml('Purchases by Supplier', $data['by_supplier'], [
                'supplier' => 'Supplier',
                'total_amount' => 'Amount (UGX)',
                'transactions' => 'Transactions'
            ]);
        }

        // Add purchases details table if present
        if (!empty($data['purchases'])) {
            $purchaseRows = [];
            foreach ($data['purchases'] as $p) {
                $pArr = is_array($p) ? $p : (method_exists($p, 'toArray') ? $p->toArray() : (array)$p);
                $supplier = $pArr['supplier']['name'] ?? 'Unknown';
                $pDate = Carbon::parse($pArr['purchase_date'] ?? $pArr['created_at'] ?? now())->format('Y-m-d');
                $itemsCount = count($pArr['purchase_items'] ?? $pArr['purchaseItems'] ?? []);
                
                $purchaseRows[] = [
                    'id' => '#' . ($pArr['id'] ?? '-'),
                    'date' => $pDate,
                    'supplier' => $supplier,
                    'items' => $itemsCount,
                    'total' => number_format((float)($pArr['total_amount'] ?? 0), 2),
                ];
            }

            $html .= $this->generateTableHtml('Purchase Orders Detail', $purchaseRows, [
                'id' => 'Order #',
                'date' => 'Date',
                'supplier' => 'Supplier',
                'items' => 'Items',
                'total' => 'Total Spent (UGX)',
            ]);
        }

        return $html;
    }

    /**
     * Safely normalize data to array of arrays
     */
    private function normalizeData($data): array
    {
        if ($data instanceof \Illuminate\Support\Collection) {
            $data = $data->all();
        } elseif (!is_array($data)) {
            $data = (array) $data;
        }

        return array_map(function ($row) {
            if ($row instanceof \Illuminate\Database\Eloquent\Model) {
                return $row->toArray();
            }
            if (is_object($row)) {
                return (array) $row;
            }
            return $row;
        }, $data);
    }

    /**
     * Generate an HTML table
     */
    private function generateTableHtml(string $title, $data, array $columns): string
    {
        $normalizedData = $this->normalizeData($data);

        if (empty($normalizedData)) {
            return '';
        }

        $html = "<h2 class='section-title'>{$title}</h2>";
        $html .= "<table>";
        $html .= "<thead><tr>";

        $colKeys = array_keys($columns);
        foreach ($columns as $header) {
            $isNumeric = false;
            foreach ($colKeys as $k) {
                if (str_contains($k, 'total') || str_contains($k, 'profit') || str_contains($k, 'cost') || str_contains($k, 'amount') || str_contains($k, 'revenue') || str_contains($k, 'spend') || str_contains($k, 'count') || str_contains($k, 'transactions')) {
                    $isNumeric = true;
                }
            }
            $html .= "<th>{$header}</th>";
        }

        $html .= "</tr></thead><tbody>";

        foreach ($normalizedData as $row) {
            $rowArr = (array) $row;
            $html .= "<tr>";
            foreach (array_keys($columns) as $key) {
                $value = $rowArr[$key] ?? '-';
                
                // Format numeric values
                $isRight = false;
                if (is_numeric($value) && (str_contains($key, 'total') || str_contains($key, 'profit') || str_contains($key, 'cost') || str_contains($key, 'amount') || str_contains($key, 'revenue') || str_contains($key, 'spend'))) {
                    $value = number_format((float)$value, 2);
                    $isRight = true;
                } elseif (is_numeric($value) && (str_contains($key, 'count') || str_contains($key, 'transactions') || str_contains($key, 'items') || str_contains($key, 'rank'))) {
                    $isRight = true;
                }
                
                $alignClass = $isRight ? " class='text-right'" : "";
                $html .= "<td{$alignClass}>{$value}</td>";
            }
            $html .= "</tr>";
        }

        $html .= "</tbody></table>";

        return $html;
    }

    /**
     * Add report content to Word document
     */
    private function addReportContentToWord($section, $report)
    {
        $data = is_array($report->data) ? $report->data : (array) $report->data;
        $reportType = $report->report_type;

        // Summary section
        $section->addText('Executive Summary', ['bold' => true, 'size' => 14, 'color' => '1E3A8A']);
        $section->addTextBreak(1);

        // Add summary metrics
        if (str_contains($reportType, 'overview')) {
            $totalSales = floatval($data['total_sales'] ?? 0);
            $totalPurchases = floatval($data['total_purchases'] ?? $data['total_cost'] ?? 0);
            $netProfit = floatval($data['net_profit'] ?? ($totalSales - $totalPurchases));

            $section->addText('Total Sales: UGX ' . number_format($totalSales, 2), ['bold' => true, 'size' => 11]);
            $section->addText('Total Purchases / Costs: UGX ' . number_format($totalPurchases, 2), ['size' => 11]);
            $section->addText('Net Profit: UGX ' . number_format($netProfit, 2), ['bold' => true, 'color' => ($netProfit >= 0 ? '16A34A' : 'DC2626'), 'size' => 11]);
            $section->addText('Total Products: ' . ($data['total_products'] ?? 0) . ' (' . ($data['low_stock_count'] ?? 0) . ' low stock)', ['size' => 11]);
        } elseif (str_contains($reportType, 'sales')) {
            if (isset($data['total_sales'])) {
                $section->addText('Total Sales: UGX ' . number_format((float)$data['total_sales'], 2), ['bold' => true, 'size' => 11]);
            }
            if (isset($data['total_profit'])) {
                $profit = (float)$data['total_profit'];
                $section->addText('Total Profit: UGX ' . number_format($profit, 2), ['bold' => true, 'color' => ($profit >= 0 ? '16A34A' : 'DC2626'), 'size' => 11]);
            }
            if (isset($data['total_cost'])) {
                $section->addText('Total Cost: UGX ' . number_format((float)$data['total_cost'], 2), ['size' => 11]);
            }
        } elseif (str_contains($reportType, 'purchase')) {
            $totalAmt = (float)($data['total_amount'] ?? $data['total_purchases'] ?? 0);
            $section->addText('Total Purchases: UGX ' . number_format($totalAmt, 2), ['bold' => true, 'color' => 'DC2626', 'size' => 11]);
        }

        if (isset($data['total_transactions'])) {
            $section->addText('Total Transactions: ' . number_format((int)$data['total_transactions']), ['size' => 11]);
        }

        $section->addTextBreak(1);

        // Add tables for breakdown data
        if (!empty($data['by_day'])) {
            $this->addTableToWord($section, 'Daily Breakdown', $data['by_day'], [
                'date' => 'Date',
                'total' => 'Sales (UGX)',
                'profit' => 'Profit (UGX)',
                'transactions' => 'Transactions'
            ]);
        }

        if (!empty($data['by_month'])) {
            $this->addTableToWord($section, 'Monthly Breakdown', $data['by_month'], [
                'month_name' => 'Month',
                'total' => 'Sales (UGX)',
                'profit' => 'Profit (UGX)',
                'transactions' => 'Transactions'
            ]);
        }

        if (!empty($data['by_quarter'])) {
            $this->addTableToWord($section, 'Quarterly Breakdown', $data['by_quarter'], [
                'quarter' => 'Quarter',
                'total' => 'Sales (UGX)',
                'profit' => 'Profit (UGX)',
                'transactions' => 'Transactions'
            ]);
        }

        if (!empty($data['by_payment'])) {
            $this->addTableToWord($section, 'Payment Methods', $data['by_payment'], [
                'method' => 'Method',
                'total' => 'Amount (UGX)',
                'count' => 'Count'
            ]);
        }

        if (!empty($data['by_supplier'])) {
            $this->addTableToWord($section, 'Purchases by Supplier', $data['by_supplier'], [
                'supplier' => 'Supplier',
                'total_amount' => 'Amount (UGX)',
                'transactions' => 'Transactions'
            ]);
        }

        if (!empty($data['top_products'])) {
            $this->addTableToWord($section, 'Top Products by Revenue', $data['top_products'], [
                'rank' => '#',
                'name' => 'Product Name',
                'revenue' => 'Revenue (UGX)'
            ]);
        }

        if (!empty($data['top_suppliers'])) {
            $this->addTableToWord($section, 'Top Suppliers by Spend', $data['top_suppliers'], [
                'rank' => '#',
                'name' => 'Supplier Name',
                'spend' => 'Spend (UGX)'
            ]);
        }
    }

    /**
     * Add a table to Word document
     */
    private function addTableToWord($section, string $title, $data, array $columns)
    {
        $normalizedData = $this->normalizeData($data);

        if (empty($normalizedData)) {
            return;
        }

        $section->addText($title, ['bold' => true, 'size' => 12, 'color' => '1E3A8A']);
        $section->addTextBreak(1);

        $table = $section->addTable([
            'borderSize' => 6,
            'borderColor' => 'E5E7EB',
            'width' => 100 * 50,
            'unit' => 'pct'
        ]);

        // Header row
        $table->addRow();
        foreach ($columns as $header) {
            $table->addCell(2000, ['bgColor' => '2563EB'])
                ->addText($header, ['bold' => true, 'color' => 'FFFFFF', 'size' => 10]);
        }

        // Data rows
        foreach ($normalizedData as $row) {
            $rowArr = (array) $row;
            $table->addRow();
            foreach (array_keys($columns) as $key) {
                $value = $rowArr[$key] ?? '-';
                
                // Format numeric values
                if (is_numeric($value) && (str_contains($key, 'total') || str_contains($key, 'profit') || str_contains($key, 'cost') || str_contains($key, 'amount') || str_contains($key, 'revenue') || str_contains($key, 'spend'))) {
                    $value = number_format((float)$value, 2);
                }
                
                $table->addCell(2000)->addText((string)$value, ['size' => 9]);
            }
        }

        $section->addTextBreak(1);
    }

    /**
     * Generate a standardized filename
     */
    private function generateFileName(string $reportType, $date, string $format): string
    {
        $timestamp = Carbon::parse($date)->format('Y-m-d_His');
        $cleanType = str_replace('_', '-', $reportType);
        return "{$cleanType}-report-{$timestamp}.{$format}";
    }

    /**
     * List all available generated reports for export
     */
    public function listGeneratedReports(): JsonResponse
    {
        $this->authorizeReportAccess();

        $reports = GeneratedReport::orderBy('generated_at', 'desc')
            ->select('id', 'report_type', 'generated_at')
            ->get()
            ->map(fn($report) => [
                'id' => $report->id,
                'report_type' => $report->report_type,
                'generated_at' => $report->generated_at->format('Y-m-d H:i:s'),
                'export_urls' => [
                    'pdf' => route('reports.export-generated', ['id' => $report->id, 'format' => 'pdf']),
                    'docx' => route('reports.export-generated', ['id' => $report->id, 'format' => 'docx']),
                ]
            ]);

        return response()->json([
            'success' => true,
            'data' => $reports
        ]);
    }
}
