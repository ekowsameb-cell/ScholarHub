// src/data/ufeMockData.ts

export type AccountType = 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';

export type AccountSubType =
  | 'Current Asset'
  | 'Non-Current Asset'
  | 'Current Liability'
  | 'Long-Term Liability'
  | 'Equity'
  | 'Operating Revenue'
  | 'Non-Operating Revenue'
  | 'Operating Expense'
  | 'Administrative Expense'
  | 'Tax Liability';

export interface Tenant {
  tenantId: string;
  name: string;
  vertical: 'school' | 'pharmacy' | 'bar' | 'clinic' | 'barber' | 'retail';
  baseCurrency: string;
  fiscalYearStart: string; // e.g. "01-01"
  taxEnabled: boolean;
  subscriptionStatus: 'active' | 'trial' | 'suspended';
  createdAt: string;
}

export interface COAItem {
  accountId: string;
  tenantId: string;
  name: string;
  type: AccountType;
  subType: AccountSubType;
  isSystemAccount: boolean;
  openingBalance: number;
  currentBalance: number;
  createdAt: string;
}

export interface JournalLine {
  accountId: string;
  accountName: string;
  type: 'debit' | 'credit';
  amount: number;
}

export interface JournalEntry {
  entryId: string;
  tenantId: string;
  date: string;
  reference: string;
  description: string;
  sourceModule: 'fee_collection' | 'pos' | 'purchase' | 'payroll' | 'expense' | 'manual_adjustment';
  sourceId?: string;
  lines: JournalLine[];
  totalDebit: number;
  totalCredit: number;
  createdBy: string;
  createdAt: string;
  isReversed: boolean;
  reversalEntryId?: string | null;
  periodId: string;
}

export interface GeneralLedgerEntry {
  entryId: string;
  date: string;
  description: string;
  debit: number;
  credit: number;
  runningBalance: number;
}

export interface GeneralLedger {
  ledgerId: string;
  tenantId: string;
  accountId: string;
  accountName: string;
  entries: GeneralLedgerEntry[];
  closingBalance: number;
  periodId: string;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  accountId: string; // COA Revenue Account e.g. "4100"
}

export interface UFEInvoice {
  invoiceId: string;
  tenantId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  issueDate: string;
  dueDate: string;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  taxTotal: number;
  discountTotal: number;
  grandTotal: number;
  amountPaid: number;
  balanceDue: number;
  status: 'Draft' | 'Sent' | 'Partially Paid' | 'Paid' | 'Overdue' | 'Cancelled';
  journalEntryId?: string;
  createdBy: string;
  createdAt: string;
}

export interface UFEPayment {
  paymentId: string;
  tenantId: string;
  invoiceId: string;
  customerId: string;
  customerName: string;
  amount: number;
  paymentMethod: 'Cash' | 'MoMo' | 'Bank Transfer' | 'Card';
  paymentAccountId: string; // e.g. "1100", "1110", "1120"
  reference: string;
  date: string;
  journalEntryId?: string;
  recordedBy: string;
  createdAt: string;
}

export interface UFEExpense {
  expenseId: string;
  tenantId: string;
  category: string;
  description: string;
  amount: number;
  taxAmount: number;
  paymentAccountId: string; // Cash/Bank COA code
  expenseAccountId: string; // Expense COA code
  supplierId?: string;
  supplierName?: string;
  receiptUrl?: string;
  date: string;
  status: 'Draft' | 'Pending' | 'Approved' | 'Paid';
  approvedBy?: string;
  journalEntryId?: string;
  createdBy: string;
  createdAt: string;
}

export interface SupplierBillLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  accountId: string; // Expense/Inventory account
}

export interface UFESupplierBill {
  billId: string;
  tenantId: string;
  supplierId: string;
  supplierName: string;
  billNumber: string;
  issueDate: string;
  dueDate: string;
  lineItems: SupplierBillLineItem[];
  grandTotal: number;
  amountPaid: number;
  balanceDue: number;
  status: 'Unpaid' | 'Partially Paid' | 'Paid' | 'Overdue';
  journalEntryId?: string;
  createdBy: string;
  createdAt: string;
}

export interface TaxComponent {
  name: string;
  rate: number;
  accountId: string;
}

export interface UFETaxRate {
  taxRateId: string;
  tenantId: string;
  name: string;
  rate: number;
  components: TaxComponent[];
  isDefault: boolean;
  appliesTo: ('sales' | 'services')[];
}

