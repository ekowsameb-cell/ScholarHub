// src/components/UniversalFinanceEngine.tsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  DollarSign, Landmark, Smartphone, TrendingUp, TrendingDown,
  PlusCircle, FileText, CheckCircle2, AlertTriangle, RefreshCw,
  Search, ShieldCheck, Printer, ArrowRightLeft, Lock, Unlock,
  PieChart, ChevronRight, Layers, CheckSquare
} from 'lucide-react';

import type {
  COAItem, JournalEntry, UFEInvoice, UFEPayment, UFEExpense,
  UFESupplierBill, FiscalPeriod, AuditLog
} from '../data/ufeMockData';
import {
  dbGetTenant, dbGetCOA, dbGetJournalEntries, dbGetInvoices,
  dbGetPayments, dbGetExpenses, dbGetSupplierBills, dbGetFiscalPeriods,
  dbGetAuditLogs, dbSaveCOA
} from '../dbAdapter';
import {
  generateInvoice, recordPayment, recordExpense,
  recordSupplierBill, paySupplierBill, closePeriod, generateFinancialReports,
  runDailyReconciliation, reverseJournalEntry
} from '../utils/ufeEngine';

export const UniversalFinanceEngine: React.FC = () => {
  const { currentUser } = useAuth();
  const tenantId = 'school_kingsway_001';
  const tenant = dbGetTenant(tenantId);

  // Active Screen / Tab
  const [activeScreen, setActiveScreen] = useState<'dashboard' | 'invoices' | 'expenses' | 'coa' | 'journal' | 'reports'>('dashboard');

  // State
  const [coa, setCoa] = useState<COAItem[]>([]);
  const [invoices, setInvoices] = useState<UFEInvoice[]>([]);
  const [payments, setPayments] = useState<UFEPayment[]>([]);
  const [expenses, setExpenses] = useState<UFEExpense[]>([]);
  const [supplierBills, setSupplierBills] = useState<UFESupplierBill[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [fiscalPeriods, setFiscalPeriods] = useState<FiscalPeriod[]>([]);
  const [_auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Modals
  const [showCreateInvoiceModal, setShowCreateInvoiceModal] = useState(false);
  const [showRecordPaymentModal, setShowRecordPaymentModal] = useState(false);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<UFEInvoice | null>(null);
  const [showRecordExpenseModal, setShowRecordExpenseModal] = useState(false);
  const [showSupplierBillModal, setShowSupplierBillModal] = useState(false);
  const [showPayBillModal, setShowPayBillModal] = useState(false);
  const [selectedBillForPay, setSelectedBillForPay] = useState<UFESupplierBill | null>(null);
  const [showAddCOAModal, setShowAddCOAModal] = useState(false);
  const [selectedLedgerAccount, setSelectedLedgerAccount] = useState<COAItem | null>(null);
  const [selectedJournalEntry, setSelectedJournalEntry] = useState<JournalEntry | null>(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<string>('all');
  const [expenseSubTab, setExpenseSubTab] = useState<'expenses' | 'bills'>('expenses');
  const [reportTab, setReportTab] = useState<'tb' | 'pnl' | 'bs' | 'tax' | 'period'>('tb');
  const [reconciliationResult, setReconciliationResult] = useState<{ isHealthy: boolean; discrepancies: any[]; reconciledAt: string } | null>(null);

  // Feedback messages
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = () => {
    setCoa(dbGetCOA(tenantId));
    setInvoices(dbGetInvoices(tenantId));
    setPayments(dbGetPayments(tenantId));
    setExpenses(dbGetExpenses(tenantId));
    setSupplierBills(dbGetSupplierBills(tenantId));
    setJournalEntries(dbGetJournalEntries(tenantId));
    setFiscalPeriods(dbGetFiscalPeriods(tenantId));
    setAuditLogs(dbGetAuditLogs(tenantId));
  };

  useEffect(() => {
    loadData();
    window.addEventListener('sh_data_updated', loadData);
    return () => window.removeEventListener('sh_data_updated', loadData);
  }, []);

  const notify = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 5000);
  };

  // Calculations for Dashboard KPIs
  const getBal = (code: string) => coa.find(a => a.accountId === code)?.currentBalance || 0;
  const cashOnHand = getBal('1100');
  const bankBalance = getBal('1110');
  const momoBalance = getBal('1120') + getBal('1130');
  const totalReceivables = getBal('1200');
  const totalPayables = getBal('2100');
  const todayDateStr = new Date().toISOString().split('T')[0];
  const todayCollections = payments
    .filter(p => p.date === todayDateStr)
    .reduce((sum, p) => sum + p.amount, 0);

  // --- FORM STATES ---
  // Create Invoice Form
  const [newInvCustomerName, setNewInvCustomerName] = useState('');
  const [newInvCustomerId, setNewInvCustomerId] = useState('');
  const [newInvDueDate, setNewInvDueDate] = useState('2026-10-15');
  const [newInvLines, setNewInvLines] = useState([{ description: 'Tuition / Service Fee', quantity: 1, unitPrice: 1500, taxRate: 0, accountId: '4100' }]);

  // Record Payment Form
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<'Cash' | 'MoMo' | 'Bank Transfer' | 'Card'>('MoMo');
  const [payAccountId, setPayAccountId] = useState('1120'); // MoMo
  const [payRef, setPayRef] = useState('');

  // Record Expense Form
  const [expCategory, setExpCategory] = useState('Utilities');
  const [expDesc, setExpDesc] = useState('');
  const [expAmount, setExpAmount] = useState<number>(0);
  const [expAccountId, setExpAccountId] = useState('5400'); // Utilities
  const [expPayAccountId, setExpPayAccountId] = useState('1110'); // Bank
  const [expSupplier, setExpSupplier] = useState('');

  // Record Supplier Bill Form
  const [billSupplierName, setBillSupplierName] = useState('');
  const [billNumber, setBillNumber] = useState('');
  const [billDueDate, setBillDueDate] = useState('2026-10-30');
  const [billLines, setBillLines] = useState([{ description: 'Textbooks / Materials', quantity: 50, unitPrice: 40, accountId: '1300' }]);

  // Pay Supplier Bill Form
  const [payBillAmt, setPayBillAmt] = useState<number>(0);
  const [payBillAccId, setPayBillAccId] = useState('1110');

  // Add COA Account Form
  const [newAccCode, setNewAccCode] = useState('');
  const [newAccName, setNewAccName] = useState('');
  const [newAccType, setNewAccType] = useState<COAItem['type']>('Asset');
  const [newAccSubType, setNewAccSubType] = useState<COAItem['subType']>('Current Asset');

  // --- HANDLERS ---
  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!newInvCustomerName) throw new Error('Customer Name is required.');
      generateInvoice({
        tenantId,
        customerId: newInvCustomerId || `CUST-${Date.now().toString().slice(-4)}`,
        customerName: newInvCustomerName,
        issueDate: todayDateStr,
        dueDate: newInvDueDate,
        lineItems: newInvLines,
        createdBy: currentUser?.fullName || 'Bursar'
      });
      notify(`Invoice generated successfully! Auto-posted Journal Entry to AR & Revenue.`);
      setShowCreateInvoiceModal(false);
      setNewInvCustomerName('');
    } catch (err: any) {
      notify(err.message || 'Failed to create invoice.', 'error');
    }
  };

  const handleRecordPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceForPayment) return;
    try {
      recordPayment({
        tenantId,
        invoiceId: selectedInvoiceForPayment.invoiceId,
        amount: payAmount,
        paymentMethod: payMethod,
        paymentAccountId: payAccountId,
        reference: payRef || `REC-${Date.now().toString().slice(-4)}`,
        date: todayDateStr,
        recordedBy: currentUser?.fullName || 'Bursar'
      });
      notify(`Payment of GH₵ ${payAmount.toFixed(2)} recorded! Invoice updated & cash journal entry posted.`);
      setShowRecordPaymentModal(false);
    } catch (err: any) {
      notify(err.message || 'Failed to record payment.', 'error');
    }
  };

  const handleRecordExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      recordExpense({
        tenantId,
        category: expCategory,
        description: expDesc,
        amount: expAmount,
        expenseAccountId: expAccountId,
        paymentAccountId: expPayAccountId,
        supplierName: expSupplier,
        date: todayDateStr,
        createdBy: currentUser?.fullName || 'Bursar'
      });
      notify(`Expense of GH₵ ${expAmount.toFixed(2)} recorded & journal entry debited to Expense account.`);
      setShowRecordExpenseModal(false);
      setExpDesc('');
      setExpAmount(0);
    } catch (err: any) {
      notify(err.message || 'Failed to record expense.', 'error');
    }
  };

  const handleRecordSupplierBillSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      recordSupplierBill({
        tenantId,
        supplierId: `SUP-${Date.now().toString().slice(-4)}`,
        supplierName: billSupplierName,
        billNumber: billNumber || `BILL-${Date.now().toString().slice(-4)}`,
        issueDate: todayDateStr,
        dueDate: billDueDate,
        lineItems: billLines,
        createdBy: currentUser?.fullName || 'Bursar'
      });
      notify(`Supplier Bill saved and AP journal entry posted.`);
      setShowSupplierBillModal(false);
      setBillSupplierName('');
    } catch (err: any) {
      notify(err.message || 'Failed to record bill.', 'error');
    }
  };

  const handlePaySupplierBillSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBillForPay) return;
    try {
      paySupplierBill(tenantId, selectedBillForPay.billId, payBillAmt, payBillAccId, currentUser?.fullName || 'Bursar');
      notify(`Supplier Bill payment of GH₵ ${payBillAmt.toFixed(2)} processed!`);
      setShowPayBillModal(false);
    } catch (err: any) {
      notify(err.message || 'Failed to pay supplier bill.', 'error');
    }
  };

  const handleAddCOAAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!newAccCode || !newAccName) throw new Error('Account Code and Name are required.');
      if (coa.some(a => a.accountId === newAccCode)) throw new Error(`Account code '${newAccCode}' already exists.`);
      const newItem: COAItem = {
        accountId: newAccCode,
        tenantId,
        name: newAccName,
        type: newAccType,
        subType: newAccSubType,
        isSystemAccount: false,
        openingBalance: 0,
        currentBalance: 0,
        createdAt: todayDateStr
      };
      dbSaveCOA(tenantId, [...coa, newItem]);
      notify(`COA Account [${newAccCode} - ${newAccName}] created successfully.`);
      setShowAddCOAModal(false);
      setNewAccCode('');
      setNewAccName('');
    } catch (err: any) {
      notify(err.message || 'Failed to add COA account.', 'error');
    }
  };

  const handleRunReconciliation = () => {
    const res = runDailyReconciliation(tenantId);
    setReconciliationResult(res);
    if (res.isHealthy) {
      notify('Reconciliation Audit Passed: 100% GL Journal lines match COA current balances perfectly!');
    } else {
      notify(`Reconciliation Warning: ${res.discrepancies.length} discrepancy found in General Ledger balance check.`, 'error');
    }
  };

  const handleReverseEntry = (entry: JournalEntry) => {
    if (window.confirm(`Are you sure you want to reverse Journal Voucher ${entry.reference}? This will create an immutable counter debit/credit entry.`)) {
      try {
        reverseJournalEntry(tenantId, entry.entryId, 'User requested audit reversal', currentUser?.fullName || 'Bursar');
        notify(`Journal entry ${entry.reference} successfully reversed.`);
      } catch (err: any) {
        notify(err.message || 'Failed to reverse entry.', 'error');
      }
    }
  };

  const handleClosePeriodSubmit = (periodId: string) => {
    if (window.confirm(`Are you sure you want to CLOSE Fiscal Period ${periodId}? Once closed, no users can modify transactions in this period.`)) {
      try {
        closePeriod(tenantId, periodId, currentUser?.fullName || 'Bursar');
        notify(`Fiscal Period ${periodId} successfully CLOSED and locked.`);
      } catch (err: any) {
        notify(err.message || 'Failed to close period.', 'error');
      }
    }
  };

  // Financial Reports computation
  const reportData = generateFinancialReports(tenantId);

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-400 font-semibold text-xs tracking-wider uppercase">
            <Landmark size={16} /> Universal Finance Engine (UFE) v1.0 • {tenant.name}
          </div>
          <h1 className="text-2xl font-bold mt-1 text-white flex items-center gap-3">
            Financial Ledger & Double-Entry Engine
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs px-2.5 py-1 rounded-full font-normal">
              Statutory Ghana PAYE / SSNIT & VAT Compliant
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Universal accounting engine managing Chart of Accounts, Double-Entry Journals, AR/AP, and Real-Time Statutory Reports.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRunReconciliation}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-2 border border-slate-700 transition"
          >
            <RefreshCw size={14} className="text-blue-400" /> Run Audit Reconciliation
          </button>
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition shadow"
          >
            <Printer size={14} /> Print Financials
          </button>
        </div>
      </div>

      {/* Status Alert Notification */}
      {statusMessage && (
        <div className={`p-4 rounded-xl flex items-center gap-3 border ${statusMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'}`}>
          {statusMessage.type === 'success' ? <CheckCircle2 size={20} className="text-emerald-600" /> : <AlertTriangle size={20} className="text-rose-600" />}
          <span className="text-sm font-medium">{statusMessage.text}</span>
        </div>
      )}

      {/* Screen Navigation Tabs */}
      <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-1">
        {[
          { id: 'dashboard', label: 'Finance Dashboard', icon: PieChart },
          { id: 'invoices', label: 'Invoices & Receivables (AR)', icon: FileText },
          { id: 'expenses', label: 'Expenses & Payables (AP)', icon: TrendingDown },
          { id: 'coa', label: 'Chart of Accounts (COA)', icon: Layers },
          { id: 'journal', label: 'Journal Entries & Audit Log', icon: ArrowRightLeft },
          { id: 'reports', label: 'Financial Reports & Period Close', icon: TrendingUp },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeScreen === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveScreen(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                isActive ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ========================================================================
          SCREEN 1: FINANCE DASHBOARD
         ======================================================================== */}
      {activeScreen === 'dashboard' && (
        <div className="space-y-6">
          {/* Quick KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                <span>Cash on Hand (1100)</span>
                <DollarSign size={16} className="text-emerald-500" />
              </div>
              <p className="text-xl font-bold mt-2 text-slate-900">GH₵ {cashOnHand.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
              <span className="text-[10px] text-slate-400 font-mono">Drawer / Cash Till</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                <span>GCB Bank (1110)</span>
                <Landmark size={16} className="text-blue-500" />
              </div>
              <p className="text-xl font-bold mt-2 text-slate-900">GH₵ {bankBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
              <span className="text-[10px] text-slate-400 font-mono">Institutional Account</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                <span>MoMo Wallets (1120/30)</span>
                <Smartphone size={16} className="text-amber-500" />
              </div>
              <p className="text-xl font-bold mt-2 text-slate-900">GH₵ {momoBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
              <span className="text-[10px] text-slate-400 font-mono">MTN & Telecel MoMo</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                <span>Receivables (AR 1200)</span>
                <TrendingUp size={16} className="text-indigo-500" />
              </div>
              <p className="text-xl font-bold mt-2 text-indigo-700">GH₵ {totalReceivables.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
              <span className="text-[10px] text-indigo-500 font-medium">Owed by Students/Clients</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                <span>Payables (AP 2100)</span>
                <TrendingDown size={16} className="text-rose-500" />
              </div>
              <p className="text-xl font-bold mt-2 text-rose-700">GH₵ {totalPayables.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
              <span className="text-[10px] text-rose-500 font-medium">Owed to Vendors</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm bg-emerald-50/50">
              <div className="flex items-center justify-between text-slate-600 text-xs font-medium">
                <span>Today's Collections</span>
                <CheckSquare size={16} className="text-emerald-600" />
              </div>
              <p className="text-xl font-bold mt-2 text-emerald-800">GH₵ {todayCollections.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
              <span className="text-[10px] text-emerald-600 font-medium">Cleared Payments Today</span>
            </div>
          </div>

          {/* Quick Actions Hub */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <PlusCircle size={18} className="text-blue-600" /> Quick Financial Actions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <button
                onClick={() => setShowCreateInvoiceModal(true)}
                className="p-4 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition text-left flex items-start gap-3"
              >
                <div className="p-3 bg-blue-100 text-blue-600 rounded-lg"><FileText size={20} /></div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Issue Fee Invoice</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Bill student tuition or client service</p>
                </div>
              </button>

              <button
                onClick={() => {
                  if (invoices.length > 0) {
                    setSelectedInvoiceForPayment(invoices[0]);
                    setPayAmount(invoices[0].balanceDue);
                  }
                  setShowRecordPaymentModal(true);
                }}
                className="p-4 rounded-xl border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/50 transition text-left flex items-start gap-3"
              >
                <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg"><DollarSign size={20} /></div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Record Payment</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Collect Cash, MoMo, or Bank payment</p>
                </div>
              </button>

              <button
                onClick={() => setShowRecordExpenseModal(true)}
                className="p-4 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/50 transition text-left flex items-start gap-3"
              >
                <div className="p-3 bg-amber-100 text-amber-600 rounded-lg"><TrendingDown size={20} /></div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Record Expense</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Log utility, fuel, or operational cost</p>
                </div>
              </button>

              <button
                onClick={() => setShowSupplierBillModal(true)}
                className="p-4 rounded-xl border border-slate-200 hover:border-purple-400 hover:bg-purple-50/50 transition text-left flex items-start gap-3"
              >
                <div className="p-3 bg-purple-100 text-purple-600 rounded-lg"><Landmark size={20} /></div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Supplier Bill (AP)</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Log book vendor or textbook invoice</p>
                </div>
              </button>
            </div>
          </div>

          {/* Recent Journal Activity & System Health */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-slate-900">Recent Double-Entry Journal Vouchers</h3>
                <button onClick={() => setActiveScreen('journal')} className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1">
                  View All Vouchers <ChevronRight size={14} />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b">
                    <tr>
                      <th className="p-2.5">Date</th>
                      <th className="p-2.5">Ref #</th>
                      <th className="p-2.5">Description</th>
                      <th className="p-2.5 text-right">Debit / Credit</th>
                      <th className="p-2.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {journalEntries.slice(0, 5).map(je => (
                      <tr key={je.entryId} className="hover:bg-slate-50">
                        <td className="p-2.5 text-slate-500 whitespace-nowrap">{je.date}</td>
                        <td className="p-2.5 font-mono font-bold text-blue-700">{je.reference}</td>
                        <td className="p-2.5 text-slate-800 max-w-xs truncate">{je.description}</td>
                        <td className="p-2.5 text-right font-mono font-semibold text-slate-900">
                          GH₵ {je.totalDebit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-2.5 text-center">
                          {je.isReversed ? (
                            <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded text-[10px] font-bold">REVERSED</span>
                          ) : (
                            <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold">POSTED</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Reconciliation & Fiscal Health Panel */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-600" /> Accounting Control & Audit
              </h3>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Active Fiscal Period:</span>
                  <span className="font-bold text-slate-900">2026-09 (September 2026)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Period Status:</span>
                  <span className="text-emerald-600 font-bold flex items-center gap-1"><Unlock size={12} /> OPEN FOR POSTING</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Trial Balance Status:</span>
                  <span className={`font-bold ${reportData.trialBalance.isBalanced ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {reportData.trialBalance.isBalanced ? '✓ PERFECTLY BALANCED' : '⚠️ OUT OF BALANCE'}
                  </span>
                </div>
                {reconciliationResult && (
                  <div className="flex justify-between border-t border-slate-200 pt-1 text-[11px]">
                    <span className="text-slate-500">Last Audit:</span>
                    <span className={`font-bold ${reconciliationResult.isHealthy ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {reconciliationResult.isHealthy ? '100% GL Reconciled' : `${reconciliationResult.discrepancies.length} Issue Found`}
                    </span>
                  </div>
                )}
              </div>

              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 space-y-2 text-xs">
                <h4 className="font-bold text-blue-900">Ghana Statutory Tax Summary</h4>
                <div className="flex justify-between text-blue-800">
                  <span>GRA VAT (15%):</span>
                  <span className="font-mono">GH₵ {reportData.taxReport.vatPayable.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-blue-800">
                  <span>NHIL & GETFund (5%):</span>
                  <span className="font-mono">GH₵ {(reportData.taxReport.nhilPayable + reportData.taxReport.getFundPayable).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-blue-800 font-bold border-t border-blue-200 pt-1">
                  <span>Total Tax Liability:</span>
                  <span className="font-mono">GH₵ {reportData.taxReport.totalTaxLiability.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================
          SCREEN 2: INVOICES & RECEIVABLES (AR)
         ======================================================================== */}
      {activeScreen === 'invoices' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Invoices & Accounts Receivable (AR)</h2>
              <p className="text-xs text-slate-500">Student tuition bills, fee statements, and customer invoices</p>
            </div>
            <button
              onClick={() => setShowCreateInvoiceModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition shadow"
            >
              <PlusCircle size={16} /> Create New Invoice
            </button>
          </div>

          {/* Filters & Search Bar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="relative w-full md:w-72">
              <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search invoice # or customer..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-2">
              {['all', 'Sent', 'Partially Paid', 'Paid', 'Overdue'].map(status => (
                <button
                  key={status}
                  onClick={() => setInvoiceStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition ${
                    invoiceStatusFilter === status ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Invoice Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b">
                <tr>
                  <th className="p-3">Invoice #</th>
                  <th className="p-3">Customer / Student</th>
                  <th className="p-3">Issue Date</th>
                  <th className="p-3">Due Date</th>
                  <th className="p-3 text-right">Grand Total</th>
                  <th className="p-3 text-right">Paid</th>
                  <th className="p-3 text-right">Balance Due</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices
                  .filter(inv => {
                    const matchSearch = inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) || inv.customerName.toLowerCase().includes(searchTerm.toLowerCase());
                    const matchStatus = invoiceStatusFilter === 'all' || inv.status === invoiceStatusFilter;
                    return matchSearch && matchStatus;
                  })
                  .map(inv => (
                    <tr key={inv.invoiceId} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-blue-700">{inv.invoiceNumber}</td>
                      <td className="p-3 font-medium text-slate-900">{inv.customerName}</td>
                      <td className="p-3 text-slate-500">{inv.issueDate}</td>
                      <td className="p-3 text-slate-500">{inv.dueDate}</td>
                      <td className="p-3 text-right font-mono font-semibold">GH₵ {inv.grandTotal.toFixed(2)}</td>
                      <td className="p-3 text-right font-mono text-emerald-600">GH₵ {inv.amountPaid.toFixed(2)}</td>
                      <td className="p-3 text-right font-mono font-bold text-rose-600">GH₵ {inv.balanceDue.toFixed(2)}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          inv.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' :
                          inv.status === 'Partially Paid' ? 'bg-amber-100 text-amber-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="p-3 text-center space-x-2">
                        {inv.balanceDue > 0 && (
                          <button
                            onClick={() => {
                              setSelectedInvoiceForPayment(inv);
                              setPayAmount(inv.balanceDue);
                              setShowRecordPaymentModal(true);
                            }}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold transition"
                          >
                            Record Payment
                          </button>
                        )}
                        <button
                          onClick={() => alert(`Sending Payment Reminder SMS to ${inv.customerName}...`)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium"
                        >
                          SMS Reminder
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================
          SCREEN 3: EXPENSES & PAYABLES (AP)
         ======================================================================== */}
      {activeScreen === 'expenses' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Expenses & Accounts Payable (AP)</h2>
              <p className="text-xs text-slate-500">Track operating expenses, ECG/GWCL utility bills, and vendor payables</p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowRecordExpenseModal(true)}
                className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <PlusCircle size={15} /> Record Expense
              </button>
              <button
                onClick={() => setShowSupplierBillModal(true)}
                className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <PlusCircle size={15} /> Add Supplier Bill
              </button>
            </div>
          </div>

          {/* Sub-tab Switcher */}
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setExpenseSubTab('expenses')}
              className={`px-4 py-2 text-xs font-bold border-b-2 transition ${
                expenseSubTab === 'expenses' ? 'border-amber-600 text-amber-600' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Operating Expenses ({expenses.length})
            </button>
            <button
              onClick={() => setExpenseSubTab('bills')}
              className={`px-4 py-2 text-xs font-bold border-b-2 transition ${
                expenseSubTab === 'bills' ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Supplier Bills & AP ({supplierBills.length})
            </button>
          </div>

          {expenseSubTab === 'expenses' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Description</th>
                    <th className="p-3">Supplier / Payee</th>
                    <th className="p-3 text-right">Amount</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {expenses.map(exp => (
                    <tr key={exp.expenseId} className="hover:bg-slate-50">
                      <td className="p-3 text-slate-500">{exp.date}</td>
                      <td className="p-3 font-semibold text-slate-900">{exp.category}</td>
                      <td className="p-3 text-slate-700">{exp.description}</td>
                      <td className="p-3 text-slate-600">{exp.supplierName || 'N/A'}</td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900">GH₵ {exp.amount.toFixed(2)}</td>
                      <td className="p-3 text-center">
                        <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold">CLEARED</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b">
                  <tr>
                    <th className="p-3">Bill #</th>
                    <th className="p-3">Supplier Name</th>
                    <th className="p-3">Issue Date</th>
                    <th className="p-3">Due Date</th>
                    <th className="p-3 text-right">Grand Total</th>
                    <th className="p-3 text-right">Balance Due</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {supplierBills.map(bill => (
                    <tr key={bill.billId} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-purple-700">{bill.billNumber}</td>
                      <td className="p-3 font-medium text-slate-900">{bill.supplierName}</td>
                      <td className="p-3 text-slate-500">{bill.issueDate}</td>
                      <td className="p-3 text-slate-500">{bill.dueDate}</td>
                      <td className="p-3 text-right font-mono font-semibold">GH₵ {bill.grandTotal.toFixed(2)}</td>
                      <td className="p-3 text-right font-mono font-bold text-rose-600">GH₵ {bill.balanceDue.toFixed(2)}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          bill.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-purple-100 text-purple-800'
                        }`}>
                          {bill.status}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        {bill.balanceDue > 0 && (
                          <button
                            onClick={() => {
                              setSelectedBillForPay(bill);
                              setPayBillAmt(bill.balanceDue);
                              setShowPayBillModal(true);
                            }}
                            className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-[11px] font-semibold transition"
                          >
                            Pay Bill
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================
          SCREEN 4: CHART OF ACCOUNTS (COA)
         ======================================================================== */}
      {activeScreen === 'coa' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Standard Ghana Chart of Accounts (COA)</h2>
              <p className="text-xs text-slate-500">Master account directory categorizing Assets, Liabilities, Equity, Revenue, and Expenses</p>
            </div>
            <button
              onClick={() => setShowAddCOAModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition"
            >
              <PlusCircle size={16} /> Add Custom Account
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {(['Asset', 'Liability', 'Equity', 'Revenue', 'Expense'] as const).map(type => {
              const accounts = coa.filter(a => a.type === type);
              return (
                <div key={type} className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <h3 className="font-bold text-sm text-slate-900">{type}s ({accounts.length})</h3>
                  </div>

                  <div className="space-y-2">
                    {accounts.map(acc => (
                      <div
                        key={acc.accountId}
                        onClick={() => setSelectedLedgerAccount(acc)}
                        className="p-2.5 bg-white rounded-lg border border-slate-200 hover:border-blue-400 cursor-pointer transition shadow-xs"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono font-bold text-blue-700">{acc.accountId}</span>
                          <span className="text-[10px] text-slate-400">{acc.subType}</span>
                        </div>
                        <h4 className="text-xs font-semibold text-slate-800 mt-1">{acc.name}</h4>
                        <div className="mt-2 flex items-center justify-between text-xs border-t border-slate-100 pt-1.5">
                          <span className="text-slate-400 text-[10px]">Balance:</span>
                          <span className="font-mono font-bold text-slate-900">GH₵ {acc.currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================
          SCREEN 5: JOURNAL ENTRIES & AUDIT LOG
         ======================================================================== */}
      {activeScreen === 'journal' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">General Ledger & Double-Entry Journal Vouchers</h2>
              <p className="text-xs text-slate-500">Immutable ledger vouchers ensuring Debits = Credits for every event</p>
            </div>
            <button
              onClick={handleRunReconciliation}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2"
            >
              <RefreshCw size={14} /> Run Reconciliation Audit
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Reference</th>
                  <th className="p-3">Source Module</th>
                  <th className="p-3">Description</th>
                  <th className="p-3 text-right">Debit / Credit Total</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {journalEntries.map(je => (
                  <tr key={je.entryId} className="hover:bg-slate-50">
                    <td className="p-3 text-slate-500 whitespace-nowrap">{je.date}</td>
                    <td className="p-3 font-mono font-bold text-blue-700">{je.reference}</td>
                    <td className="p-3 text-slate-500 uppercase text-[10px] font-bold">{je.sourceModule}</td>
                    <td className="p-3 text-slate-800">{je.description}</td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900">GH₵ {je.totalDebit.toFixed(2)}</td>
                    <td className="p-3 text-center">
                      {je.isReversed ? (
                        <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded text-[10px] font-bold">REVERSED</span>
                      ) : (
                        <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold">POSTED</span>
                      )}
                    </td>
                    <td className="p-3 text-center space-x-2">
                      <button
                        onClick={() => setSelectedJournalEntry(je)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium"
                      >
                        Inspect Voucher
                      </button>
                      {!je.isReversed && (
                        <button
                          onClick={() => handleReverseEntry(je)}
                          className="px-2 py-1 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded text-[11px] font-semibold"
                        >
                          Reverse
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================
          SCREEN 6: FINANCIAL REPORTS & PERIOD MANAGEMENT
         ======================================================================== */}
      {activeScreen === 'reports' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Financial Reports & Period Closing Control</h2>
              <p className="text-xs text-slate-500">Printable Trial Balance, Income Statement, Balance Sheet, Tax Filing & Fiscal Period Locking</p>
            </div>

            {/* Report Tabs */}
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
              {[
                { id: 'tb', label: 'Trial Balance' },
                { id: 'pnl', label: 'Profit & Loss (P&L)' },
                { id: 'bs', label: 'Balance Sheet' },
                { id: 'tax', label: 'GRA Tax Filing' },
                { id: 'period', label: 'Period Closing' },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setReportTab(t.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    reportTab === t.id ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Trial Balance */}
          {reportTab === 'tb' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Trial Balance Verification</h3>
                  <p className="text-xs text-slate-500">Asserting double-entry equilibrium across all COA accounts</p>
                </div>
                <div className={`text-xs font-bold px-3 py-1.5 rounded-lg ${reportData.trialBalance.isBalanced ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                  {reportData.trialBalance.isBalanced ? '✓ DEBITS EQUAL CREDITS' : '⚠️ UNBALANCED DETECTED'}
                </div>
              </div>

              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b">
                  <tr>
                    <th className="p-3">Code</th>
                    <th className="p-3">Account Name</th>
                    <th className="p-3">Type</th>
                    <th className="p-3 text-right">Debit Balance (GH₵)</th>
                    <th className="p-3 text-right">Credit Balance (GH₵)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportData.trialBalance.accounts.map(acc => (
                    <tr key={acc.accountId}>
                      <td className="p-3 font-mono font-bold text-blue-700">{acc.accountId}</td>
                      <td className="p-3 font-medium text-slate-900">{acc.name}</td>
                      <td className="p-3 text-slate-500">{acc.type}</td>
                      <td className="p-3 text-right font-mono text-slate-900">{acc.debitBalance > 0 ? acc.debitBalance.toFixed(2) : '-'}</td>
                      <td className="p-3 text-right font-mono text-slate-900">{acc.creditBalance > 0 ? acc.creditBalance.toFixed(2) : '-'}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-100 font-bold border-t-2 border-slate-300">
                    <td colSpan={3} className="p-3 text-right">TOTAL TRIAL BALANCE:</td>
                    <td className="p-3 text-right font-mono text-blue-800">GH₵ {reportData.trialBalance.totalDebit.toFixed(2)}</td>
                    <td className="p-3 text-right font-mono text-blue-800">GH₵ {reportData.trialBalance.totalCredit.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Profit & Loss Statement */}
          {reportTab === 'pnl' && (
            <div className="space-y-6 max-w-3xl mx-auto border p-6 rounded-2xl bg-white shadow-sm">
              <div className="text-center border-b pb-4">
                <h3 className="text-xl font-bold text-slate-900">{tenant.name}</h3>
                <h4 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mt-0.5">Profit & Loss Statement (Income Statement)</h4>
                <p className="text-xs text-slate-400">For Period Ending September 30, 2026</p>
              </div>

              {/* Operating Revenue */}
              <div className="space-y-2">
                <h5 className="font-bold text-xs text-slate-900 uppercase tracking-wider bg-slate-50 p-2 rounded">1. Operating Revenue</h5>
                {reportData.profitLoss.revenueLines.map(r => (
                  <div key={r.accountId} className="flex justify-between text-xs py-1 border-b border-slate-100">
                    <span className="text-slate-700">{r.name} ({r.accountId})</span>
                    <span className="font-mono font-semibold">GH₵ {r.amount.toFixed(2)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-xs font-bold text-emerald-800 pt-2 border-t">
                  <span>TOTAL REVENUE:</span>
                  <span className="font-mono">GH₵ {reportData.profitLoss.totalRevenue.toFixed(2)}</span>
                </div>
              </div>

              {/* Operating Expenses */}
              <div className="space-y-2">
                <h5 className="font-bold text-xs text-slate-900 uppercase tracking-wider bg-slate-50 p-2 rounded">2. Operating Expenses</h5>
                {reportData.profitLoss.expenseLines.map(e => (
                  <div key={e.accountId} className="flex justify-between text-xs py-1 border-b border-slate-100">
                    <span className="text-slate-700">{e.name} ({e.accountId})</span>
                    <span className="font-mono font-semibold text-rose-700">GH₵ {e.amount.toFixed(2)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-xs font-bold text-rose-800 pt-2 border-t">
                  <span>TOTAL EXPENSES:</span>
                  <span className="font-mono">GH₵ {reportData.profitLoss.totalExpense.toFixed(2)}</span>
                </div>
              </div>

              {/* Net Operating Income */}
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 flex justify-between items-center font-bold text-sm">
                <span className="text-blue-900">NET OPERATING PROFIT / (LOSS):</span>
                <span className={`font-mono text-base ${reportData.profitLoss.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  GH₵ {reportData.profitLoss.netProfit.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Balance Sheet */}
          {reportTab === 'bs' && (
            <div className="space-y-6 max-w-3xl mx-auto border p-6 rounded-2xl bg-white shadow-sm">
              <div className="text-center border-b pb-4">
                <h3 className="text-xl font-bold text-slate-900">{tenant.name}</h3>
                <h4 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mt-0.5">Statement of Financial Position (Balance Sheet)</h4>
                <p className="text-xs text-slate-400">As of September 30, 2026</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Assets */}
                <div className="space-y-3">
                  <h5 className="font-bold text-xs text-slate-900 uppercase tracking-wider bg-slate-50 p-2 rounded">Assets</h5>
                  {reportData.balanceSheet.assets.map(a => (
                    <div key={a.accountId} className="flex justify-between text-xs py-1 border-b border-slate-100">
                      <span className="text-slate-700">{a.name}</span>
                      <span className="font-mono font-semibold">GH₵ {a.amount.toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-xs font-bold text-blue-900 pt-2 border-t">
                    <span>TOTAL ASSETS:</span>
                    <span className="font-mono">GH₵ {reportData.balanceSheet.totalAssets.toFixed(2)}</span>
                  </div>
                </div>

                {/* Liabilities & Equity */}
                <div className="space-y-3">
                  <h5 className="font-bold text-xs text-slate-900 uppercase tracking-wider bg-slate-50 p-2 rounded">Liabilities & Owner's Equity</h5>
                  {reportData.balanceSheet.liabilities.map(l => (
                    <div key={l.accountId} className="flex justify-between text-xs py-1 border-b border-slate-100">
                      <span className="text-slate-700">{l.name}</span>
                      <span className="font-mono font-semibold">GH₵ {l.amount.toFixed(2)}</span>
                    </div>
                  ))}
                  {reportData.balanceSheet.equity.map(e => (
                    <div key={e.accountId} className="flex justify-between text-xs py-1 border-b border-slate-100 text-indigo-700">
                      <span>{e.name}</span>
                      <span className="font-mono font-semibold">GH₵ {e.amount.toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-xs font-bold text-blue-900 pt-2 border-t">
                    <span>TOTAL LIABILITIES & EQUITY:</span>
                    <span className="font-mono">GH₵ {reportData.balanceSheet.totalEquity.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Period Closing Control */}
          {reportTab === 'period' && (
            <div className="space-y-4 max-w-xl mx-auto border p-6 rounded-xl bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Lock size={18} className="text-slate-700" /> Fiscal Period Closing & Locking
              </h3>
              <p className="text-xs text-slate-600">
                Closing a period locks all underlying general ledger journal entries. Once closed, no user can add or modify transactions in that period.
              </p>

              <div className="space-y-2">
                {fiscalPeriods.map(p => (
                  <div key={p.periodId} className="p-3 bg-white rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <h4 className="font-bold text-slate-900">Period {p.periodId}</h4>
                      <p className="text-slate-400 text-[10px]">{p.startDate} to {p.endDate}</p>
                    </div>
                    <div>
                      {p.status === 'Open' ? (
                        <button
                          onClick={() => handleClosePeriodSubmit(p.periodId)}
                          className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded font-semibold transition"
                        >
                          Lock & Close Period
                        </button>
                      ) : (
                        <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded text-[10px] font-bold">LOCKED / CLOSED</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================
          MODALS
         ======================================================================== */}
      {/* 1. Create Invoice Modal */}
      {showCreateInvoiceModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-2xl max-w-lg w-full space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-900">Issue New Fee / Service Invoice</h3>
            <form onSubmit={handleCreateInvoice} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Customer / Student Name</label>
                <input
                  type="text"
                  required
                  value={newInvCustomerName}
                  onChange={e => setNewInvCustomerName(e.target.value)}
                  className="w-full p-2.5 border rounded-lg"
                  placeholder="e.g. Yaw Ofori (Basic 4)"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Student / Client ID (Optional)</label>
                <input
                  type="text"
                  value={newInvCustomerId}
                  onChange={e => setNewInvCustomerId(e.target.value)}
                  className="w-full p-2.5 border rounded-lg font-mono text-xs"
                  placeholder="e.g. STU-2026-044"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Due Date</label>
                <input
                  type="date"
                  required
                  value={newInvDueDate}
                  onChange={e => setNewInvDueDate(e.target.value)}
                  className="w-full p-2.5 border rounded-lg"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-slate-600 font-semibold">Billable Line Item</label>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    className="col-span-2 p-2 border rounded-lg"
                    placeholder="Description"
                    value={newInvLines[0].description}
                    onChange={e => {
                      const updated = [...newInvLines];
                      updated[0].description = e.target.value;
                      setNewInvLines(updated);
                    }}
                  />
                  <input
                    type="number"
                    className="p-2 border rounded-lg"
                    placeholder="Amount GH₵"
                    value={newInvLines[0].unitPrice}
                    onChange={e => {
                      const updated = [...newInvLines];
                      updated[0].unitPrice = parseFloat(e.target.value) || 0;
                      setNewInvLines(updated);
                    }}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowCreateInvoiceModal(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold">Generate Invoice</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Record Payment Modal */}
      {showRecordPaymentModal && selectedInvoiceForPayment && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-2xl max-w-md w-full space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-900">Record Fee / Invoice Payment</h3>
            <p className="text-xs text-slate-500">Invoice: {selectedInvoiceForPayment.invoiceNumber} • {selectedInvoiceForPayment.customerName}</p>

            <form onSubmit={handleRecordPaymentSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Payment Amount (GH₵)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={payAmount}
                  onChange={e => setPayAmount(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 border rounded-lg font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Payment Reference / Transaction ID</label>
                <input
                  type="text"
                  value={payRef}
                  onChange={e => setPayRef(e.target.value)}
                  className="w-full p-2.5 border rounded-lg font-mono text-xs"
                  placeholder="e.g. MTN-MM-9982174"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Payment Method</label>
                <select
                  value={payMethod}
                  onChange={e => setPayMethod(e.target.value as any)}
                  className="w-full p-2.5 border rounded-lg"
                >
                  <option value="MoMo">Mobile Money (MTN/Telecel)</option>
                  <option value="Cash">Physical Cash</option>
                  <option value="Bank Transfer">GCB Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Deposit Account</label>
                <select
                  value={payAccountId}
                  onChange={e => setPayAccountId(e.target.value)}
                  className="w-full p-2.5 border rounded-lg"
                >
                  <option value="1120">1120 - MoMo Wallet (MTN)</option>
                  <option value="1100">1100 - Cash on Hand</option>
                  <option value="1110">1110 - Bank Account (GCB)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowRecordPaymentModal(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold">Record Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Record Expense Modal */}
      {showRecordExpenseModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-2xl max-w-md w-full space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-900">Record Operating Expense</h3>
            <form onSubmit={handleRecordExpenseSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Expense Category</label>
                <input
                  type="text"
                  required
                  value={expCategory}
                  onChange={e => setExpCategory(e.target.value)}
                  className="w-full p-2.5 border rounded-lg"
                  placeholder="e.g. Utilities, Fuel, Stationery"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Expense Description</label>
                <input
                  type="text"
                  required
                  value={expDesc}
                  onChange={e => setExpDesc(e.target.value)}
                  className="w-full p-2.5 border rounded-lg"
                  placeholder="e.g. ECG Campus Electricity Bill"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Amount (GH₵)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={expAmount}
                  onChange={e => setExpAmount(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 border rounded-lg font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Supplier / Payee Name</label>
                <input
                  type="text"
                  value={expSupplier}
                  onChange={e => setExpSupplier(e.target.value)}
                  className="w-full p-2.5 border rounded-lg"
                  placeholder="e.g. Electricity Company of Ghana"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Expense Account</label>
                  <select
                    value={expAccountId}
                    onChange={e => setExpAccountId(e.target.value)}
                    className="w-full p-2.5 border rounded-lg"
                  >
                    <option value="5400">5400 - Utilities</option>
                    <option value="5500">5500 - Transport & Fuel</option>
                    <option value="5600">5600 - Office Supplies</option>
                    <option value="5700">5700 - Repairs & Maintenance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Paid From Account</label>
                  <select
                    value={expPayAccountId}
                    onChange={e => setExpPayAccountId(e.target.value)}
                    className="w-full p-2.5 border rounded-lg"
                  >
                    <option value="1110">1110 - Bank Account (GCB)</option>
                    <option value="1100">1100 - Cash on Hand</option>
                    <option value="1120">1120 - MoMo Wallet</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowRecordExpenseModal(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-amber-600 text-white rounded-lg font-bold">Save Expense</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Record Supplier Bill Modal (AP) */}
      {showSupplierBillModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-2xl max-w-md w-full space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-900">Add Supplier Bill (Accounts Payable)</h3>
            <form onSubmit={handleRecordSupplierBillSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Supplier / Vendor Name</label>
                <input
                  type="text"
                  required
                  value={billSupplierName}
                  onChange={e => setBillSupplierName(e.target.value)}
                  className="w-full p-2.5 border rounded-lg"
                  placeholder="e.g. Accra Educational Books Ltd"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Bill / Invoice Number</label>
                  <input
                    type="text"
                    value={billNumber}
                    onChange={e => setBillNumber(e.target.value)}
                    className="w-full p-2.5 border rounded-lg font-mono"
                    placeholder="AEB-2026-091"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Due Date</label>
                  <input
                    type="date"
                    required
                    value={billDueDate}
                    onChange={e => setBillDueDate(e.target.value)}
                    className="w-full p-2.5 border rounded-lg"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-slate-600 font-semibold">Bill Line Item</label>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    className="col-span-2 p-2 border rounded-lg"
                    placeholder="Description"
                    value={billLines[0].description}
                    onChange={e => {
                      const updated = [...billLines];
                      updated[0].description = e.target.value;
                      setBillLines(updated);
                    }}
                  />
                  <input
                    type="number"
                    className="p-2 border rounded-lg"
                    placeholder="Unit Price"
                    value={billLines[0].unitPrice}
                    onChange={e => {
                      const updated = [...billLines];
                      updated[0].unitPrice = parseFloat(e.target.value) || 0;
                      setBillLines(updated);
                    }}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowSupplierBillModal(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded-lg font-bold">Save Supplier Bill</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Pay Supplier Bill Modal */}
      {showPayBillModal && selectedBillForPay && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-2xl max-w-md w-full space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-900">Pay Supplier Bill</h3>
            <p className="text-xs text-slate-500">Bill: {selectedBillForPay.billNumber} • {selectedBillForPay.supplierName}</p>

            <form onSubmit={handlePaySupplierBillSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Payment Amount (GH₵)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={payBillAmt}
                  onChange={e => setPayBillAmt(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 border rounded-lg font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Paid From Account</label>
                <select
                  value={payBillAccId}
                  onChange={e => setPayBillAccId(e.target.value)}
                  className="w-full p-2.5 border rounded-lg"
                >
                  <option value="1110">1110 - Bank Account (GCB)</option>
                  <option value="1100">1100 - Cash on Hand</option>
                  <option value="1120">1120 - MoMo Wallet</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowPayBillModal(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded-lg font-bold">Process Supplier Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Add Custom COA Account Modal */}
      {showAddCOAModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-2xl max-w-md w-full space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-900">Add Custom COA Account</h3>
            <form onSubmit={handleAddCOAAccountSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Account Code (Numeric ID)</label>
                <input
                  type="text"
                  required
                  value={newAccCode}
                  onChange={e => setNewAccCode(e.target.value)}
                  className="w-full p-2.5 border rounded-lg font-mono"
                  placeholder="e.g. 5950"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Account Name</label>
                <input
                  type="text"
                  required
                  value={newAccName}
                  onChange={e => setNewAccName(e.target.value)}
                  className="w-full p-2.5 border rounded-lg"
                  placeholder="e.g. Software Licenses & Hosting"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Account Type</label>
                  <select
                    value={newAccType}
                    onChange={e => setNewAccType(e.target.value as any)}
                    className="w-full p-2.5 border rounded-lg"
                  >
                    <option value="Asset">Asset</option>
                    <option value="Liability">Liability</option>
                    <option value="Equity">Equity</option>
                    <option value="Revenue">Revenue</option>
                    <option value="Expense">Expense</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Sub Type</label>
                  <select
                    value={newAccSubType}
                    onChange={e => setNewAccSubType(e.target.value as any)}
                    className="w-full p-2.5 border rounded-lg"
                  >
                    <option value="Current Asset">Current Asset</option>
                    <option value="Operating Expense">Operating Expense</option>
                    <option value="Administrative Expense">Administrative Expense</option>
                    <option value="Operating Revenue">Operating Revenue</option>
                    <option value="Current Liability">Current Liability</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAddCOAModal(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold">Create Account</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Inspect Account General Ledger Drawer */}
      {selectedLedgerAccount && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-2xl max-w-xl w-full space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">General Ledger History</h3>
                <p className="text-xs font-mono text-blue-700">Account [{selectedLedgerAccount.accountId}] {selectedLedgerAccount.name}</p>
              </div>
              <button onClick={() => setSelectedLedgerAccount(null)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <div className="text-xs space-y-2">
              <div className="flex justify-between bg-slate-50 p-2.5 rounded-lg border">
                <span>Current Account Balance:</span>
                <span className="font-mono font-bold text-slate-900">GH₵ {selectedLedgerAccount.currentBalance.toFixed(2)}</span>
              </div>

              <table className="w-full text-xs text-left border mt-2">
                <thead className="bg-slate-100 border-b">
                  <tr>
                    <th className="p-2">Date</th>
                    <th className="p-2">Ref</th>
                    <th className="p-2">Description</th>
                    <th className="p-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {journalEntries
                    .filter(je => je.lines.some(l => l.accountId === selectedLedgerAccount.accountId))
                    .map(je => {
                      const line = je.lines.find(l => l.accountId === selectedLedgerAccount.accountId);
                      return (
                        <tr key={je.entryId}>
                          <td className="p-2 text-slate-500">{je.date}</td>
                          <td className="p-2 font-mono font-semibold text-blue-700">{je.reference}</td>
                          <td className="p-2">{je.description}</td>
                          <td className="p-2 text-right font-mono font-bold">
                            {line?.type === 'debit' ? `+ GH₵ ${line.amount.toFixed(2)} (Dr)` : `- GH₵ ${line?.amount.toFixed(2)} (Cr)`}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 8. Inspect Voucher Modal */}
      {selectedJournalEntry && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-2xl max-w-lg w-full space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Journal Voucher Detail</h3>
                <p className="text-xs font-mono text-blue-700">{selectedJournalEntry.reference}</p>
              </div>
              <button onClick={() => setSelectedJournalEntry(null)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <div className="text-xs space-y-2">
              <p><span className="text-slate-500">Description:</span> <strong>{selectedJournalEntry.description}</strong></p>
              <p><span className="text-slate-500">Date Posted:</span> {selectedJournalEntry.date}</p>

              <table className="w-full text-xs text-left border mt-2">
                <thead className="bg-slate-100 border-b">
                  <tr>
                    <th className="p-2">Account Code & Name</th>
                    <th className="p-2 text-right">Debit (GH₵)</th>
                    <th className="p-2 text-right">Credit (GH₵)</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {selectedJournalEntry.lines.map((l, idx) => (
                    <tr key={idx}>
                      <td className="p-2">{l.accountId} - {l.accountName}</td>
                      <td className="p-2 text-right font-mono">{l.type === 'debit' ? l.amount.toFixed(2) : '-'}</td>
                      <td className="p-2 text-right font-mono">{l.type === 'credit' ? l.amount.toFixed(2) : '-'}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50 font-bold border-t">
                    <td className="p-2">Total Balance:</td>
                    <td className="p-2 text-right font-mono text-blue-700">GH₵ {selectedJournalEntry.totalDebit.toFixed(2)}</td>
                    <td className="p-2 text-right font-mono text-blue-700">GH₵ {selectedJournalEntry.totalCredit.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
