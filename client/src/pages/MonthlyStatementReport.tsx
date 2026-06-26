import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OrganisationFilterCombobox } from "@/components/OrganisationFilterCombobox";
import { ArrowLeft, Download, FileText, TrendingUp, Calendar, PoundSterling, User, CreditCard, Building2, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Link } from "wouter";
import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function MonthlyStatementReport() {
  const { toast } = useToast();
  const { user } = useAuth();
  // Default to current month range
  const currentDate = new Date();
  const firstOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const [startDate, setStartDate] = useState<string>(firstOfMonth.toISOString().slice(0, 10)); // YYYY-MM-DD format
  const [endDate, setEndDate] = useState<string>(currentDate.toISOString().slice(0, 10)); // YYYY-MM-DD format
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

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
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
        description: "Failed to load statistics",
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

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(num);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getDateRangeLabel = () => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return `${start.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} - ${end.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  };

  // Filter cases and payments for selected date range
  const statementData = useMemo(() => {
    if (!filteredCases || !startDate || !endDate) return null;

    // Parse dates and create range
    const rangeStart = new Date(startDate);
    rangeStart.setHours(0, 0, 0, 0);
    const rangeEnd = new Date(endDate);
    rangeEnd.setHours(23, 59, 59, 999);

    const casesInRange = filteredCases.filter((case_: any) => {
      const caseDate = new Date(case_.createdAt);
      return caseDate >= rangeStart && caseDate <= rangeEnd;
    });

    const paymentsInRange = filteredCases.reduce((acc: any[], case_: any) => {
      if (case_.payments) {
        const rangePayments = case_.payments.filter((payment: any) => {
          const paymentDate = new Date(payment.paymentDate || payment.createdAt);
          return paymentDate >= rangeStart && paymentDate <= rangeEnd;
        });
        acc.push(...rangePayments.map((payment: any) => ({
          ...payment,
          accountNumber: case_.accountNumber,
          caseName: case_.caseName,
          organisationName: case_.organisationName
        })));
      }
      return acc;
    }, []);

    const totalPayments = paymentsInRange.reduce((sum: number, payment: any) => 
      sum + parseFloat(payment.amount), 0);

    return {
      casesInRange,
      paymentsInRange,
      totalPayments,
      paymentsCount: paymentsInRange.length,
      rangeStart,
      rangeEnd
    };
  }, [filteredCases, startDate, endDate]);

  const handleExportExcel = async () => {
    if (!statementData) return;

    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Acclaim';
      workbook.created = new Date();

      // ── Palette ──────────────────────────────────────────────────────────
      const TEAL_HDR  = 'FF0F766E';
      const TEAL_TOT  = 'FF134E4A';
      const WHITE     = 'FFFFFFFF';
      const ROW_ODD   = 'FFFFFFFF';
      const ROW_EVEN  = 'FFF0FDFA';
      const BORDER_CLR = 'FFD1D5DB';
      const GBP_FMT   = '"£"#,##0.00';

      const thinBorder = {
        top:    { style: 'thin' as const, color: { argb: BORDER_CLR } },
        left:   { style: 'thin' as const, color: { argb: BORDER_CLR } },
        bottom: { style: 'thin' as const, color: { argb: BORDER_CLR } },
        right:  { style: 'thin' as const, color: { argb: BORDER_CLR } },
      };

      // ── Summary sheet ────────────────────────────────────────────────────
      const summaryWs = workbook.addWorksheet('Summary');
      summaryWs.columns = [
        { key: 'label', width: 26 },
        { key: 'value', width: 22 },
      ];

      const summaryRows = [
        ['Monthly Statement Report', ''],
        ['Period', getDateRangeLabel()],
        ['Generated', new Date().toLocaleDateString('en-GB')],
        ['', ''],
        ['Total Payments Received', statementData.totalPayments],
        ['Number of Payments', statementData.paymentsCount],
      ];

      summaryRows.forEach(([label, value], i) => {
        const row = summaryWs.addRow([label, value]);
        if (i === 0) {
          row.getCell(1).font = { bold: true, size: 13, color: { argb: 'FF0F766E' }, name: 'Calibri' };
        } else if (i === 4) {
          row.getCell(1).font = { bold: true, size: 10, name: 'Calibri' };
          row.getCell(2).numFmt = GBP_FMT;
          row.getCell(2).font  = { bold: true, size: 10, color: { argb: 'FF15803D' }, name: 'Calibri' };
        } else {
          row.getCell(1).font = { size: 10, name: 'Calibri' };
          row.getCell(2).font = { size: 10, name: 'Calibri' };
        }
      });

      // ── Payments sheet ───────────────────────────────────────────────────
      const paymentsWs = workbook.addWorksheet('Payments', {
        views: [{ state: 'frozen', ySplit: 1 }],
      });

      paymentsWs.columns = [
        { header: 'Account Number', key: 'accountNumber', width: 20 },
        { header: 'Case Name',      key: 'caseName',      width: 30 },
        { header: 'Organisation',   key: 'organisation',  width: 24 },
        { header: 'Amount',         key: 'amount',        width: 16 },
        { header: 'Date',           key: 'date',          width: 14 },
        { header: 'Method',         key: 'method',        width: 18 },
      ];

      // Style header row
      const headerRow = paymentsWs.getRow(1);
      headerRow.height = 28;
      headerRow.eachCell({ includeEmpty: true }, (cell) => {
        cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: TEAL_HDR } };
        cell.font      = { bold: true, color: { argb: WHITE }, size: 10, name: 'Calibri' };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cell.border    = thinBorder;
      });

      // Data rows
      statementData.paymentsInRange.forEach((payment: any, rowIdx: number) => {
        const row = paymentsWs.addRow({
          accountNumber: payment.accountNumber,
          caseName:      payment.caseName,
          organisation:  payment.organisationName || '',
          amount:        parseFloat(payment.amount),
          date:          formatDate(payment.paymentDate || payment.createdAt),
          method:        payment.paymentMethod || 'Not specified',
        });

        row.height = 18;
        const rowBg = rowIdx % 2 === 0 ? ROW_ODD : ROW_EVEN;

        row.eachCell({ includeEmpty: true }, (cell) => {
          cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };
          cell.font      = { size: 10, name: 'Calibri', color: { argb: 'FF111827' } };
          cell.border    = thinBorder;
          cell.alignment = { vertical: 'middle' };
        });

        // GBP format + green for amount
        const amtCell = row.getCell(4);
        amtCell.numFmt = GBP_FMT;
        amtCell.font   = { size: 10, name: 'Calibri', bold: true, color: { argb: 'FF15803D' } };
      });

      // Totals row
      const totalRow = paymentsWs.addRow({
        accountNumber: '',
        caseName:      'TOTAL',
        organisation:  '',
        amount:        parseFloat(statementData.totalPayments),
        date:          '',
        method:        `${statementData.paymentsCount} payment${statementData.paymentsCount !== 1 ? 's' : ''}`,
      });
      totalRow.height = 22;
      totalRow.eachCell({ includeEmpty: true }, (cell) => {
        cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: TEAL_TOT } };
        cell.font      = { bold: true, color: { argb: WHITE }, size: 10, name: 'Calibri' };
        cell.border    = thinBorder;
        cell.alignment = { vertical: 'middle' };
      });
      totalRow.getCell(4).numFmt = GBP_FMT;

      // Write file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob   = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url    = URL.createObjectURL(blob);
      const a      = document.createElement('a');
      a.href       = url;
      a.download   = `statement-${startDate}-to-${endDate}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: `Monthly statement exported successfully.`,
      });
    } catch (error) {
      console.error('Excel export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export the statement.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadPDF = () => {
    if (!statementData) return;

    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Could not open print window');
      }

      const currentDate = new Date().toLocaleDateString('en-GB');
      
      // Generate payments table rows
      const paymentsTableRows = statementData.paymentsInRange.map((payment: any) => `
        <tr>
          <td>${payment.accountNumber}</td>
          <td>${payment.caseName}${payment.organisationName ? ` <span style="font-size: 10px; color: #666;">(${payment.organisationName})</span>` : ''}</td>
          <td class="currency">${formatCurrency(payment.amount)}</td>
          <td>${formatDate(payment.paymentDate || payment.createdAt)}</td>
          <td>${payment.paymentMethod || 'Not specified'}</td>
        </tr>
      `).join('');
      
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Monthly Statement Report</title>
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
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { padding: 8px; text-align: left; border: 1px solid #ddd; font-size: 12px; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .currency { text-align: right; }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Statement Report</h1>
            <p>Period: ${getDateRangeLabel()}</p>
            <p>Generated on: ${currentDate}</p>
          </div>
          
          <div class="section">
            <h2>Summary</h2>
            <div class="metrics-grid">
              <div class="metric-card">
                <div class="metric-label">Total Payments</div>
                <div class="metric-value">${formatCurrency(statementData.totalPayments)}</div>
              </div>
              <div class="metric-card">
                <div class="metric-label">Number of Payments</div>
                <div class="metric-value">${statementData.paymentsCount}</div>
              </div>
            </div>
          </div>
          
          <div class="section">
            <h2>Payments Received in Period</h2>
            ${statementData.paymentsInRange.length > 0 ? `
              <table>
                <thead>
                  <tr>
                    <th>Account Number</th>
                    <th>Case Name</th>
                    <th>Amount</th>
                    <th>Date</th>
                    <th>Method</th>
                  </tr>
                </thead>
                <tbody>
                  ${paymentsTableRows}
                </tbody>
              </table>
            ` : `
              <p>No payments received in this period</p>
            `}
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
        description: `Statement report for ${getDateRangeLabel()} opened in new tab for viewing`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate PDF report",
        variant: "destructive",
      });
    }
  };

  if (casesLoading || statsLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-acclaim-teal mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading monthly statement...</p>
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
            <h1 className="text-xl sm:text-3xl font-bold text-gray-900">Monthly Statement Report</h1>
            <p className="text-sm text-gray-600">Generated on {new Date().toLocaleDateString('en-GB')}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportExcel} variant="outline" size="sm" className="flex-1 sm:flex-none bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-700">
            <Download className="h-4 w-4 mr-1 sm:mr-2" />
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

      {/* Filters */}
      <Card className="mb-4 sm:mb-6">
        <CardHeader className="pb-2 sm:pb-4">
          <CardTitle className="flex items-center text-base sm:text-lg">
            <Filter className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center">
            {showOrgFilter && (
              <div className="flex items-center gap-2 flex-1 sm:max-w-xs">
                <Building2 className="h-4 w-4 text-gray-500" />
                <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Organisation:</label>
                <OrganisationFilterCombobox
                  organisations={organisations}
                  value={orgFilter}
                  onValueChange={setOrgFilter}
                  className="w-full"
                />
              </div>
            )}
            <div className="flex items-center gap-2 flex-1 sm:max-w-xs">
              <Calendar className="h-4 w-4 text-gray-500" />
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">From:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <div className="flex items-center gap-2 flex-1 sm:max-w-xs">
              <Calendar className="h-4 w-4 text-gray-500" />
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">To:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <div className="text-xs sm:text-sm text-gray-600">
              Showing data for {getDateRangeLabel()}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card className="mb-4 sm:mb-6">
        <CardHeader className="pb-2 sm:pb-4">
          <CardTitle className="flex items-center text-base sm:text-lg">
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            Summary - {getDateRangeLabel()}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:gap-6">
            <div className="bg-purple-50 p-3 sm:p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Total Payments</p>
                  <p className="text-lg sm:text-2xl font-bold text-purple-600">
                    {formatCurrency(statementData?.totalPayments || 0)}
                  </p>
                </div>
                <PoundSterling className="h-5 w-5 sm:h-8 sm:w-8 text-purple-600 hidden sm:block" />
              </div>
            </div>
            
            <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Number of Payments</p>
                  <p className="text-lg sm:text-2xl font-bold text-blue-600">
                    {statementData?.paymentsCount || 0}
                  </p>
                </div>
                <CreditCard className="h-5 w-5 sm:h-8 sm:w-8 text-blue-600 hidden sm:block" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payments in Period */}
      <Card>
        <CardHeader className="pb-2 sm:pb-4">
          <CardTitle className="text-base sm:text-lg">Payments Received - {getDateRangeLabel()}</CardTitle>
        </CardHeader>
        <CardContent className="p-2 sm:p-6">
          {statementData?.paymentsInRange.length > 0 ? (
            <div className="overflow-x-auto -mx-2 sm:mx-0">
              <table className="w-full border-collapse border border-gray-200 text-xs sm:text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 px-2 sm:px-4 py-2 text-left font-medium whitespace-nowrap">Account</th>
                    <th className="border border-gray-200 px-2 sm:px-4 py-2 text-left font-medium">Case Name</th>
                    <th className="border border-gray-200 px-2 sm:px-4 py-2 text-left font-medium whitespace-nowrap">Amount</th>
                    <th className="border border-gray-200 px-2 sm:px-4 py-2 text-left font-medium">Date</th>
                    <th className="border border-gray-200 px-2 sm:px-4 py-2 text-left font-medium">Method</th>
                  </tr>
                </thead>
                <tbody>
                  {statementData.paymentsInRange.map((payment: any, index: number) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="border border-gray-200 px-2 sm:px-4 py-2 font-medium whitespace-nowrap">
                        {payment.accountNumber}
                      </td>
                      <td className="border border-gray-200 px-2 sm:px-4 py-2">
                        <div>
                          {payment.caseName}
                          {payment.organisationName && (
                            <div className="text-xs text-gray-500">({payment.organisationName})</div>
                          )}
                        </div>
                      </td>
                      <td className="border border-gray-200 px-2 sm:px-4 py-2 font-medium text-green-600 whitespace-nowrap">
                        {formatCurrency(payment.amount)}
                      </td>
                      <td className="border border-gray-200 px-2 sm:px-4 py-2 whitespace-nowrap">
                        {formatDate(payment.paymentDate || payment.createdAt)}
                      </td>
                      <td className="border border-gray-200 px-2 sm:px-4 py-2 text-sm text-gray-700">
                        {payment.paymentMethod || 'Not specified'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-green-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-green-800 text-sm sm:text-base">Total Payments:</span>
                  <span className="text-lg sm:text-xl font-bold text-green-600">
                    {formatCurrency(statementData.totalPayments)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 sm:py-8 text-gray-500 text-sm">
              No payments received in this period
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}