export interface FiscalPeriod {
  periodId: string; // "YYYY-MM" e.g. "2026-09"
  tenantId: string;
  startDate: string;
  endDate: string;
  status: 'Open' | 'Closing' | 'Closed' | 'Locked';
  closedBy?: string | null;
  closedAt?: string | null;
  openingBalances: Record<string, number>;
  closingBalances: Record<string, number>;
}

export interface AuditLog {
  logId: string;
  tenantId: string;
  timestamp: string;
  user: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
}

// -------------------------------------------------------------------------
// SEED DATA TEMPLATES
// -------------------------------------------------------------------------

export const DEFAULT_TENANT: Tenant = {
  tenantId: 'school_kingsway_001',
  name: 'Kingsway International School & ERP',
  vertical: 'school',
  baseCurrency: 'GHS',
  fiscalYearStart: '01-01',
  taxEnabled: true,
  subscriptionStatus: 'active',
  createdAt: '2026-01-01T00:00:00.000Z'
};

export const STANDARD_GHANA_COA: COAItem[] = [
  // 1000 - ASSETS
  { accountId: '1100', tenantId: 'school_kingsway_001', name: 'Cash on Hand', type: 'Asset', subType: 'Current Asset', isSystemAccount: true, openingBalance: 12500, currentBalance: 24500, createdAt: '2026-01-01' },
  { accountId: '1110', tenantId: 'school_kingsway_001', name: 'Bank Account (GCB Bank)', type: 'Asset', subType: 'Current Asset', isSystemAccount: true, openingBalance: 85000, currentBalance: 142000, createdAt: '2026-01-01' },
  { accountId: '1120', tenantId: 'school_kingsway_001', name: 'MoMo Wallet (MTN Mobile Money)', type: 'Asset', subType: 'Current Asset', isSystemAccount: true, openingBalance: 18000, currentBalance: 32400, createdAt: '2026-01-01' },
  { accountId: '1130', tenantId: 'school_kingsway_001', name: 'MoMo Wallet (Telecel Cash)', type: 'Asset', subType: 'Current Asset', isSystemAccount: true, openingBalance: 4500, currentBalance: 6800, createdAt: '2026-01-01' },
  { accountId: '1200', tenantId: 'school_kingsway_001', name: 'Accounts Receivable (Students/Clients)', type: 'Asset', subType: 'Current Asset', isSystemAccount: true, openingBalance: 45000, currentBalance: 28500, createdAt: '2026-01-01' },
  { accountId: '1300', tenantId: 'school_kingsway_001', name: 'Inventory (Textbooks, Uniforms, Supplies)', type: 'Asset', subType: 'Current Asset', isSystemAccount: false, openingBalance: 22000, currentBalance: 19500, createdAt: '2026-01-01' },
  { accountId: '1400', tenantId: 'school_kingsway_001', name: 'Prepaid Expenses (Insurance & Licenses)', type: 'Asset', subType: 'Current Asset', isSystemAccount: false, openingBalance: 6000, currentBalance: 4500, createdAt: '2026-01-01' },
  { accountId: '1500', tenantId: 'school_kingsway_001', name: 'Furniture, Vehicles & IT Equipment', type: 'Asset', subType: 'Non-Current Asset', isSystemAccount: false, openingBalance: 150000, currentBalance: 150000, createdAt: '2026-01-01' },

  // 2000 - LIABILITIES
  { accountId: '2100', tenantId: 'school_kingsway_001', name: 'Accounts Payable (Suppliers/Vendors)', type: 'Liability', subType: 'Current Liability', isSystemAccount: true, openingBalance: 14000, currentBalance: 8200, createdAt: '2026-01-01' },
  { accountId: '2200', tenantId: 'school_kingsway_001', name: 'GRA VAT Payable (15%)', type: 'Liability', subType: 'Tax Liability', isSystemAccount: true, openingBalance: 3200, currentBalance: 4850, createdAt: '2026-01-01' },
  { accountId: '2210', tenantId: 'school_kingsway_001', name: 'GRA NHIL Payable (2.5%)', type: 'Liability', subType: 'Tax Liability', isSystemAccount: true, openingBalance: 530, currentBalance: 810, createdAt: '2026-01-01' },
  { accountId: '2220', tenantId: 'school_kingsway_001', name: 'GRA GETFund Payable (2.5%)', type: 'Liability', subType: 'Tax Liability', isSystemAccount: true, openingBalance: 530, currentBalance: 810, createdAt: '2026-01-01' },
  { accountId: '2230', tenantId: 'school_kingsway_001', name: 'GRA PAYE Tax Payable', type: 'Liability', subType: 'Tax Liability', isSystemAccount: true, openingBalance: 6400, currentBalance: 8920, createdAt: '2026-01-01' },
  { accountId: '2240', tenantId: 'school_kingsway_001', name: 'SSNIT Pensions Payable (18.5%)', type: 'Liability', subType: 'Current Liability', isSystemAccount: true, openingBalance: 7800, currentBalance: 11450, createdAt: '2026-01-01' },
  { accountId: '2300', tenantId: 'school_kingsway_001', name: 'Accrued Utility & Maintenance Liabilities', type: 'Liability', subType: 'Current Liability', isSystemAccount: false, openingBalance: 2500, currentBalance: 1800, createdAt: '2026-01-01' },

  // 3000 - EQUITY
  { accountId: '3100', tenantId: 'school_kingsway_001', name: "Owner's Equity / Initial Capital", type: 'Equity', subType: 'Equity', isSystemAccount: true, openingBalance: 200000, currentBalance: 200000, createdAt: '2026-01-01' },
  { accountId: '3200', tenantId: 'school_kingsway_001', name: 'Retained Earnings', type: 'Equity', subType: 'Equity', isSystemAccount: true, openingBalance: 118000, currentBalance: 118000, createdAt: '2026-01-01' },

  // 4000 - REVENUE
  { accountId: '4100', tenantId: 'school_kingsway_001', name: 'Tuition & Academic Fee Revenue', type: 'Revenue', subType: 'Operating Revenue', isSystemAccount: true, openingBalance: 0, currentBalance: 185000, createdAt: '2026-01-01' },
  { accountId: '4110', tenantId: 'school_kingsway_001', name: 'PTA Dues & Institutional Development Fund', type: 'Revenue', subType: 'Operating Revenue', isSystemAccount: false, openingBalance: 0, currentBalance: 14200, createdAt: '2026-01-01' },
  { accountId: '4200', tenantId: 'school_kingsway_001', name: 'Sales Revenue (Books, Uniforms & Canteen)', type: 'Revenue', subType: 'Operating Revenue', isSystemAccount: false, openingBalance: 0, currentBalance: 32400, createdAt: '2026-01-01' },
  { accountId: '4300', tenantId: 'school_kingsway_001', name: 'Service Revenue (Transport & ICT Services)', type: 'Revenue', subType: 'Operating Revenue', isSystemAccount: false, openingBalance: 0, currentBalance: 18600, createdAt: '2026-01-01' },
  { accountId: '4400', tenantId: 'school_kingsway_001', name: 'Other Income & Facility Rental', type: 'Revenue', subType: 'Non-Operating Revenue', isSystemAccount: false, openingBalance: 0, currentBalance: 5200, createdAt: '2026-01-01' },

  // 5000 - EXPENSES
  { accountId: '5100', tenantId: 'school_kingsway_001', name: 'Cost of Goods Sold (Textbooks & Goods)', type: 'Expense', subType: 'Operating Expense', isSystemAccount: false, openingBalance: 0, currentBalance: 16800, createdAt: '2026-01-01' },
  { accountId: '5200', tenantId: 'school_kingsway_001', name: 'Staff Salaries & Wages', type: 'Expense', subType: 'Administrative Expense', isSystemAccount: true, openingBalance: 0, currentBalance: 68500, createdAt: '2026-01-01' },
  { accountId: '5210', tenantId: 'school_kingsway_001', name: 'SSNIT Employer Contribution (13%)', type: 'Expense', subType: 'Administrative Expense', isSystemAccount: true, openingBalance: 0, currentBalance: 8905, createdAt: '2026-01-01' },
  { accountId: '5300', tenantId: 'school_kingsway_001', name: 'Campus Rent & Lease', type: 'Expense', subType: 'Operating Expense', isSystemAccount: false, openingBalance: 0, currentBalance: 24000, createdAt: '2026-01-01' },
  { accountId: '5400', tenantId: 'school_kingsway_001', name: 'Utilities (ECG Electricity & GWCL Water)', type: 'Expense', subType: 'Operating Expense', isSystemAccount: false, openingBalance: 0, currentBalance: 9800, createdAt: '2026-01-01' },
  { accountId: '5500', tenantId: 'school_kingsway_001', name: 'Transport, Fuel & Bus Maintenance', type: 'Expense', subType: 'Operating Expense', isSystemAccount: false, openingBalance: 0, currentBalance: 11200, createdAt: '2026-01-01' },
  { accountId: '5600', tenantId: 'school_kingsway_001', name: 'Office & Teaching Stationery Supplies', type: 'Expense', subType: 'Administrative Expense', isSystemAccount: false, openingBalance: 0, currentBalance: 4300, createdAt: '2026-01-01' },
  { accountId: '5700', tenantId: 'school_kingsway_001', name: 'Repairs & Infrastructure Maintenance', type: 'Expense', subType: 'Operating Expense', isSystemAccount: false, openingBalance: 0, currentBalance: 7600, createdAt: '2026-01-01' },
  { accountId: '5800', tenantId: 'school_kingsway_001', name: 'Marketing, Admissions & Advertising', type: 'Expense', subType: 'Administrative Expense', isSystemAccount: false, openingBalance: 0, currentBalance: 3500, createdAt: '2026-01-01' },
  { accountId: '5900', tenantId: 'school_kingsway_001', name: 'Bank & MoMo Settlement Charges', type: 'Expense', subType: 'Administrative Expense', isSystemAccount: false, openingBalance: 0, currentBalance: 1450, createdAt: '2026-01-01' }
];

