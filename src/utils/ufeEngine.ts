// src/utils/ufeEngine.ts

import type {
  COAItem,
  JournalEntry,
  JournalLine,
  UFEInvoice,
  UFEPayment,
  UFEExpense,
  UFESupplierBill,
  FiscalPeriod,
  AuditLog
} from '../data/ufeMockData';
import {
  dbGetCOA,
  dbSaveCOA,
  dbGetJournalEntries,
  dbSaveJournalEntry,
  dbGetInvoices,
  dbSaveInvoice,
  dbSavePayment,
  dbSaveExpense,
  dbGetSupplierBills,
  dbSaveSupplierBill,
  dbGetFiscalPeriods,
  dbSaveFiscalPeriod,
  dbSaveAuditLog
} from '../dbAdapter';

/**
 * Normal Balance helper:
 * Assets & Expenses increase with DEBIT.
 * Liabilities, Equity & Revenue increase with CREDIT.
 */
export const getNormalBalanceType = (accountType: COAItem['type']): 'debit' | 'credit' => {
  if (accountType === 'Asset' || accountType === 'Expense') return 'debit';
  return 'credit';
};

/**
 * Validates whether a fiscal period is open for posting.
 */
export const isPeriodOpen = (periodId: string, tenantId: string): boolean => {
  const periods = dbGetFiscalPeriods(tenantId);
  const targetPeriod = periods.find(p => p.periodId === periodId);
  if (!targetPeriod) return true; // Default open if unconfigured
  return targetPeriod.status === 'Open';
};

/**
 * Log audit trail helper
 */
