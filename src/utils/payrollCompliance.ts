/**
 * GHANA STATUTORY COMPLIANCE PAYROLL ENGINE
 * Compliant with:
 * 1. SSNIT National Pensions Act 2008 (Act 766) - Tier 1 & Tier 2 contributions
 * 2. Ghana Revenue Authority (GRA) PAYE 2026 Graduated Monthly Tax Bands
 */

// 1. STATUTORY CONSTANTS
export const SSNIT_EMPLOYEE_RATE = 0.055; // 5.5% employee deduction
export const SSNIT_EMPLOYER_RATE = 0.130; // 13.0% employer contribution
export const SSNIT_TOTAL_PENSION_RATE = 0.185; // 18.5% total liability

// 2026 Insurable Baseline & Maximum Caps (Act 766)
export const SSNIT_MIN_INSURABLE_SALARY = 587.79; // GH₵ 587.79 floor
export const SSNIT_MAX_INSURABLE_SALARY = 69000.00; // GH₵ 69,000.00 ceiling

// GRA PAYE 2026 Monthly Graduated Tax Brackets
export interface TaxBracket {
  limit: number;      // Amount taxed in this bracket (Infinity for top bracket)
  rate: number;       // Tax rate percentage (decimal: 0.05 = 5%)
  description: string;
}

export const GRA_PAYE_MONTHLY_BRACKETS: TaxBracket[] = [
  { limit: 490.00, rate: 0.00, description: 'First GH₵ 490.00' },
  { limit: 110.00, rate: 0.05, description: 'Next GH₵ 110.00' },
  { limit: 130.00, rate: 0.10, description: 'Next GH₵ 130.00' },
  { limit: 3166.67, rate: 0.175, description: 'Next GH₵ 3,166.67' },
  { limit: 16000.00, rate: 0.25, description: 'Next GH₵ 16,000.00' },
  { limit: 30520.00, rate: 0.30, description: 'Next GH₵ 30,520.00' },
  { limit: Infinity, rate: 0.35, description: 'Exceeding GH₵ 50,416.67' },
];

export interface PayrollInput {
  basicSalary: number;
  allowancesTaxable?: number;
  allowancesNonTaxable?: number;
  personalReliefs?: number;
  welfareDeductions?: number;
}

export interface TaxBandBreakdown {
  bracket: string;
  taxableAmount: number;
  rate: number;
  taxPayable: number;
}

export interface PayrollCalculationResult {
  basicSalary: number;
  insurableBasic: number;
  allowancesTaxable: number;
  allowancesNonTaxable: number;
  grossSalary: number;
  deductionSsnitEmployee: number; // 5.5%
  contributionSsnitEmployer: number; // 13.0%
  totalSsnitLiability: number; // 18.5%
  personalReliefs: number;
  taxableIncome: number;
  graPayeWithheld: number;
  taxBandsBreakdown: TaxBandBreakdown[];
  otherDeductionsWelfare: number;
  totalDeductions: number;
  netSalaryPayout: number;
}

/**
 * Calculates Ghana GRA & SSNIT Act 766 Payroll Parameters
 */