export const MOCK_TAX_RATES: UFETaxRate[] = [
  {
    taxRateId: 'tax_ghana_std_2026',
    tenantId: 'school_kingsway_001',
    name: 'Ghana Standard Commercial Tax (VAT + NHIL + GETFund)',
    rate: 20.0,
    components: [
      { name: 'VAT (Value Added Tax)', rate: 15.0, accountId: '2200' },
      { name: 'NHIL (National Health Insurance Levy)', rate: 2.5, accountId: '2210' },
      { name: 'GETFund (Ghana Education Trust Fund)', rate: 2.5, accountId: '2220' }
    ],
    isDefault: true,
    appliesTo: ['sales', 'services']
  }
];

export const MOCK_FISCAL_PERIODS: FiscalPeriod[] = [
  {
    periodId: '2026-09',
    tenantId: 'school_kingsway_001',
    startDate: '2026-09-01',
    endDate: '2026-09-30',
    status: 'Open',
    closedBy: null,
    closedAt: null,
    openingBalances: {
      '1100': 18000,
      '1110': 110000,
      '1120': 22000,
      '1200': 35000,
      '2100': 12000
    },
    closingBalances: {}
  },
  {
    periodId: '2026-08',
    tenantId: 'school_kingsway_001',
    startDate: '2026-08-01',
    endDate: '2026-08-31',
    status: 'Closed',
    closedBy: 'user_bursar1',
    closedAt: '2026-08-31T23:59:59.000Z',
    openingBalances: {},
    closingBalances: {}
  }
];

