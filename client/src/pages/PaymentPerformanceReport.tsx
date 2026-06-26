import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OrganisationFilterCombobox } from "@/components/OrganisationFilterCombobox";
import { ArrowLeft, Download, FileSpreadsheet, FileText, TrendingUp, Calendar, Clock, CreditCard, Building2, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Link } from "wouter";
import ExcelJS from 'exceljs';

export default function PaymentPerformanceReport() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [orgFilter, setOrgFilter] = useState<string>("all");

  const { data: cases, isLoading: casesLoading } = useQuery({
    queryKey: user?.isAdmin ? ["/api/admin/cases"] : ["/api/cases"],
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to load cases",
        variant: "destructive",
      });
    },
  });

  const { data: payments, isLoading: paymentsLoading } = useQuery({
    queryKey: ["/api/payments"],
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to load payments",
        variant: "destructive",
      });
    },
  });

  // Fetch all organisations for admin filtering
  const { data: allOrganisations } = useQuery<any[]>({
    queryKey: ["/api/admin/organisations"],
    enabled: user?.isAdmin === true,
  });

  // Fetch user's organisations for filtering (non-admin users)
  const { data: userOrganisations } = useQuery<any[]>({
    queryKey: ["/api/user/organisations"],
    enabled: user?.isAdmin !== true,
  });

  // For admin users, show all organisations; for regular users, show their organisations
  const organisations = user?.isAdmin ? allOrganisations : userOrganisations;

  // Check if organisation filter should be shown (admin users always see it, regular users only if they have multiple orgs)
  const showOrgFilter = user?.isAdmin || (userOrganisations && userOrganisations.length > 1);

  // Filter cases based on organisation filter
  const filteredCases = useMemo(() => {
    if (!cases) return [];
    if (orgFilter === "all") return cases;
    return cases.filter((c: any) => c.organisationId === parseInt(orgFilter));
  }, [cases, orgFilter]);

  // Filter payments based on filtered cases
  const filteredPayments = useMemo(() => {
    if (!payments) return [];
    if (orgFilter === "all") return payments;
    const caseIds = new Set(filteredCases.map((c: any) => c.id));
    return payments.filter((p: any) => caseIds.has(p.caseId));
  }, [payments, filteredCases, orgFilter]);

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(num);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  const getPaymentMetrics = () => {
    if (!filteredPayments || !filteredCases) return null;

    const now = new Date();
    const thirtyDaysAgo  = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo   = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo  = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    const last30Days = filteredPayments.filter((p: any) => new Date(p.paymentDate) >= thirtyDaysAgo);
    const last60Days = filteredPayments.filter((p: any) => new Date(p.paymentDate) >= sixtyDaysAgo);
    const last90Days = filteredPayments.filter((p: any) => new Date(p.paymentDate) >= ninetyDaysAgo);

    const totalPayments    = filteredPayments.reduce((sum: number, p: any) => sum + parseFloat(p.amount), 0);
    const avgPaymentAmount = filteredPayments.length > 0 ? totalPayments / filteredPayments.length : 0;

    // Largest single payment
    const largestPayment = filteredPayments.reduce((max: number, p: any) => Math.max(max, parseFloat(p.amount)), 0);

    // Most recent payment date
    const mostRecentPayment = filteredPayments.reduce((latest: string | null, p: any) => {
      if (!latest) return p.paymentDate;
      return new Date(p.paymentDate) > new Date(latest) ? p.paymentDate : latest;
    }, null as string | null);

    // Cases that have at least one payment
    const casesWithPaymentIds = new Set(filteredPayments.map((p: any) => p.caseId));

    // Total original debt and outstanding across filtered cases
    const totalOriginalDebt  = filteredCases.reduce((sum: number, c: any) => sum + parseFloat(c.originalAmount || 0), 0);
    const totalOutstanding   = filteredCases.reduce((sum: number, c: any) => sum + parseFloat(c.outstandingAmount || 0), 0);
    const collectionRate     = totalOriginalDebt > 0 ? (totalPayments / totalOriginalDebt) * 100 : 0;

    // Payment method breakdown — amount + count
    const methodBreakdown = filteredPayments.reduce((acc: any, payment: any) => {
      const method = payment.paymentMethod || 'Not Specified';
      if (!acc[method]) acc[method] = { total: 0, count: 0 };
      acc[method].total += parseFloat(payment.amount);
      acc[method].count += 1;
      return acc;
    }, {} as Record<string, { total: number; count: number }>);

    // Monthly payment trends — sorted chronologically
    const monthlyMap = filteredPayments.reduce((acc: any, payment: any) => {
      const d = new Date(payment.paymentDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('en-GB', { month: 'short', year: 'numeric' });
      if (!acc[key]) acc[key] = { label, total: 0, count: 0 };
      acc[key].total += parseFloat(payment.amount);
      acc[key].count += 1;
      return acc;
    }, {} as Record<string, { label: string; total: number; count: number }>);

    const monthlyTrends = Object.entries(monthlyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => v);

    return {
      totalPayments,
      totalPaymentCount:  filteredPayments.length,
      avgPaymentAmount,
      largestPayment,
      mostRecentPayment,
      casesWithPayments:  casesWithPaymentIds.size,
      totalCases:         filteredCases.length,
      totalOriginalDebt,
      totalOutstanding,
      collectionRate,
      last30DaysTotal:    last30Days.reduce((sum: number, p: any) => sum + parseFloat(p.amount), 0),
      last30DaysCount:    last30Days.length,
      last60DaysTotal:    last60Days.reduce((sum: number, p: any) => sum + parseFloat(p.amount), 0),
      last60DaysCount:    last60Days.length,
      last90DaysTotal:    last90Days.reduce((sum: number, p: any) => sum + parseFloat(p.amount), 0),
      last90DaysCount:    last90Days.length,
      methodBreakdown,
      monthlyTrends,
    };
  };

  const handleExportExcel = async () => {
    if (!filteredPayments || filteredPayments.length === 0) {
      toast({ title: "No Data", description: "No payment data available to export.", variant: "destructive" });
      return;
    }

    try {
      const metrics = getPaymentMetrics();
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Acclaim';
      workbook.created = new Date();

      // ── Palette ──────────────────────────────────────────────────────────
      const TEAL_HDR   = 'FF0F766E';
      const TEAL_TOT   = 'FF134E4A';
      const TEAL_TITLE = 'FF0F766E';
      const WHITE      = 'FFFFFFFF';
      const ROW_ODD    = 'FFFFFFFF';
      const ROW_EVEN   = 'FFF0FDFA';
      const BORDER_CLR = 'FFD1D5DB';
      const GBP_FMT    = '"£"#,##0.00';

      const thinBorder = {
        top:    { style: 'thin' as const, color: { argb: BORDER_CLR } },
        left:   { style: 'thin' as const, color: { argb: BORDER_CLR } },
        bottom: { style: 'thin' as const, color: { argb: BORDER_CLR } },
        right:  { style: 'thin' as const, color: { argb: BORDER_CLR } },
      };

      const applyHeader = (ws: ExcelJS.Worksheet) => {
        const row = ws.getRow(1);
        row.height = 28;
        row.eachCell({ includeEmpty: true }, (cell) => {
          cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: TEAL_HDR } };
          cell.font      = { bold: true, color: { argb: WHITE }, size: 10, name: 'Calibri' };
          cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
          cell.border    = thinBorder;
        });
      };

      const styleDataRow = (row: ExcelJS.Row, rowIdx: number) => {
        row.height = 18;
        const bg = rowIdx % 2 === 0 ? ROW_ODD : ROW_EVEN;
        row.eachCell({ includeEmpty: true }, (cell) => {
          cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
          cell.font      = { size: 10, name: 'Calibri', color: { argb: 'FF111827' } };
          cell.border    = thinBorder;
          cell.alignment = { vertical: 'middle' };
        });
      };

      const addTotalsRow = (ws: ExcelJS.Worksheet, values: any[]) => {
        const row = ws.addRow(values);
        row.height = 22;
        row.eachCell({ includeEmpty: true }, (cell) => {
          cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: TEAL_TOT } };
          cell.font      = { bold: true, color: { argb: WHITE }, size: 10, name: 'Calibri' };
          cell.border    = thinBorder;
          cell.alignment = { vertical: 'middle' };
        });
        return row;
      };

      // ── 1. Summary sheet ─────────────────────────────────────────────────
      const sumWs = workbook.addWorksheet('Summary');
      sumWs.columns = [{ key: 'label', width: 28 }, { key: 'value', width: 22 }];

      const sumRows: [string, any, boolean?][] = [
        ['Payment Performance Report', '', false],
        ['Generated', new Date().toLocaleDateString('en-GB'), false],
        ['', '', false],
        ['Total Collected', metrics?.totalPayments || 0, true],
        ['Total Payment Count', metrics?.totalPaymentCount || 0, false],
        ['Average Payment Amount', metrics?.avgPaymentAmount || 0, true],
        ['Largest Single Payment', metrics?.largestPayment || 0, true],
        ['Most Recent Payment', metrics?.mostRecentPayment ? formatDate(metrics.mostRecentPayment) : '—', false],
        ['', '', false],
        ['Total Original Debt', metrics?.totalOriginalDebt || 0, true],
        ['Total Outstanding', metrics?.totalOutstanding || 0, true],
        ['Cases with Payments', metrics?.casesWithPayments || 0, false],
        ['Total Cases', metrics?.totalCases || 0, false],
        ['', '', false],
        ['Last 30 Days Total', metrics?.last30DaysTotal || 0, true],
        ['Last 30 Days Count', metrics?.last30DaysCount || 0, false],
        ['Last 60 Days Total', metrics?.last60DaysTotal || 0, true],
        ['Last 60 Days Count', metrics?.last60DaysCount || 0, false],
        ['Last 90 Days Total', metrics?.last90DaysTotal || 0, true],
        ['Last 90 Days Count', metrics?.last90DaysCount || 0, false],
      ];

      sumRows.forEach(([label, value, isCurrency], i) => {
        const row = sumWs.addRow([label, value]);
        if (i === 0) {
          row.getCell(1).font = { bold: true, size: 13, color: { argb: TEAL_TITLE }, name: 'Calibri' };
        } else {
          row.getCell(1).font = { size: 10, name: 'Calibri' };
          row.getCell(2).font = { size: 10, name: 'Calibri', color: { argb: isCurrency ? 'FF15803D' : 'FF111827' } };
          if (isCurrency && typeof value === 'number') row.getCell(2).numFmt = GBP_FMT;
        }
      });

      // ── 2. Payment Details sheet ─────────────────────────────────────────
      const detailsWs = workbook.addWorksheet('Payment Details', { views: [{ state: 'frozen', ySplit: 1 }] });
      detailsWs.columns = [
        { header: 'Account Number',   key: 'accountNumber',   width: 20 },
        { header: 'Case Name',        key: 'caseName',        width: 30 },
        { header: 'Organisation',     key: 'organisation',    width: 24 },
        { header: 'Payment Amount',   key: 'amount',          width: 16 },
        { header: 'Payment Date',     key: 'date',            width: 14 },
        { header: 'Payment Method',   key: 'method',          width: 18 },
        { header: 'Case Status',      key: 'status',          width: 13 },
        { header: 'Original Amount',  key: 'originalAmount',  width: 16 },
        { header: 'Outstanding',      key: 'outstanding',     width: 16 },
      ];
      applyHeader(detailsWs);

      filteredPayments.forEach((payment: any, rowIdx: number) => {
        const case_ = filteredCases.find((c: any) => c.id === payment.caseId);
        const row = detailsWs.addRow({
          accountNumber:  case_?.accountNumber || 'N/A',
          caseName:       case_?.caseName || 'N/A',
          organisation:   case_?.organisationName || '',
          amount:         parseFloat(payment.amount),
          date:           formatDate(payment.paymentDate),
          method:         payment.paymentMethod || 'Not Specified',
          status:         case_?.status || 'N/A',
          originalAmount: case_ ? parseFloat(case_.originalAmount) : 0,
          outstanding:    case_ ? parseFloat(case_.outstandingAmount) : 0,
        });
        styleDataRow(row, rowIdx);
        row.getCell(4).numFmt = GBP_FMT;
        row.getCell(4).font   = { size: 10, name: 'Calibri', bold: true, color: { argb: 'FF15803D' } };
        row.getCell(8).numFmt = GBP_FMT;
        row.getCell(9).numFmt = GBP_FMT;
        row.getCell(9).font   = { size: 10, name: 'Calibri', color: { argb: 'FFC2410C' } };
      });

      // Totals row
      const detailsTotal = addTotalsRow(detailsWs, [
        '', 'TOTAL', '', metrics?.totalPayments || 0, '', `${metrics?.totalPaymentCount || 0} payments`, '', '', ''
      ]);
      detailsTotal.getCell(4).numFmt = GBP_FMT;

      // ── 3. Payment Methods sheet ─────────────────────────────────────────
      const methodEntries = Object.entries(metrics?.methodBreakdown || {})
        .sort(([, a]: any, [, b]: any) => b.total - a.total) as [string, { total: number; count: number }][];

      if (methodEntries.length > 0) {
        const methodWs = workbook.addWorksheet('Payment Methods', { views: [{ state: 'frozen', ySplit: 1 }] });
        methodWs.columns = [
          { header: 'Payment Method',  key: 'method', width: 22 },
          { header: 'Total Amount',    key: 'total',  width: 16 },
          { header: 'Count',           key: 'count',  width: 10 },
          { header: 'Avg per Payment', key: 'avg',    width: 16 },
        ];
        applyHeader(methodWs);

        methodEntries.forEach(([method, data], rowIdx) => {
          const row = methodWs.addRow({ method, total: data.total, count: data.count, avg: data.total / data.count });
          styleDataRow(row, rowIdx);
          row.getCell(2).numFmt = GBP_FMT;
          row.getCell(2).font   = { size: 10, name: 'Calibri', bold: true, color: { argb: 'FF0F766E' } };
          row.getCell(4).numFmt = GBP_FMT;
        });

        const grandTotal = methodEntries.reduce((s, [, d]) => s + d.total, 0);
        const grandCount = methodEntries.reduce((s, [, d]) => s + d.count, 0);
        const totRow = addTotalsRow(methodWs, ['TOTAL', grandTotal, grandCount, grandTotal / grandCount]);
        totRow.getCell(2).numFmt = GBP_FMT;
        totRow.getCell(4).numFmt = GBP_FMT;
      }

      // ── 4. Monthly Trends sheet ──────────────────────────────────────────
      const trends = metrics?.monthlyTrends || [];
      if (trends.length > 0) {
        const trendsWs = workbook.addWorksheet('Monthly Trends', { views: [{ state: 'frozen', ySplit: 1 }] });
        trendsWs.columns = [
          { header: 'Month',          key: 'month', width: 14 },
          { header: 'Total Amount',   key: 'total', width: 16 },
          { header: 'Payment Count',  key: 'count', width: 14 },
          { header: 'Average Amount', key: 'avg',   width: 16 },
        ];
        applyHeader(trendsWs);

        trends.forEach((row: any, rowIdx: number) => {
          const r = trendsWs.addRow({ month: row.label, total: row.total, count: row.count, avg: row.total / row.count });
          styleDataRow(r, rowIdx);
          r.getCell(2).numFmt = GBP_FMT;
          r.getCell(2).font   = { size: 10, name: 'Calibri', bold: true, color: { argb: 'FF15803D' } };
          r.getCell(4).numFmt = GBP_FMT;
        });

        const trendTotal = trends.reduce((s: number, r: any) => s + r.total, 0);
        const trendCount = trends.reduce((s: number, r: any) => s + r.count, 0);
        const tTotRow = addTotalsRow(trendsWs, ['TOTAL', trendTotal, trendCount, trendTotal / trendCount]);
        tTotRow.getCell(2).numFmt = GBP_FMT;
        tTotRow.getCell(4).numFmt = GBP_FMT;
      }

      // ── Write file ───────────────────────────────────────────────────────
      const buffer = await workbook.xlsx.writeBuffer();
      const blob   = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url    = URL.createObjectURL(blob);
      const a      = document.createElement('a');
      const now    = new Date();
      a.href       = url;
      a.download   = `payment-performance-report-${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);

      toast({ title: "Export Successful", description: "Payment performance report exported to Excel." });
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast({ title: "Export Failed", description: "Failed to export payment performance report.", variant: "destructive" });
    }
  };

  const handleDownloadPDF = () => {
    if (!payments || !cases) {
      toast({
        title: "No Data",
        description: "No payment data available to generate PDF.",
        variant: "destructive",
      });
      return;
    }

    try {
      const metrics = getPaymentMetrics();
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Could not open print window');
      }

      const currentDate = formatDate(new Date().toISOString());
      
      // Generate method breakdown table
      const methodRows = Object.entries(metrics?.methodBreakdown || {})
        .sort(([, a]: any, [, b]: any) => b.total - a.total)
        .map(([method, data]: [string, any]) => `
        <tr>
          <td>${method}</td>
          <td class="currency">${formatCurrency(data.total)}</td>
          <td class="center">${data.count}</td>
          <td class="currency">${formatCurrency(data.total / data.count)}</td>
        </tr>
      `).join('');

      // Generate monthly trends table (already sorted chronologically)
      const monthlyRows = (metrics?.monthlyTrends || []).map((row: any) => `
        <tr>
          <td>${row.label}</td>
          <td class="currency">${formatCurrency(row.total)}</td>
          <td class="center">${row.count}</td>
          <td class="currency">${formatCurrency(row.total / row.count)}</td>
        </tr>
      `).join('');

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Payment Performance Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .header h1 { margin: 0; font-size: 24px; color: #0f766e; }
            .header p { margin: 5px 0; color: #666; }
            .section { margin-bottom: 30px; }
            .section h2 { font-size: 18px; margin-bottom: 15px; color: #333; }
            .metrics-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 30px; }
            .metric-card { padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
            .metric-label { font-size: 14px; color: #666; margin-bottom: 5px; }
            .metric-value { font-size: 24px; font-weight: bold; color: #0f766e; }
            .breakdown-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 20px; }
            .breakdown-card { padding: 15px; border: 1px solid #ddd; border-radius: 5px; text-align: center; }
            .breakdown-label { font-size: 12px; color: #666; margin-bottom: 5px; }
            .breakdown-value { font-size: 18px; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { padding: 8px; text-align: left; border: 1px solid #ddd; font-size: 12px; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .currency { text-align: right; }
            .center { text-align: center; }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Payment Performance Report</h1>
            <p>Generated on: ${currentDate}</p>
          </div>
          
          <div class="section">
            <h2>Key Performance Metrics</h2>
            <div class="metrics-grid">
              <div class="metric-card">
                <div class="metric-label">Total Collected</div>
                <div class="metric-value">${formatCurrency(metrics?.totalPayments || 0)}</div>
                <div class="metric-label">${metrics?.totalPaymentCount || 0} payments</div>
              </div>
              <div class="metric-card">
                <div class="metric-label">Total Outstanding</div>
                <div class="metric-value" style="color:#ea580c">${formatCurrency(metrics?.totalOutstanding || 0)}</div>
                <div class="metric-label">across ${metrics?.totalCases || 0} cases</div>
              </div>
              <div class="metric-card">
                <div class="metric-label">Cases with Payments</div>
                <div class="metric-value">${metrics?.casesWithPayments || 0}</div>
                <div class="metric-label">of ${metrics?.totalCases || 0} total cases</div>
              </div>
              <div class="metric-card">
                <div class="metric-label">Average Payment</div>
                <div class="metric-value">${formatCurrency(metrics?.avgPaymentAmount || 0)}</div>
              </div>
              <div class="metric-card">
                <div class="metric-label">Largest Payment</div>
                <div class="metric-value">${formatCurrency(metrics?.largestPayment || 0)}</div>
              </div>
            </div>
          </div>

          <div class="section">
            <h2>Recent Payment Trends</h2>
            <div class="breakdown-grid">
              <div class="breakdown-card">
                <div class="breakdown-label">Last 30 Days</div>
                <div class="breakdown-value">${formatCurrency(metrics?.last30DaysTotal || 0)}</div>
                <div class="breakdown-label">${metrics?.last30DaysCount || 0} payments</div>
              </div>
              <div class="breakdown-card">
                <div class="breakdown-label">Last 60 Days</div>
                <div class="breakdown-value">${formatCurrency(metrics?.last60DaysTotal || 0)}</div>
                <div class="breakdown-label">${metrics?.last60DaysCount || 0} payments</div>
              </div>
              <div class="breakdown-card">
                <div class="breakdown-label">Last 90 Days</div>
                <div class="breakdown-value">${formatCurrency(metrics?.last90DaysTotal || 0)}</div>
                <div class="breakdown-label">${metrics?.last90DaysCount || 0} payments</div>
              </div>
            </div>
          </div>

          <div class="section">
            <h2>Payment Method Breakdown</h2>
            <table>
              <thead>
                <tr>
                  <th>Payment Method</th>
                  <th>Total Amount</th>
                  <th class="center">Count</th>
                  <th>Avg per Payment</th>
                </tr>
              </thead>
              <tbody>
                ${methodRows}
              </tbody>
            </table>
          </div>

          <div class="section">
            <h2>Monthly Payment Trends</h2>
            <table>
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Total Amount</th>
                  <th>Payment Count</th>
                  <th>Average Amount</th>
                </tr>
              </thead>
              <tbody>
                ${monthlyRows}
              </tbody>
            </table>
          </div>
        </body>
        </html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // Focus the new window
      printWindow.onload = () => {
        printWindow.focus();
      };
      
      toast({
        title: "Report Opened",
        description: "The payment performance report has been opened in a new tab for viewing.",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "PDF Generation Failed",
        description: "Failed to generate PDF report. Please try the Excel export instead.",
        variant: "destructive",
      });
    }
  };

  const metrics = getPaymentMetrics();

  if (casesLoading || paymentsLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-acclaim-teal mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading payment performance data...</p>
        </div>
      </div>
    );
  }

  if (!payments || payments.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Payment Data Available</h2>
          <p className="text-gray-600">No payments have been recorded yet. This report will be available once payments are made.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <Link href="/?section=reports">
            <Button variant="outline" size="sm" className="w-full sm:w-auto">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Reports
            </Button>
          </Link>
          <div>
            <h1 className="text-xl sm:text-3xl font-bold text-gray-900">Payment Performance Report</h1>
            <p className="text-sm text-gray-600">Generated on {formatDate(new Date().toISOString())}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportExcel} variant="outline" size="sm" className="flex-1 sm:flex-none bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-700">
            <FileSpreadsheet className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="sm:hidden text-xs font-semibold">XLS</span>
            <span className="hidden sm:inline">Export to Excel</span>
          </Button>
          <Button onClick={handleDownloadPDF} variant="outline" size="sm" className="flex-1 sm:flex-none bg-rose-50 hover:bg-rose-100 border-rose-300 text-rose-700">
            <FileText className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="sm:hidden text-xs font-semibold">PDF</span>
            <span className="hidden sm:inline">View PDF Report</span>
          </Button>
        </div>
      </div>

      {/* Organisation Filter - Show for admin users or multi-org users */}
      {showOrgFilter && (
        <Card className="mb-4 sm:mb-6">
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Filter className="h-4 w-4 sm:h-5 sm:w-5" />
              Filter by Organisation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-2 flex-1">
                <Building2 className="h-4 w-4 text-gray-500" />
                <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Organisation:</label>
                <OrganisationFilterCombobox
                  organisations={organisations}
                  value={orgFilter}
                  onValueChange={setOrgFilter}
                  className="w-full sm:w-48"
                />
              </div>
              <div className="text-xs sm:text-sm text-gray-600">
                Showing {filteredPayments?.length || 0} payments
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics — row 1 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <Card>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total Collected</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <span className="text-xl sm:text-2xl font-bold text-green-600">{formatCurrency(metrics?.totalPayments || 0)}</span>
            <p className="text-xs text-gray-400 mt-0.5">{metrics?.totalPaymentCount || 0} payments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total Outstanding</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <span className="text-xl sm:text-2xl font-bold text-orange-600">{formatCurrency(metrics?.totalOutstanding || 0)}</span>
            <p className="text-xs text-gray-400 mt-0.5">across {metrics?.totalCases || 0} cases</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs text-gray-500 font-medium uppercase tracking-wide">Cases with Payments</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <span className="text-xl sm:text-2xl font-bold text-purple-600">{metrics?.casesWithPayments || 0}</span>
            <p className="text-xs text-gray-400 mt-0.5">of {metrics?.totalCases || 0} total cases</p>
          </CardContent>
        </Card>
      </div>

      {/* Key Metrics — row 2 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <Card>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs text-gray-500 font-medium uppercase tracking-wide">Avg Payment</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <span className="text-xl sm:text-2xl font-bold text-gray-800">{formatCurrency(metrics?.avgPaymentAmount || 0)}</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs text-gray-500 font-medium uppercase tracking-wide">Largest Payment</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <span className="text-xl sm:text-2xl font-bold text-gray-800">{formatCurrency(metrics?.largestPayment || 0)}</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs text-gray-500 font-medium uppercase tracking-wide">Most Recent Payment</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <span className="text-lg sm:text-xl font-bold text-gray-800">
              {metrics?.mostRecentPayment ? formatDate(metrics.mostRecentPayment) : '—'}
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs text-gray-500 font-medium uppercase tracking-wide">Original Debt</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <span className="text-xl sm:text-2xl font-bold text-gray-800">{formatCurrency(metrics?.totalOriginalDebt || 0)}</span>
          </CardContent>
        </Card>
      </div>

      {/* Recent Trends */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
        {[
          { label: 'Last 30 Days', total: metrics?.last30DaysTotal || 0, count: metrics?.last30DaysCount || 0, colour: 'text-green-600' },
          { label: 'Last 60 Days', total: metrics?.last60DaysTotal || 0, count: metrics?.last60DaysCount || 0, colour: 'text-blue-600' },
          { label: 'Last 90 Days', total: metrics?.last90DaysTotal || 0, count: metrics?.last90DaysCount || 0, colour: 'text-purple-600' },
        ].map(({ label, total, count, colour }) => (
          <Card key={label}>
            <CardHeader className="pb-1 pt-4 px-4">
              <CardTitle className="flex items-center gap-1.5 text-xs text-gray-500 font-medium uppercase tracking-wide">
                <Clock className="h-3.5 w-3.5" />{label}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0 space-y-1">
              <p className={`text-xl sm:text-2xl font-bold ${colour}`}>{formatCurrency(total)}</p>
              <p className="text-xs text-gray-400">{count} payment{count !== 1 ? 's' : ''}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Payment Method Breakdown */}
      <Card className="mb-4 sm:mb-6">
        <CardHeader className="pb-2 sm:pb-4">
          <CardTitle className="text-base sm:text-lg">Payment Method Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-medium text-gray-600">Method</th>
                  <th className="text-right p-2 font-medium text-gray-600">Total</th>
                  <th className="text-center p-2 font-medium text-gray-600">Count</th>
                  <th className="text-right p-2 font-medium text-gray-600">Avg per Payment</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(metrics?.methodBreakdown || {})
                  .sort(([, a]: any, [, b]: any) => b.total - a.total)
                  .map(([method, data]: [string, any]) => (
                    <tr key={method} className="border-b last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="p-2 font-medium">{method}</td>
                      <td className="p-2 text-right font-bold text-acclaim-teal">{formatCurrency(data.total)}</td>
                      <td className="p-2 text-center text-gray-600">{data.count}</td>
                      <td className="p-2 text-right text-gray-600">{formatCurrency(data.total / data.count)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Trends */}
      <Card>
        <CardHeader className="pb-2 sm:pb-4">
          <CardTitle className="text-base sm:text-lg">Monthly Payment Trends</CardTitle>
        </CardHeader>
        <CardContent className="p-2 sm:p-6">
          <div className="overflow-x-auto -mx-2 sm:mx-0">
            <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-medium text-gray-600">Month</th>
                  <th className="text-right p-2 font-medium text-gray-600 whitespace-nowrap">Total</th>
                  <th className="text-center p-2 font-medium text-gray-600">Count</th>
                  <th className="text-right p-2 font-medium text-gray-600 whitespace-nowrap">Average</th>
                </tr>
              </thead>
              <tbody>
                {(metrics?.monthlyTrends || []).map((row: any) => (
                  <tr key={row.label} className="border-b last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="p-2 font-medium whitespace-nowrap">{row.label}</td>
                    <td className="p-2 text-right font-bold text-green-600 whitespace-nowrap">{formatCurrency(row.total)}</td>
                    <td className="p-2 text-center text-gray-600">{row.count}</td>
                    <td className="p-2 text-right text-gray-600 whitespace-nowrap">{formatCurrency(row.total / row.count)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}