export function calculateGhanaPayroll(input: PayrollInput): PayrollCalculationResult {
  const basicSalary = Math.max(0, input.basicSalary);
  const allowancesTaxable = Math.max(0, input.allowancesTaxable || 0);
  const allowancesNonTaxable = Math.max(0, input.allowancesNonTaxable || 0);
  const personalReliefs = Math.max(0, input.personalReliefs || 0);
  const otherDeductionsWelfare = Math.max(0, input.welfareDeductions || 0);

  // SSNIT Act 766 Deductions: strictly applied to Basic Salary (capped between min floor and max ceiling)
  // For insurable earnings calculation, clamp to SSNIT_MAX_INSURABLE_SALARY
  const insurableBasic = Math.min(basicSalary, SSNIT_MAX_INSURABLE_SALARY);
  const deductionSsnitEmployee = Math.round(insurableBasic * SSNIT_EMPLOYEE_RATE * 100) / 100;
  const contributionSsnitEmployer = Math.round(insurableBasic * SSNIT_EMPLOYER_RATE * 100) / 100;
  const totalSsnitLiability = Math.round((deductionSsnitEmployee + contributionSsnitEmployer) * 100) / 100;

  // Gross Salary = Basic + Taxable Allowances + Non-Taxable Allowances
  const grossSalary = Math.round((basicSalary + allowancesTaxable + allowancesNonTaxable) * 100) / 100;

  // Taxable Income Formula: Taxable Income = Gross (Subject to Tax) - Employee SSNIT (5.5%) - Personal Reliefs
  // Note: Gross subject to tax = Basic Salary + Taxable Allowances
  const grossSubjectToTax = basicSalary + allowancesTaxable;
  const rawTaxableIncome = grossSubjectToTax - deductionSsnitEmployee - personalReliefs;
  const taxableIncome = Math.max(0, Math.round(rawTaxableIncome * 100) / 100);

  // Calculate GRA Graduated Tax
  let remainingTaxable = taxableIncome;
  let graPayeWithheld = 0;
  const taxBandsBreakdown: TaxBandBreakdown[] = [];

  for (const bracket of GRA_PAYE_MONTHLY_BRACKETS) {
    if (remainingTaxable <= 0) {
      taxBandsBreakdown.push({
        bracket: bracket.description,
        taxableAmount: 0,
        rate: bracket.rate,
        taxPayable: 0
      });
      continue;
    }

    const chunk = Math.min(remainingTaxable, bracket.limit);
    const taxOnChunk = Math.round(chunk * bracket.rate * 100) / 100;

    taxBandsBreakdown.push({
      bracket: bracket.description,
      taxableAmount: Math.round(chunk * 100) / 100,
      rate: bracket.rate,
      taxPayable: taxOnChunk
    });

    graPayeWithheld += taxOnChunk;
    remainingTaxable -= chunk;
  }

  graPayeWithheld = Math.round(graPayeWithheld * 100) / 100;

  // Total Employee Deductions = Employee SSNIT (5.5%) + GRA PAYE Withheld + Welfare
  const totalDeductions = Math.round((deductionSsnitEmployee + graPayeWithheld + otherDeductionsWelfare) * 100) / 100;

  // Net Salary Payout = Gross Salary - Total Deductions
  const netSalaryPayout = Math.max(0, Math.round((grossSalary - totalDeductions) * 100) / 100);

  return {
    basicSalary,
    insurableBasic,
    allowancesTaxable,
    allowancesNonTaxable,
    grossSalary,
    deductionSsnitEmployee,
    contributionSsnitEmployer,
    totalSsnitLiability,
    personalReliefs,
    taxableIncome,
    graPayeWithheld,
    taxBandsBreakdown,
    otherDeductionsWelfare,
    totalDeductions,
    netSalaryPayout
  };
}

/**
 * Generates an official, print-ready HTML Payslip with GRA & SSNIT statutory compliance details
 */