export const MOCK_INVOICES: UFEInvoice[] = [
  {
    invoiceId: 'inv_2026_001',
    tenantId: 'school_kingsway_001',
    invoiceNumber: 'INV-2026-0901',
    customerId: 'STU-2026-001',
    customerName: 'Kwame Mensah (Basic 6)',
    customerPhone: '+233 24 411 2233',
    issueDate: '2026-09-01',
    dueDate: '2026-09-20',
    lineItems: [
      { description: 'Term 1 Tuition Fee', quantity: 1, unitPrice: 2500, taxRate: 0, taxAmount: 0, total: 2500, accountId: '4100' },
      { description: 'ICT Lab & E-Learning License', quantity: 1, unitPrice: 350, taxRate: 0, taxAmount: 0, total: 350, accountId: '4300' }
    ],
    subtotal: 2850,
    taxTotal: 0,
    discountTotal: 0,
    grandTotal: 2850,
    amountPaid: 2850,
    balanceDue: 0,
    status: 'Paid',
    journalEntryId: 'je_2026_001',
    createdBy: 'user_bursar1',
    createdAt: '2026-09-01T09:00:00.000Z'
  },
  {
    invoiceId: 'inv_2026_002',
    tenantId: 'school_kingsway_001',
    invoiceNumber: 'INV-2026-0902',
    customerId: 'STU-2026-002',
    customerName: 'Abena Osei (JHS 2)',
    customerPhone: '+233 20 882 1199',
    issueDate: '2026-09-02',
    dueDate: '2026-09-25',
    lineItems: [
      { description: 'Term 1 JHS Tuition Fee', quantity: 1, unitPrice: 3200, taxRate: 0, taxAmount: 0, total: 3200, accountId: '4100' },
      { description: 'Science Lab Material Fee', quantity: 1, unitPrice: 400, taxRate: 0, taxAmount: 0, total: 400, accountId: '4300' }
    ],
    subtotal: 3600,
    taxTotal: 0,
    discountTotal: 0,
    grandTotal: 3600,
    amountPaid: 1500,
    balanceDue: 2100,
    status: 'Partially Paid',
    journalEntryId: 'je_2026_002',
    createdBy: 'user_bursar1',
    createdAt: '2026-09-02T10:15:00.000Z'
  },
  {
    invoiceId: 'inv_2026_003',
    tenantId: 'school_kingsway_001',
    invoiceNumber: 'INV-2026-0903',
    customerId: 'CLI-9921',
    customerName: 'Accra West Athletic Club',
    customerPhone: '+233 27 700 4455',
    issueDate: '2026-09-10',
    dueDate: '2026-09-30',
    lineItems: [
      { description: 'Weekend Sports Field & Facility Rental', quantity: 2, unitPrice: 1500, taxRate: 20, taxAmount: 600, total: 3600, accountId: '4400' }
    ],
    subtotal: 3000,
    taxTotal: 600,
    discountTotal: 0,
    grandTotal: 3600,
    amountPaid: 0,
    balanceDue: 3600,
    status: 'Sent',
    journalEntryId: 'je_2026_003',
    createdBy: 'user_bursar1',
    createdAt: '2026-09-10T14:30:00.000Z'
  }
];