export const logUFEAudit = (
  tenantId: string,
  user: string,
  action: string,
  entityType: string,
  entityId: string,
  details: string
): void => {
  const log: AuditLog = {
    logId: `audit_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    tenantId,
    timestamp: new Date().toISOString(),
    user,
    action,
    entityType,
    entityId,
    details
  };
  dbSaveAuditLog(log);
};

// ---------------------------------------------------------------------------
// 1. CORE ENGINE: POST JOURNAL ENTRY (Layer 2)
// ---------------------------------------------------------------------------

export interface PostJournalEntryInput {
  tenantId: string;
  date: string;
  reference: string;
  description: string;
  sourceModule: JournalEntry['sourceModule'];
  sourceId?: string;
  lines: JournalLine[];
  createdBy: string;
  periodId?: string;
}

export const postJournalEntry = (input: PostJournalEntryInput): JournalEntry => {
  const periodId = input.periodId || input.date.substring(0, 7); // e.g. "2026-09"

  // 1. Verify period is open
  if (!isPeriodOpen(periodId, input.tenantId)) {
    throw new Error(`Cannot post journal entry. Fiscal period '${periodId}' is CLOSED or LOCKED.`);
  }

  // 2. Validate double-entry invariant (Debits === Credits)
  const totalDebit = Number(input.lines.reduce((sum, line) => sum + (line.type === 'debit' ? Number(line.amount) : 0), 0).toFixed(2));
  const totalCredit = Number(input.lines.reduce((sum, line) => sum + (line.type === 'credit' ? Number(line.amount) : 0), 0).toFixed(2));

  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    throw new Error(`Double-Entry Violation: Total Debits (GH₵ ${totalDebit.toFixed(2)}) must equal Total Credits (GH₵ ${totalCredit.toFixed(2)}). Entry rejected.`);
  }

  if (totalDebit <= 0) {
    throw new Error(`Journal entry amount must be greater than 0.`);
  }

  // 3. Create entry document
  const entryId = `je_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const journalEntry: JournalEntry = {
    entryId,
    tenantId: input.tenantId,
    date: input.date,
    reference: input.reference,
    description: input.description,
    sourceModule: input.sourceModule,
    sourceId: input.sourceId,
    lines: input.lines.map(l => ({
      ...l,
      amount: Number(l.amount.toFixed(2))
    })),
    totalDebit,
    totalCredit,
    createdBy: input.createdBy,
    createdAt: new Date().toISOString(),
    isReversed: false,
    reversalEntryId: null,
    periodId
  };

  // 4. Update COA account current balances
  const coa = dbGetCOA(input.tenantId);
  const updatedCOA = coa.map(acc => {
    const matchingLines = input.lines.filter(l => l.accountId === acc.accountId);
    if (matchingLines.length === 0) return acc;

    let balanceDelta = 0;
    const normal = getNormalBalanceType(acc.type);

    matchingLines.forEach(line => {
      if (normal === 'debit') {
        balanceDelta += line.type === 'debit' ? line.amount : -line.amount;
      } else {
        balanceDelta += line.type === 'credit' ? line.amount : -line.amount;
      }
    });

    return {
      ...acc,
      currentBalance: Number((acc.currentBalance + balanceDelta).toFixed(2))
    };
  });

  dbSaveCOA(input.tenantId, updatedCOA);
  dbSaveJournalEntry(journalEntry);

  logUFEAudit(
    input.tenantId,
    input.createdBy,
    'POST_JOURNAL_ENTRY',
    'JournalEntry',
    entryId,
    `Posted Journal Voucher [${journalEntry.reference}] for GH₵ ${totalDebit.toFixed(2)} (${input.description})`
  );

  return journalEntry;
};

// ---------------------------------------------------------------------------
// 2. TRANSACTION MODULE: GENERATE INVOICE (Layer 3 - AR)
// ---------------------------------------------------------------------------

export interface CreateInvoiceInput {
  tenantId: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  issueDate: string;
  dueDate: string;
  lineItems: {
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate?: number; // e.g. 20 for VAT+NHIL+GETFund
    accountId: string; // Revenue COA account e.g. "4100"
  }[];
  createdBy: string;
}

export const generateInvoice = (input: CreateInvoiceInput): UFEInvoice => {
  let subtotal = 0;
  let taxTotal = 0;

  const processedLines = input.lineItems.map(item => {
    const lineSubtotal = item.quantity * item.unitPrice;
    const rate = item.taxRate || 0;
    const tax = lineSubtotal * (rate / 100);
    const total = lineSubtotal + tax;

    subtotal += lineSubtotal;
    taxTotal += tax;

    return {
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      taxRate: rate,
      taxAmount: Number(tax.toFixed(2)),
      total: Number(total.toFixed(2)),
      accountId: item.accountId
    };
  });

  subtotal = Number(subtotal.toFixed(2));
  taxTotal = Number(taxTotal.toFixed(2));
  const grandTotal = Number((subtotal + taxTotal).toFixed(2));

  const count = dbGetInvoices(input.tenantId).length + 1;
  const invoiceNumber = `INV-${new Date().getFullYear()}-${String(count).padStart(4, '0')}`;
  const invoiceId = `inv_${Date.now()}`;

  // Build Double Entry lines:
  // Debit: Accounts Receivable (1200) -> grandTotal
  // Credit: Revenue Account(s) -> subtotal per revenue account
  // Credit: VAT Payable (2200) -> tax total (if applicable)

  const journalLines: JournalLine[] = [
    { accountId: '1200', accountName: 'Accounts Receivable', type: 'debit', amount: grandTotal }
  ];

  // Group line items by revenue account
  const revenueMap: Record<string, number> = {};
  processedLines.forEach(l => {
    const revAccount = l.accountId || '4100';
    revenueMap[revAccount] = (revenueMap[revAccount] || 0) + (l.quantity * l.unitPrice);
  });

  const coa = dbGetCOA(input.tenantId);
  Object.entries(revenueMap).forEach(([accId, amt]) => {
    const acc = coa.find(a => a.accountId === accId);
    journalLines.push({
      accountId: accId,
      accountName: acc ? acc.name : 'Sales Revenue',
      type: 'credit',
      amount: Number(amt.toFixed(2))
    });
  });

  if (taxTotal > 0) {
    journalLines.push({
      accountId: '2200',
      accountName: 'GRA VAT & Commercial Tax Payable',
      type: 'credit',
      amount: taxTotal
    });
  }

  // Post Journal Entry
  const je = postJournalEntry({
    tenantId: input.tenantId,
    date: input.issueDate,
    reference: invoiceNumber,
    description: `Invoice ${invoiceNumber} issued to ${input.customerName}`,
    sourceModule: 'fee_collection',
    sourceId: invoiceId,
    lines: journalLines,
    createdBy: input.createdBy
  });

  const invoice: UFEInvoice = {
    invoiceId,
    tenantId: input.tenantId,
    invoiceNumber,
    customerId: input.customerId,
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    issueDate: input.issueDate,
    dueDate: input.dueDate,
    lineItems: processedLines,
    subtotal,
    taxTotal,
    discountTotal: 0,
    grandTotal,
    amountPaid: 0,
    balanceDue: grandTotal,
    status: 'Sent',
    journalEntryId: je.entryId,
    createdBy: input.createdBy,
    createdAt: new Date().toISOString()
  };

  dbSaveInvoice(invoice);
  return invoice;
};

// ---------------------------------------------------------------------------
// 3. TRANSACTION MODULE: RECORD PAYMENT (Layer 3 - AR Payment)
// ---------------------------------------------------------------------------

export interface RecordPaymentInput {
  tenantId: string;
  invoiceId: string;
  amount: number;
  paymentMethod: UFEPayment['paymentMethod'];
  paymentAccountId: string; // e.g. "1100" (Cash), "1110" (Bank), "1120" (MoMo)
  reference: string;
  date: string;
  recordedBy: string;
}

export const recordPayment = (input: RecordPaymentInput): UFEPayment => {
  const invoices = dbGetInvoices(input.tenantId);
  const invoice = invoices.find(i => i.invoiceId === input.invoiceId);

  if (!invoice) throw new Error(`Invoice '${input.invoiceId}' not found.`);

  const paymentAmt = Number(input.amount.toFixed(2));
  if (paymentAmt <= 0) throw new Error(`Payment amount must be greater than 0.`);
  if (paymentAmt > invoice.balanceDue + 0.01) {
    throw new Error(`Payment amount (GH₵ ${paymentAmt.toFixed(2)}) exceeds balance due (GH₵ ${invoice.balanceDue.toFixed(2)}).`);
  }

  const paymentId = `pay_${Date.now()}`;
  const coa = dbGetCOA(input.tenantId);
  const payAccount = coa.find(a => a.accountId === input.paymentAccountId) || { name: 'Cash/Bank Account' };

  // Double Entry lines:
  // Debit: Cash/Bank/MoMo Account (1100 / 1110 / 1120)
  // Credit: Accounts Receivable (1200)
  const je = postJournalEntry({
    tenantId: input.tenantId,
    date: input.date,
    reference: `PAY-${input.reference || paymentId}`,
    description: `Payment for Invoice ${invoice.invoiceNumber} from ${invoice.customerName} via ${input.paymentMethod}`,
    sourceModule: 'fee_collection',
    sourceId: paymentId,
    lines: [
      { accountId: input.paymentAccountId, accountName: payAccount.name, type: 'debit', amount: paymentAmt },
      { accountId: '1200', accountName: 'Accounts Receivable', type: 'credit', amount: paymentAmt }
    ],
    createdBy: input.recordedBy
  });

  const payment: UFEPayment = {
    paymentId,
    tenantId: input.tenantId,
    invoiceId: invoice.invoiceId,
    customerId: invoice.customerId,
    customerName: invoice.customerName,
    amount: paymentAmt,
    paymentMethod: input.paymentMethod,
    paymentAccountId: input.paymentAccountId,
    reference: input.reference,
    date: input.date,
    journalEntryId: je.entryId,
    recordedBy: input.recordedBy,
    createdAt: new Date().toISOString()
  };

  dbSavePayment(payment);

  // Update invoice status
  const updatedAmountPaid = Number((invoice.amountPaid + paymentAmt).toFixed(2));
  const updatedBalanceDue = Number((invoice.grandTotal - updatedAmountPaid).toFixed(2));
  const updatedStatus: UFEInvoice['status'] = updatedBalanceDue <= 0.01 ? 'Paid' : 'Partially Paid';

  dbSaveInvoice({
    ...invoice,
    amountPaid: updatedAmountPaid,
    balanceDue: Math.max(0, updatedBalanceDue),
    status: updatedStatus
  });

  return payment;
};

// ---------------------------------------------------------------------------
// 4. TRANSACTION MODULE: RECORD EXPENSE (Layer 3 - Expenses)
// ---------------------------------------------------------------------------

export interface RecordExpenseInput {
  tenantId: string;
  category: string;
  description: string;
  amount: number;
  expenseAccountId: string; // e.g. "5400" (Utilities), "5500" (Fuel)
  paymentAccountId: string; // e.g. "1100" (Cash), "1110" (Bank)
  supplierName?: string;
  receiptUrl?: string;
  date: string;
  createdBy: string;
}

export const recordExpense = (input: RecordExpenseInput): UFEExpense => {
  const expenseAmt = Number(input.amount.toFixed(2));
  if (expenseAmt <= 0) throw new Error(`Expense amount must be greater than 0.`);

  const coa = dbGetCOA(input.tenantId);
  const expAccount = coa.find(a => a.accountId === input.expenseAccountId) || { name: 'Operating Expense' };
  const payAccount = coa.find(a => a.accountId === input.paymentAccountId) || { name: 'Cash/Bank Account' };

  const expenseId = `exp_${Date.now()}`;

  // Double Entry lines:
  // Debit: Expense Account (5000s)
  // Credit: Cash/Bank Account (1100s)
  const je = postJournalEntry({
    tenantId: input.tenantId,
    date: input.date,
    reference: `EXP-${expenseId.substring(4, 10)}`,
    description: `Expense: ${input.description}`,
    sourceModule: 'expense',
    sourceId: expenseId,
    lines: [
      { accountId: input.expenseAccountId, accountName: expAccount.name, type: 'debit', amount: expenseAmt },
      { accountId: input.paymentAccountId, accountName: payAccount.name, type: 'credit', amount: expenseAmt }
    ],
    createdBy: input.createdBy
  });

  const expense: UFEExpense = {
    expenseId,
    tenantId: input.tenantId,
    category: input.category,
    description: input.description,
    amount: expenseAmt,
    taxAmount: 0,
    paymentAccountId: input.paymentAccountId,
    expenseAccountId: input.expenseAccountId,
    supplierName: input.supplierName,
    receiptUrl: input.receiptUrl,
    date: input.date,
    status: 'Paid',
    journalEntryId: je.entryId,
    createdBy: input.createdBy,
    createdAt: new Date().toISOString()
  };

  dbSaveExpense(expense);
  return expense;
};

// ---------------------------------------------------------------------------
// 5. TRANSACTION MODULE: SUPPLIER BILLS (Layer 3 - AP)
// ---------------------------------------------------------------------------

export interface RecordSupplierBillInput {
  tenantId: string;
  supplierId: string;
  supplierName: string;
  billNumber: string;
  issueDate: string;
  dueDate: string;
  lineItems: {
    description: string;
    quantity: number;
    unitPrice: number;
    accountId: string; // Inventory (1300) or Expense (5600)
  }[];
  createdBy: string;
}

export const recordSupplierBill = (input: RecordSupplierBillInput): UFESupplierBill => {
  let grandTotal = 0;
  const processedLines = input.lineItems.map(item => {
    const total = item.quantity * item.unitPrice;
    grandTotal += total;
    return {
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: Number(total.toFixed(2)),
      accountId: item.accountId
    };
  });

  grandTotal = Number(grandTotal.toFixed(2));
  const billId = `bill_${Date.now()}`;

  // Double Entry:
  // Debit: Inventory / Expense Account(s)
  // Credit: Accounts Payable (2100)
  const coa = dbGetCOA(input.tenantId);
  const journalLines: JournalLine[] = [];

  processedLines.forEach(l => {
    const acc = coa.find(a => a.accountId === l.accountId) || { name: 'Inventory/Expense' };
    journalLines.push({
      accountId: l.accountId,
      accountName: acc.name,
      type: 'debit',
      amount: l.total
    });
  });

  journalLines.push({
    accountId: '2100',
    accountName: 'Accounts Payable',
    type: 'credit',
    amount: grandTotal
  });

  const je = postJournalEntry({
    tenantId: input.tenantId,
    date: input.issueDate,
    reference: input.billNumber,
    description: `Supplier Bill ${input.billNumber} from ${input.supplierName}`,
    sourceModule: 'purchase',
    sourceId: billId,
    lines: journalLines,
    createdBy: input.createdBy
  });

  const bill: UFESupplierBill = {
    billId,
    tenantId: input.tenantId,
    supplierId: input.supplierId,
    supplierName: input.supplierName,
    billNumber: input.billNumber,
    issueDate: input.issueDate,
    dueDate: input.dueDate,
    lineItems: processedLines,
    grandTotal,
    amountPaid: 0,
    balanceDue: grandTotal,
    status: 'Unpaid',
    journalEntryId: je.entryId,
    createdBy: input.createdBy,
    createdAt: new Date().toISOString()
  };

  dbSaveSupplierBill(bill);
  return bill;
};

export const paySupplierBill = (
  tenantId: string,
  billId: string,
  amount: number,
  paymentAccountId: string,
  user: string
): UFESupplierBill => {
  const bills = dbGetSupplierBills(tenantId);
  const bill = bills.find(b => b.billId === billId);
  if (!bill) throw new Error(`Supplier bill '${billId}' not found.`);

  const payAmt = Number(amount.toFixed(2));
  if (payAmt > bill.balanceDue + 0.01) throw new Error(`Payment exceeds bill balance due.`);

  const coa = dbGetCOA(tenantId);
  const payAccount = coa.find(a => a.accountId === paymentAccountId) || { name: 'Cash/Bank' };

  // Double Entry:
  // Debit: Accounts Payable (2100)
  // Credit: Cash/Bank Account
  postJournalEntry({
    tenantId,
    date: new Date().toISOString().split('T')[0],
    reference: `PAYBILL-${bill.billNumber}`,
    description: `Supplier Payment to ${bill.supplierName} for Bill ${bill.billNumber}`,
    sourceModule: 'purchase',
    sourceId: bill.billId,
    lines: [
      { accountId: '2100', accountName: 'Accounts Payable', type: 'debit', amount: payAmt },
      { accountId: paymentAccountId, accountName: payAccount.name, type: 'credit', amount: payAmt }
    ],
    createdBy: user
  });

  const updatedPaid = Number((bill.amountPaid + payAmt).toFixed(2));
  const updatedBal = Number((bill.grandTotal - updatedPaid).toFixed(2));
  const updatedStatus: UFESupplierBill['status'] = updatedBal <= 0.01 ? 'Paid' : 'Partially Paid';

  const updatedBill: UFESupplierBill = {
    ...bill,
    amountPaid: updatedPaid,
    balanceDue: Math.max(0, updatedBal),
    status: updatedStatus
  };

  dbSaveSupplierBill(updatedBill);
  return updatedBill;
};

// ---------------------------------------------------------------------------
// 6. PERIOD MANAGEMENT: CLOSE PERIOD (Layer 4)
// ---------------------------------------------------------------------------

export const closePeriod = (tenantId: string, periodId: string, closedBy: string): FiscalPeriod => {
  const periods = dbGetFiscalPeriods(tenantId);
  const period = periods.find(p => p.periodId === periodId);

  if (!period) throw new Error(`Fiscal period '${periodId}' not found.`);
  if (period.status === 'Closed' || period.status === 'Locked') {
    throw new Error(`Period '${periodId}' is already closed.`);
  }

  const coa = dbGetCOA(tenantId);
  const closingBalances: Record<string, number> = {};
  coa.forEach(acc => {
    closingBalances[acc.accountId] = acc.currentBalance;
  });

  const closedPeriod: FiscalPeriod = {
    ...period,
    status: 'Closed',
    closedBy,
    closedAt: new Date().toISOString(),
    closingBalances
  };

  dbSaveFiscalPeriod(closedPeriod);

  // Initialize Next Period
  const [yearStr, monthStr] = periodId.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const nextMonthDate = new Date(year, month, 1);
  const nextPeriodId = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, '0')}`;

  const nextPeriod: FiscalPeriod = {
    periodId: nextPeriodId,
    tenantId,
    startDate: `${nextPeriodId}-01`,
    endDate: `${nextPeriodId}-28`,
    status: 'Open',
    openingBalances: closingBalances,
    closingBalances: {}
  };

  dbSaveFiscalPeriod(nextPeriod);

  logUFEAudit(
    tenantId,
    closedBy,
    'CLOSE_PERIOD',
    'FiscalPeriod',
    periodId,
    `Closed Fiscal Period [${periodId}] and locked all underlying journal entries. Next period [${nextPeriodId}] initialized.`
  );

  return closedPeriod;
};

// ---------------------------------------------------------------------------
// 7. FINANCIAL REPORTING ENGINE (Layer 5)
// ---------------------------------------------------------------------------

export interface FinancialReportData {
  trialBalance: {
    accounts: { accountId: string; name: string; type: string; debitBalance: number; creditBalance: number }[];
    totalDebit: number;
    totalCredit: number;
    isBalanced: boolean;
  };
  profitLoss: {
    revenueLines: { accountId: string; name: string; amount: number }[];
    totalRevenue: number;
    expenseLines: { accountId: string; name: string; amount: number }[];
    totalExpense: number;
    netProfit: number;
  };
  balanceSheet: {
    assets: { accountId: string; name: string; amount: number }[];
    totalAssets: number;
    liabilities: { accountId: string; name: string; amount: number }[];
    totalLiabilities: number;
    equity: { accountId: string; name: string; amount: number }[];
    totalEquity: number;
    isEquated: boolean;
  };
  taxReport: {
    vatPayable: number;
    nhilPayable: number;
    getFundPayable: number;
    payePayable: number;
    ssnitPayable: number;
    totalTaxLiability: number;
  };
}

export const generateFinancialReports = (tenantId: string): FinancialReportData => {
  const coa = dbGetCOA(tenantId);

  // 1. Trial Balance
  let totalDebit = 0;
  let totalCredit = 0;

  const tbAccounts = coa.map(acc => {
    const normal = getNormalBalanceType(acc.type);
    let debitBalance = 0;
    let creditBalance = 0;

    if (normal === 'debit') {
      debitBalance = Math.max(0, acc.currentBalance);
      creditBalance = acc.currentBalance < 0 ? Math.abs(acc.currentBalance) : 0;
    } else {
      creditBalance = Math.max(0, acc.currentBalance);
      debitBalance = acc.currentBalance < 0 ? Math.abs(acc.currentBalance) : 0;
    }

    totalDebit += debitBalance;
    totalCredit += creditBalance;

    return {
      accountId: acc.accountId,
      name: acc.name,
      type: acc.type,
      debitBalance: Number(debitBalance.toFixed(2)),
      creditBalance: Number(creditBalance.toFixed(2))
    };
  });

  totalDebit = Number(totalDebit.toFixed(2));
  totalCredit = Number(totalCredit.toFixed(2));
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.05;

  // 2. Profit & Loss
  const revenueLines = coa.filter(a => a.type === 'Revenue').map(a => ({ accountId: a.accountId, name: a.name, amount: a.currentBalance }));
  const totalRevenue = Number(revenueLines.reduce((sum, r) => sum + r.amount, 0).toFixed(2));

  const expenseLines = coa.filter(a => a.type === 'Expense').map(a => ({ accountId: a.accountId, name: a.name, amount: a.currentBalance }));
  const totalExpense = Number(expenseLines.reduce((sum, e) => sum + e.amount, 0).toFixed(2));

  const netProfit = Number((totalRevenue - totalExpense).toFixed(2));

  // 3. Balance Sheet
  const assets = coa.filter(a => a.type === 'Asset').map(a => ({ accountId: a.accountId, name: a.name, amount: a.currentBalance }));
  const totalAssets = Number(assets.reduce((sum, a) => sum + a.amount, 0).toFixed(2));

  const liabilities = coa.filter(a => a.type === 'Liability').map(a => ({ accountId: a.accountId, name: a.name, amount: a.currentBalance }));
  const totalLiabilities = Number(liabilities.reduce((sum, l) => sum + l.amount, 0).toFixed(2));

  const baseEquity = coa.filter(a => a.type === 'Equity').map(a => ({ accountId: a.accountId, name: a.name, amount: a.currentBalance }));
  const equityWithNetProfit = [...baseEquity, { accountId: '3300', name: 'Current Period Net Earnings', amount: netProfit }];
  const totalEquity = Number(equityWithNetProfit.reduce((sum, e) => sum + e.amount, 0).toFixed(2));

  const isEquated = Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.05;

  // 4. Tax Report
  const getBal = (id: string) => (coa.find(a => a.accountId === id)?.currentBalance || 0);
  const vatPayable = getBal('2200');
  const nhilPayable = getBal('2210');
  const getFundPayable = getBal('2220');
  const payePayable = getBal('2230');
  const ssnitPayable = getBal('2240');
  const totalTaxLiability = Number((vatPayable + nhilPayable + getFundPayable + payePayable + ssnitPayable).toFixed(2));

  return {
    trialBalance: { accounts: tbAccounts, totalDebit, totalCredit, isBalanced },
    profitLoss: { revenueLines, totalRevenue, expenseLines, totalExpense, netProfit },
    balanceSheet: { assets, totalAssets, liabilities, totalLiabilities, equity: equityWithNetProfit, totalEquity, isEquated },
    taxReport: { vatPayable, nhilPayable, getFundPayable, payePayable, ssnitPayable, totalTaxLiability }
  };
};

// ---------------------------------------------------------------------------
// 8. DAILY RECONCILIATION & REVERSAL UTILITIES
// ---------------------------------------------------------------------------

export const runDailyReconciliation = (tenantId: string) => {
  const coa = dbGetCOA(tenantId);
  const entries = dbGetJournalEntries(tenantId);

  const calculatedBalances: Record<string, number> = {};
  coa.forEach(a => {
    calculatedBalances[a.accountId] = a.openingBalance;
  });

  entries.forEach(je => {
    if (je.isReversed) return;
    je.lines.forEach(l => {
      const acc = coa.find(a => a.accountId === l.accountId);
      if (!acc) return;
      const normal = getNormalBalanceType(acc.type);
      if (normal === 'debit') {
        calculatedBalances[l.accountId] += l.type === 'debit' ? l.amount : -l.amount;
      } else {
        calculatedBalances[l.accountId] += l.type === 'credit' ? l.amount : -l.amount;
      }
    });
  });

  const discrepancies: { accountId: string; name: string; stored: number; calculated: number; diff: number }[] = [];

  coa.forEach(a => {
    const calc = Number((calculatedBalances[a.accountId] || 0).toFixed(2));
    const stored = Number(a.currentBalance.toFixed(2));
    const diff = Number(Math.abs(calc - stored).toFixed(2));
    if (diff > 0.01) {
      discrepancies.push({
        accountId: a.accountId,
        name: a.name,
        stored,
        calculated: calc,
        diff
      });
    }
  });

  return {
    isHealthy: discrepancies.length === 0,
    discrepancies,
    reconciledAt: new Date().toISOString()
  };
};

export const reverseJournalEntry = (tenantId: string, entryId: string, reason: string, user: string) => {
  const entries = dbGetJournalEntries(tenantId);
  const targetEntry = entries.find(e => e.entryId === entryId);

  if (!targetEntry) throw new Error(`Journal Entry '${entryId}' not found.`);
  if (targetEntry.isReversed) throw new Error(`Journal Entry '${entryId}' has already been reversed.`);

  const periodId = targetEntry.periodId;
  if (!isPeriodOpen(periodId, tenantId)) {
    throw new Error(`Cannot reverse entry in a CLOSED fiscal period [${periodId}].`);
  }

  // Swap debits & credits
  const counterLines: JournalLine[] = targetEntry.lines.map(l => ({
    ...l,
    type: l.type === 'debit' ? 'credit' : 'debit'
  }));

  const reversalJe = postJournalEntry({
    tenantId,
    date: new Date().toISOString().split('T')[0],
    reference: `REV-${targetEntry.reference}`,
    description: `Reversal of Entry ${targetEntry.reference}: ${reason}`,
    sourceModule: targetEntry.sourceModule,
    sourceId: targetEntry.entryId,
    lines: counterLines,
    createdBy: user,
    periodId
  });

  dbSaveJournalEntry({
    ...targetEntry,
    isReversed: true,
    reversalEntryId: reversalJe.entryId
  });

  logUFEAudit(
    tenantId,
    user,
    'REVERSE_JOURNAL_ENTRY',
    'JournalEntry',
    entryId,
    `Reversed Journal Voucher [${targetEntry.reference}]. Counter entry generated: [${reversalJe.reference}]`
  );

  return reversalJe;
};