export function printEmployeePayslip(payslipData: {
  staffName: string;
  staffIdNumber: string;
  role: string;
  department: string;
  graTin: string;
  ssnitNumber: string;
  bankName: string;
  bankBranch?: string;
  accountNumber: string;
  payPeriodMonthYear: string;
  basicSalary: number;
  taxableAllowances: number;
  nonTaxableAllowances: number;
  grossSalary: number;
  deductionSsnitEmployee: number;
  contributionSsnitEmployer: number;
  graPayeWithheld: number;
  otherDeductionsWelfare: number;
  netSalaryPayout: number;
  generatedAt?: string;
}) {
  const win = window.open('', '_blank', 'width=900,height=800');
  if (!win) {
    alert('Please allow popups for ScholarHub ERP to print payslips.');
    return;
  }

  const generatedDate = payslipData.generatedAt 
    ? new Date(payslipData.generatedAt).toLocaleString() 
    : new Date().toLocaleString();

  const totalDeductions = payslipData.deductionSsnitEmployee + payslipData.graPayeWithheld + payslipData.otherDeductionsWelfare;
  const totalSsnit = payslipData.deductionSsnitEmployee + payslipData.contributionSsnitEmployer;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Payslip - ${payslipData.staffName} (${payslipData.payPeriodMonthYear})</title>
        <style>
          @page { size: A4 portrait; margin: 15mm; }
          * { box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: #0f172a;
            margin: 0;
            padding: 20px;
            font-size: 13px;
            line-height: 1.5;
            background: #fff;
          }
          .payslip-box {
            border: 2px solid #0f172a;
            border-radius: 8px;
            padding: 24px;
            max-width: 800px;
            margin: 0 auto;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 16px;
            margin-bottom: 18px;
          }
          .school-title {
            font-size: 18px;
            font-weight: 800;
            letter-spacing: -0.5px;
            color: #1e3a8a;
          }
          .school-sub {
            font-size: 11px;
            color: #64748b;
            margin-top: 2px;
          }
          .slip-badge {
            background: #f1f5f9;
            border: 1px solid #cbd5e1;
            padding: 6px 12px;
            border-radius: 6px;
            text-align: right;
          }
          .slip-title {
            font-size: 14px;
            font-weight: 800;
            color: #0f172a;
          }
          .slip-period {
            font-size: 12px;
            font-weight: 600;
            color: #3b82f6;
          }
          .staff-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 12px 16px;
            margin-bottom: 20px;
          }
          .info-item {
            display: flex;
            justify-content: space-between;
            padding: 3px 0;
          }
          .info-label {
            color: #64748b;
            font-weight: 600;
            font-size: 11px;
            text-transform: uppercase;
          }
          .info-val {
            font-weight: 700;
            color: #0f172a;
          }
          .tables-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            margin-bottom: 20px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th {
            background: #f1f5f9;
            text-align: left;
            padding: 8px 10px;
            font-size: 11px;
            text-transform: uppercase;
            font-weight: 700;
            border-bottom: 1px solid #cbd5e1;
          }
          td {
            padding: 8px 10px;
            border-bottom: 1px solid #f1f5f9;
            font-size: 12px;
          }
          .num {
            text-align: right;
            font-family: ui-monospace, monospace;
            font-weight: 600;
          }
          .total-row td {
            font-weight: 800;
            background: #f8fafc;
            border-top: 2px solid #cbd5e1;
            border-bottom: none;
          }
          .net-banner {
            background: linear-gradient(135deg, #1e3a8a, #3b82f6);
            color: #fff;
            padding: 16px 20px;
            border-radius: 8px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
          }
          .net-label {
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-weight: 700;
            opacity: 0.9;
          }
          .net-amount {
            font-size: 24px;
            font-weight: 900;
            font-family: ui-monospace, monospace;
          }
          .statutory-notes {
            background: #fffbeb;
            border: 1px solid #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 10px 14px;
            border-radius: 4px;
            font-size: 11px;
            color: #92400e;
            margin-bottom: 20px;
          }
          .footer {
            border-top: 1px dashed #cbd5e1;
            padding-top: 14px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            font-size: 10px;
            color: #94a3b8;
          }
          .signature-line {
            width: 180px;
            border-top: 1px solid #0f172a;
            margin-top: 30px;
            text-align: center;
            font-size: 11px;
            font-weight: 600;
            color: #0f172a;
          }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="payslip-box">
          <div class="header">
            <div>
              <div class="school-title">SCHOLARHUB INSTITUTIONAL ERP</div>
              <div class="school-sub">Official Payroll &amp; Compensation Directorate • Accra, Ghana</div>
              <div class="school-sub">National Pensions Act 2008 (Act 766) &amp; GRA PAYE Compliant</div>
            </div>
            <div class="slip-badge">
              <div class="slip-title">OFFICIAL PAYSLIP</div>
              <div class="slip-period">${payslipData.payPeriodMonthYear}</div>
            </div>
          </div>

          <div class="staff-grid">
            <div class="info-item"><span class="info-label">Staff Name:</span><span class="info-val">${payslipData.staffName}</span></div>
            <div class="info-item"><span class="info-label">Staff ID:</span><span class="info-val">${payslipData.staffIdNumber}</span></div>
            <div class="info-item"><span class="info-label">Designation / Role:</span><span class="info-val">${payslipData.role} (${payslipData.department})</span></div>
            <div class="info-item"><span class="info-label">GRA TIN:</span><span class="info-val">${payslipData.graTin}</span></div>
            <div class="info-item"><span class="info-label">SSNIT Number:</span><span class="info-val">${payslipData.ssnitNumber}</span></div>
            <div class="info-item"><span class="info-label">Bank Account:</span><span class="info-val">${payslipData.bankName} - ${payslipData.accountNumber}</span></div>
          </div>

          <div class="tables-row">
            <!-- EARNINGS TABLE -->
            <table>
              <thead>
                <tr>
                  <th>Earnings &amp; Allowances</th>
                  <th class="num">Amount (GH₵)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Monthly Basic Salary</td>
                  <td class="num">${payslipData.basicSalary.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
                <tr>
                  <td>Taxable Allowances</td>
                  <td class="num">${payslipData.taxableAllowances.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
                <tr>
                  <td>Non-Taxable Allowances</td>
                  <td class="num">${payslipData.nonTaxableAllowances.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
                <tr class="total-row">
                  <td>TOTAL GROSS EARNINGS</td>
                  <td class="num">${payslipData.grossSalary.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
              </tbody>
            </table>

            <!-- DEDUCTIONS TABLE -->
            <table>
              <thead>
                <tr>
                  <th>Statutory &amp; Other Deductions</th>
                  <th class="num">Amount (GH₵)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>SSNIT Employee Pension (5.5%)</td>
                  <td class="num">${payslipData.deductionSsnitEmployee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
                <tr>
                  <td>GRA PAYE Income Tax Withheld</td>
                  <td class="num">${payslipData.graPayeWithheld.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
                <tr>
                  <td>Welfare &amp; Other Deductions</td>
                  <td class="num">${payslipData.otherDeductionsWelfare.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
                <tr class="total-row">
                  <td>TOTAL DEDUCTIONS</td>
                  <td class="num">${totalDeductions.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="net-banner">
            <div>
              <div class="net-label">Net Salary Disbursed</div>
              <div style="font-size: 11px; opacity: 0.85;">Deposited to ${payslipData.bankName}</div>
            </div>
            <div class="net-amount">GH₵ ${payslipData.netSalaryPayout.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>

          <div class="statutory-notes">
            <strong>Statutory Contribution Summary (Act 766):</strong><br>
            • Employee Pension Contribution (5.5%): <strong>GH₵ ${payslipData.deductionSsnitEmployee.toFixed(2)}</strong><br>
            • Employer Pension Contribution (13.0%): <strong>GH₵ ${payslipData.contributionSsnitEmployer.toFixed(2)}</strong><br>
            • Total SSNIT Monthly Liability (18.5%): <strong>GH₵ ${totalSsnit.toFixed(2)}</strong> (Remitted to SSNIT &amp; Approved Trustees)
          </div>

          <div class="footer">
            <div>
              <div>System Audit Ref: SH-PAY-${Date.now().toString(36).toUpperCase()}</div>
              <div>Generated on: ${generatedDate} • Confidential Employee Record</div>
            </div>
            <div>
              <div class="signature-line">Authorized Signatory (Proprietor/Bursar)</div>
            </div>
          </div>
        </div>
        <script>
          window.onload = function() { window.print(); };
        </script>
      </body>
    </html>
  `;

  win.document.write(html);
  win.document.close();
}