export const MOCK_PAYMENTS: UFEPayment[] = [
  {
    paymentId: 'pay_2026_001',
    tenantId: 'school_kingsway_001',
    invoiceId: 'inv_2026_001',
    customerId: 'STU-2026-001',
    customerName: 'Kwame Mensah (Basic 6)',
    amount: 2850,
    paymentMethod: 'MoMo',
    paymentAccountId: '1120', // MoMo Wallet
    reference: 'MTN-MM-992817441',
    date: '2026-09-03',
    journalEntryId: 'je_2026_004',
    recordedBy: 'user_bursar1',
    createdAt: '2026-09-03T11:20:00.000Z'
  },
  {
    paymentId: 'pay_2026_002',
    tenantId: 'school_kingsway_001',
    invoiceId: 'inv_2026_002',
    customerId: 'STU-2026-002',
    customerName: 'Abena Osei (JHS 2)',
    amount: 1500,
    paymentMethod: 'Cash',
    paymentAccountId: '1100', // Cash on Hand
    reference: 'REC-2026-09-441',
    date: '2026-09-05',
    journalEntryId: 'je_2026_005',
    recordedBy: 'user_bursar1',
    createdAt: '2026-09-05T15:45:00.000Z'
  }
];

export const MOCK_EXPENSES: UFEExpense[] = [
  {
    expenseId: 'exp_2026_001',
    tenantId: 'school_kingsway_001',
    category: 'Utilities',
    description: 'ECG Commercial Electricity Bill for Campus - Sept 2026',
    amount: 3450,
    taxAmount: 0,
    paymentAccountId: '1110', // Bank GCB
    expenseAccountId: '5400', // Utilities
    supplierId: 'sup_ecg',
    supplierName: 'Electricity Company of Ghana (ECG)',
    date: '2026-09-12',
    status: 'Paid',
    approvedBy: 'user_headmaster',
    journalEntryId: 'je_2026_006',
    createdBy: 'user_bursar1',
    createdAt: '2026-09-12T10:00:00.000Z'
  },
  {
    expenseId: 'exp_2026_002',
    tenantId: 'school_kingsway_001',
    category: 'Fuel & Logistics',
    description: 'School Bus Diesel Fuel - GOIL Station Legon',
    amount: 1850,
    taxAmount: 0,
    paymentAccountId: '1100', // Cash
    expenseAccountId: '5500', // Transport & Fuel
    supplierId: 'sup_goil',
    supplierName: 'GOIL Ghana PLC',
    date: '2026-09-18',
    status: 'Paid',
    approvedBy: 'user_headmaster',
    journalEntryId: 'je_2026_007',
    createdBy: 'user_bursar1',
    createdAt: '2026-09-18T16:10:00.000Z'
  }
];

