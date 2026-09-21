import React, { useState } from 'react';
import { Eye, Printer, CalendarRange, X } from 'lucide-react';
import type { PayrollHistoricalLedgerItem } from '../data/mockData';
import { printEmployeePayslip } from '../utils/payrollCompliance';

interface Props {
  payslipHistory: PayrollHistoricalLedgerItem[];
}

export const StaffPayslipVault: React.FC<Props> = ({ payslipHistory }) => {
  const [selectedSlip, setSelectedSlip] = useState<PayrollHistoricalLedgerItem | null>(null);

  const handlePrint = (slip: PayrollHistoricalLedgerItem) => {
    printEmployeePayslip({
      staffName: slip.staffName,
      staffIdNumber: slip.staffIdNumber,
      role: slip.role,
      department: slip.department,
      graTin: slip.graTin,
      ssnitNumber: slip.ssnitNumber,
      bankName: slip.bankName,
      bankBranch: slip.bankBranch,
      accountNumber: slip.accountNumber,
      payPeriodMonthYear: slip.periodName || slip.payPeriodMonthYear,
      basicSalary: slip.basicSalarySnapshot,
      taxableAllowances: slip.taxableAllowancesSnapshot,
      nonTaxableAllowances: slip.nonTaxableAllowancesSnapshot,
      grossSalary: slip.grossSalary,
      deductionSsnitEmployee: slip.deductionSsnitEmployee,
      contributionSsnitEmployer: slip.contributionSsnitEmployer,
      graPayeWithheld: slip.graPayeWithheld,
      otherDeductionsWelfare: slip.otherDeductionsWelfare,
      netSalaryPayout: slip.netSalaryPayout,
      generatedAt: slip.generatedAt
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 className="text-2xl font-bold text-slate-900" style={{ fontSize: '1.5rem', fontWeight: 800 }}>My Compensation Portal</h2>
          <p className="text-sm text-slate-500 mt-0.5" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Securely view, track, or generate official physical printouts of your historical monthly payslips (Act 766 &amp; GRA compliant).
          </p>
        </div>
      </div>

      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--glass-border)',
          background: 'var(--bg-secondary)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <CalendarRange className="text-slate-400" size={18} color="var(--accent-primary)" />
          <h3 className="font-bold text-slate-900 text-sm" style={{ fontSize: '0.95rem', fontWeight: 700 }}>
            Personal Earnings Archive ({payslipHistory.length} published records)
          </h3>
        </div>

        {payslipHistory.length === 0 ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <p>No monthly payslip records have been published to your portal yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100" style={{ display: 'flex', flexDirection: 'column' }}>
            {payslipHistory.map((slip) => (
              <div
                key={slip.id}
                style={{
                  padding: '1.25rem 1.5rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  borderBottom: '1px solid var(--glass-border)',
                  transition: 'background 0.2s'
                }}
              >
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                    {slip.periodName || slip.payPeriodMonthYear}
                  </div>
                  <div style={{ fontSize: '0.82rem', marginTop: '0.25rem', color: 'var(--text-muted)' }}>
                    Gross: GH₵ {slip.grossSalary.toLocaleString(undefined, { minimumFractionDigits: 2 })} • 
                    SSNIT (5.5%): GH₵ {slip.deductionSsnitEmployee.toFixed(2)} • 
                    GRA Tax: GH₵ {slip.graPayeWithheld.toFixed(2)}
                  </div>
                  <div style={{ fontSize: '0.88rem', marginTop: '0.25rem' }}>
                    Net Disbursed: <span style={{ fontWeight: 800, color: '#16a34a' }}>GH₵ {slip.netSalaryPayout.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setSelectedSlip(slip)}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.78rem', padding: '0.4rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <Eye size={14} /> View Details
                  </button>
                  <button
                    onClick={() => handlePrint(slip)}
                    className="btn btn-primary"
                    style={{ fontSize: '0.78rem', padding: '0.4rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)' }}
                  >
                    <Printer size={14} /> Generate &amp; Print PDF
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* DETAIL DRAWER / MODAL */}
      {selectedSlip && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem'
        }}>
          <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '640px', padding: '1.75rem', background: 'var(--bg-primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Payslip Breakdown — {selectedSlip.periodName}</h3>
                <p className="text-muted" style={{ fontSize: '0.8rem' }}>Audited &amp; Published Institutional Record</p>
              </div>
              <button
                onClick={() => setSelectedSlip(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Staff Credentials Grid */}
            <div style={{ padding: '0.85rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', fontSize: '0.8rem', marginBottom: '1rem' }}>
              <div><strong>Staff:</strong> {selectedSlip.staffName}</div>
              <div><strong>ID:</strong> {selectedSlip.staffIdNumber}</div>
              <div><strong>TIN:</strong> {selectedSlip.graTin}</div>
              <div><strong>SSNIT:</strong> {selectedSlip.ssnitNumber}</div>
              <div><strong>Bank:</strong> {selectedSlip.bankName}</div>
              <div><strong>Account:</strong> {selectedSlip.accountNumber}</div>
            </div>

            {/* Itemized Table */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              {/* Earnings */}
              <div style={{ border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)', padding: '0.75rem', background: 'var(--bg-secondary)' }}>
                <div style={{ fontWeight: 700, fontSize: '0.82rem', marginBottom: '0.5rem', color: 'var(--accent-primary)' }}>EARNINGS</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '0.2rem 0' }}>
                  <span>Basic Salary:</span>
                  <span>GH₵ {selectedSlip.basicSalarySnapshot.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '0.2rem 0' }}>
                  <span>Taxable Allowances:</span>
                  <span>GH₵ {selectedSlip.taxableAllowancesSnapshot.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '0.2rem 0' }}>
                  <span>Non-Taxable:</span>
                  <span>GH₵ {selectedSlip.nonTaxableAllowancesSnapshot.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700, borderTop: '1px solid var(--glass-border)', paddingTop: '0.35rem', marginTop: '0.35rem' }}>
                  <span>Gross Pay:</span>
                  <span>GH₵ {selectedSlip.grossSalary.toFixed(2)}</span>
                </div>
              </div>

              {/* Deductions */}
              <div style={{ border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)', padding: '0.75rem', background: 'var(--bg-secondary)' }}>
                <div style={{ fontWeight: 700, fontSize: '0.82rem', marginBottom: '0.5rem', color: '#ef4444' }}>DEDUCTIONS</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '0.2rem 0' }}>
                  <span>SSNIT (5.5%):</span>
                  <span>GH₵ {selectedSlip.deductionSsnitEmployee.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '0.2rem 0' }}>
                  <span>GRA PAYE Tax:</span>
                  <span>GH₵ {selectedSlip.graPayeWithheld.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '0.2rem 0' }}>
                  <span>Welfare Fund:</span>
                  <span>GH₵ {selectedSlip.otherDeductionsWelfare.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700, borderTop: '1px solid var(--glass-border)', paddingTop: '0.35rem', marginTop: '0.35rem' }}>
                  <span>Total Deducted:</span>
                  <span>GH₵ {(selectedSlip.deductionSsnitEmployee + selectedSlip.graPayeWithheld + selectedSlip.otherDeductionsWelfare).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Net Payout Banner */}
            <div style={{ padding: '1rem', background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)', color: '#fff', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700, opacity: 0.9 }}>Net Salary Disbursed</div>
                <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Remitted to {selectedSlip.bankName}</div>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, fontFamily: 'monospace' }}>
                GH₵ {selectedSlip.netSalaryPayout.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setSelectedSlip(null)}
              >
                Close
              </button>
              <button
                className="btn btn-primary"
                onClick={() => { handlePrint(selectedSlip); }}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)' }}
              >
                <Printer size={15} /> Generate &amp; Print Official PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