export const MOCK_SUPPLIER_BILLS: UFESupplierBill[] = [
  {
    billId: 'bill_2026_001',
    tenantId: 'school_kingsway_001',
    supplierId: 'sup_001',
    supplierName: 'Accra Educational Books Ltd',
    billNumber: 'AEB-2026-889',
    issueDate: '2026-09-04',
    dueDate: '2026-10-04',
    lineItems: [
      { description: 'NaCCA Approved Basic 6 Mathematics Textbooks', quantity: 100, unitPrice: 45, total: 4500, accountId: '1300' },
      { description: 'JHS Integrated Science Workbooks', quantity: 60, unitPrice: 35, total: 2100, accountId: '1300' }
    ],
    grandTotal: 6600,
    amountPaid: 3000,
    balanceDue: 3600,
    status: 'Partially Paid',
    journalEntryId: 'je_2026_008',
    createdBy: 'user_bursar1',
    createdAt: '2026-09-04T13:00:00.000Z'
  }
];

export const MOCK_JOURNAL_ENTRIES: JournalEntry[] = [
  {
    entryId: 'je_2026_001',
    tenantId: 'school_kingsway_001',
    date: '2026-09-01',
    reference: 'INV-2026-0901',
    description: 'Fee Invoice Issued to Kwame Mensah',
    sourceModule: 'fee_collection',
    sourceId: 'inv_2026_001',
    lines: [
      { accountId: '1200', accountName: 'Accounts Receivable', type: 'debit', amount: 2850 },
      { accountId: '4100', accountName: 'Tuition & Academic Fee Revenue', type: 'credit', amount: 2500 },
      { accountId: '4300', accountName: 'Service Revenue', type: 'credit', amount: 350 }
    ],
    totalDebit: 2850,
    totalCredit: 2850,
    createdBy: 'user_bursar1',
    createdAt: '2026-09-01T09:00:00.000Z',
    isReversed: false,
    periodId: '2026-09'
  },
  {
    entryId: 'je_2026_004',
    tenantId: 'school_kingsway_001',
    date: '2026-09-03',
    reference: 'PAY-2026-001',
    description: 'MoMo Fee Payment Received from Kwame Mensah',
    sourceModule: 'fee_collection',
    sourceId: 'pay_2026_001',
    lines: [
      { accountId: '1120', accountName: 'MoMo Wallet (MTN Mobile Money)', type: 'debit', amount: 2850 },
      { accountId: '1200', accountName: 'Accounts Receivable', type: 'credit', amount: 2850 }
    ],
    totalDebit: 2850,
    totalCredit: 2850,
    createdBy: 'user_bursar1',
    createdAt: '2026-09-03T11:20:00.000Z',
    isReversed: false,
    periodId: '2026-09'
  },
  {
    entryId: 'je_2026_006',
    tenantId: 'school_kingsway_001',
    date: '2026-09-12',
    reference: 'EXP-2026-001',
    description: 'ECG Campus Electricity Utility Payment',
    sourceModule: 'expense',
    sourceId: 'exp_2026_001',
    lines: [
      { accountId: '5400', accountName: 'Utilities (ECG Electricity)', type: 'debit', amount: 3450 },
      { accountId: '1110', accountName: 'Bank Account (GCB Bank)', type: 'credit', amount: 3450 }
    ],
    totalDebit: 3450,
    totalCredit: 3450,
    createdBy: 'user_bursar1',
    createdAt: '2026-09-12T10:00:00.000Z',
    isReversed: false,
    periodId: '2026-09'
  }
];

export const MOCK_AUDIT_LOGS: AuditLog[] = [
  {
    logId: 'audit_001',
    tenantId: 'school_kingsway_001',
    timestamp: '2026-09-01T09:00:00.000Z',
    user: 'Ama Boateng (Bursar)',
    action: 'CREATE_INVOICE',
    entityType: 'Invoice',
    entityId: 'inv_2026_001',
    details: 'Generated tuition invoice INV-2026-0901 for GH₵ 2,850.00'
  },
  {
    logId: 'audit_002',
    tenantId: 'school_kingsway_001',
    timestamp: '2026-09-03T11:20:00.000Z',
    user: 'Ama Boateng (Bursar)',
    action: 'RECORD_PAYMENT',
    entityType: 'Payment',
    entityId: 'pay_2026_001',
    details: 'Recorded MoMo payment of GH₵ 2,850.00 into MoMo Wallet (1120)'
  }
];
