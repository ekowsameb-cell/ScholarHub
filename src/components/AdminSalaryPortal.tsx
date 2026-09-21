import React, { useState } from 'react';
import { UserCog, Send, FileSpreadsheet, Lock, Calculator, Search, X } from 'lucide-react';
import type { StaffCompensationProfile, SalaryApprovalRequest } from '../data/mockData';
import { dbSubmitSalaryApprovalRequest, dbRunMonthlyPayrollEngine } from '../dbAdapter';
import { calculateGhanaPayroll, SSNIT_MIN_INSURABLE_SALARY } from '../utils/payrollCompliance';
import { useAuth } from '../context/AuthContext';

interface Props {
  pendingApprovals: SalaryApprovalRequest[];
  staffProfiles: StaffCompensationProfile[];
  onReload: () => void;
}

export const AdminSalaryPortal: React.FC<Props> = ({
  pendingApprovals,
  staffProfiles,
  onReload
}) => {
  const { currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStaff, setSelectedStaff] = useState<StaffCompensationProfile | null>(null);
  const [proposedBase, setProposedBase] = useState<string>('');
  const [proposedAllowances, setProposedAllowances] = useState<string>('');
  const [justification, setJustification] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Engine run state
  const [showEngineModal, setShowEngineModal] = useState(false);
  const [payPeriod, setPayPeriod] = useState('2026-09');
  const [periodName, setPeriodName] = useState('September 2026');
  const [runningEngine, setRunningEngine] = useState(false);

  const filteredStaff = staffProfiles.filter(s =>
    s.staffName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.staffIdNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.graTin.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.ssnitNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openAdjustmentModal = (staff: StaffCompensationProfile) => {
    setSelectedStaff(staff);
    setProposedBase(staff.basicSalary.toString());
    setProposedAllowances((staff.allowancesTaxable || 0).toString());
    setJustification('');
  };

  const handleAdjustmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff) return;
    const baseNum = parseFloat(proposedBase);
    const allowNum = parseFloat(proposedAllowances) || 0;

    if (isNaN(baseNum) || baseNum < SSNIT_MIN_INSURABLE_SALARY) {
      alert(`Proposed Basic Salary cannot be below the SSNIT 2026 Statutory Floor of GH₵ ${SSNIT_MIN_INSURABLE_SALARY.toFixed(2)}`);
      return;
    }

    if (!justification.trim()) {
      alert('Please provide justification notes for the Proprietor/Owner review.');
      return;
    }

    setSubmitting(true);
    try {
      dbSubmitSalaryApprovalRequest({
        profileId: selectedStaff.id,
        staffId: selectedStaff.staffId,
        staffName: selectedStaff.staffName,
        staffIdNumber: selectedStaff.staffIdNumber,
        department: selectedStaff.department,
        requestedBy: currentUser?.uid || 'u-admin',
        currentBase: selectedStaff.basicSalary,
        proposedBase: baseNum,
        proposedAllowancesTaxable: allowNum,
        justification: justification.trim()
      });

      setStatusMsg({
        type: 'success',
        text: `✓ Salary adjustment request for ${selectedStaff.staffName} queued for Owner Authorization.`
      });
      setSelectedStaff(null);
      onReload();
    } catch (err) {
      console.error(err);
      setStatusMsg({ type: 'error', text: 'Failed to submit adjustment request.' });
    }
    setSubmitting(false);
  };

  const handleRunPayrollEngine = () => {
    setRunningEngine(true);
    try {
      const summary = dbRunMonthlyPayrollEngine(payPeriod, periodName);
      setStatusMsg({
        type: 'success',
        text: `✓ Successfully executed ${periodName} Payroll Engine! Processed ${summary.processedCount} staff accounts. Total Net: GH₵ ${summary.totalNet.toLocaleString()} | GRA PAYE Withheld: GH₵ ${summary.totalTax.toLocaleString()} | SSNIT Liability: GH₵ ${summary.totalSsnit.toLocaleString()}`
      });
      setShowEngineModal(false);
      onReload();
    } catch (err) {
      console.error(err);
      setStatusMsg({ type: 'error', text: 'Error running monthly payroll engine.' });
    }
    setRunningEngine(false);
  };

  // Preview calculation for adjustment modal
  const previewCalc = selectedStaff && !isNaN(parseFloat(proposedBase)) ? calculateGhanaPayroll({
    basicSalary: parseFloat(proposedBase),
    allowancesTaxable: parseFloat(proposedAllowances) || 0,
    allowancesNonTaxable: selectedStaff.allowancesNonTaxable || 0
  }) : null;

  return (
    <div className="space-y-8 animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 className="text-2xl font-bold text-slate-900" style={{ fontSize: '1.5rem', fontWeight: 800 }}>Salary Administration Console</h2>
          <p className="text-sm text-slate-500 mt-0.5" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Manage base payroll settings, monitor Act 766 compliance indicators, and track owner authorization states.
          </p>
        </div>
        <button
          onClick={() => setShowEngineModal(true)}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)', boxShadow: '0 4px 12px rgba(30, 58, 138, 0.25)' }}
        >
          <FileSpreadsheet size={16} /> Run Monthly Payroll Engine
        </button>
      </div>

      {statusMsg && (
        <div style={{
          padding: '0.85rem 1rem',
          borderRadius: 'var(--radius-sm)',
          background: statusMsg.type === 'success' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
          border: `1px solid ${statusMsg.type === 'success' ? '#22c55e' : '#ef4444'}`,
          color: statusMsg.type === 'success' ? '#22c55e' : '#ef4444',
          fontWeight: 600, fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <span>{statusMsg.text}</span>
          <button style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }} onClick={() => setStatusMsg(null)}>✕</button>
        </div>
      )}

      {/* Owner Authorization Workflow Alert Queue */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <h3 className="font-bold text-slate-900 text-base mb-4 flex items-center gap-2" style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Lock className="text-amber-500" size={18} color="#f59e0b" />
          Pending Proprietor Authorization Queue ({pendingApprovals.filter(p => p.status === 'Pending_Owner_Review').length})
        </h3>
        
        {pendingApprovals.filter(p => p.status === 'Pending_Owner_Review').length === 0 ? (
          <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            ✓ No pending salary authorization requests awaiting Owner action.
          </div>
        ) : (
          <div className="space-y-3" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {pendingApprovals.filter(p => p.status === 'Pending_Owner_Review').map((req) => (
              <div
                key={req.id}
                style={{
                  padding: '1rem',
                  background: 'rgba(245, 158, 11, 0.08)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.75rem'
                }}
              >
                <div>
                  <p style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                    {req.staffName} <span className="text-muted" style={{ fontWeight: 500, fontSize: '0.8rem' }}>({req.staffIdNumber} • {req.department})</span>
                  </p>
                  <p style={{ fontSize: '0.82rem', marginTop: '0.25rem', color: 'var(--text-secondary)' }}>
                    Proposed Salary Move: <span style={{ fontWeight: 700 }}>GH₵ {req.currentBase.toLocaleString()}</span> ➔ <span style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>GH₵ {req.proposedBase.toLocaleString()}</span>
                  </p>
                  <p style={{ fontSize: '0.78rem', fontStyle: 'italic', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    Reason: "{req.justification}"
                  </p>
                </div>
                <span style={{
                  background: 'rgba(245, 158, 11, 0.18)',
                  border: '1px solid rgba(245, 158, 11, 0.4)',
                  color: '#b45309',
                  fontSize: '0.75rem',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '4px',
                  fontWeight: 700
                }}>
                  Awaiting Owner Approval
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Core Staff Payroll Registry Table */}
      <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--glass-border)',
          background: 'var(--bg-secondary)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Institutional Compensation Mapping (Act 766)</h3>
            <p className="text-muted" style={{ fontSize: '0.78rem', marginTop: 2 }}>
              Statutory Floor: GH₵ {SSNIT_MIN_INSURABLE_SALARY.toFixed(2)} | Employee SSNIT 5.5% | Employer SSNIT 13.0%
            </p>
          </div>
          <div style={{ position: 'relative', width: '260px' }}>
            <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              className="input-field"
              placeholder="Search staff, TIN or SSNIT..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2rem', fontSize: '0.8rem', height: '36px' }}
            />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)', borderBottom: '1px solid var(--glass-border)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '0.85rem 1rem' }}>Staff Identity</th>
                <th style={{ padding: '0.85rem 1rem' }}>GRA TIN / SSNIT</th>
                <th style={{ padding: '0.85rem 1rem' }}>Bank &amp; Account</th>
                <th style={{ padding: '0.85rem 1rem' }}>Monthly Basic</th>
                <th style={{ padding: '0.85rem 1rem' }}>Taxable Allowances</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStaff.map((staff) => (
                <tr key={staff.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{staff.staffName}</div>
                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>{staff.staffIdNumber} • {staff.role} ({staff.department})</div>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace', fontSize: '0.78rem' }}>
                    <div><span className="text-muted">TIN:</span> {staff.graTin}</div>
                    <div className="text-muted">SSNIT: {staff.ssnitNumber}</div>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.8rem' }}>
                    <div style={{ fontWeight: 600 }}>{staff.bankName}</div>
                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>{staff.accountNumber}</div>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    GH₵ {staff.basicSalary.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>
                    GH₵ {(staff.allowancesTaxable || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                    <button
                      onClick={() => openAdjustmentModal(staff)}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      <UserCog size={13} /> Adjust Pay Scale
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Adjust Pay Scale Request Form */}
      {selectedStaff && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem'
        }}>
          <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '580px', padding: '1.75rem', background: 'var(--bg-primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Adjust Pay Scale Scale</h3>
                <p className="text-muted" style={{ fontSize: '0.8rem' }}>Submits formal proposal to Proprietor Authorization Queue</p>
              </div>
              <button
                onClick={() => setSelectedStaff(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '0.85rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', marginBottom: '1rem' }}>
              <div style={{ fontWeight: 700 }}>{selectedStaff.staffName}</div>
              <div className="text-muted" style={{ fontSize: '0.78rem' }}>
                ID: {selectedStaff.staffIdNumber} • Role: {selectedStaff.role} ({selectedStaff.department})
              </div>
              <div style={{ fontSize: '0.8rem', marginTop: '0.35rem' }}>
                Current Basic: <strong>GH₵ {selectedStaff.basicSalary.toLocaleString()}</strong> | Taxable Allowances: <strong>GH₵ {(selectedStaff.allowancesTaxable || 0).toLocaleString()}</strong>
              </div>
            </div>

            <form onSubmit={handleAdjustmentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                    Proposed Basic Salary (GH₵)*:
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min={SSNIT_MIN_INSURABLE_SALARY}
                    className="input-field"
                    value={proposedBase}
                    onChange={e => setProposedBase(e.target.value)}
                    required
                  />
                  <span className="text-muted" style={{ fontSize: '0.7rem' }}>SSNIT baseline min: GH₵ {SSNIT_MIN_INSURABLE_SALARY.toFixed(2)}</span>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                    Proposed Taxable Allowances (GH₵):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="input-field"
                    value={proposedAllowances}
                    onChange={e => setProposedAllowances(e.target.value)}
                  />
                </div>
              </div>

              {previewCalc && (
                <div style={{ padding: '0.75rem', background: 'rgba(99,102,241,0.08)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(99,102,241,0.25)', fontSize: '0.78rem' }}>
                  <div style={{ fontWeight: 700, color: 'var(--accent-primary)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Calculator size={14} /> Live Statutory Simulation (Act 766 &amp; GRA PAYE):
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                    <div>Gross: <strong>GH₵ {previewCalc.grossSalary.toFixed(2)}</strong></div>
                    <div>SSNIT (5.5%): <strong>GH₵ {previewCalc.deductionSsnitEmployee.toFixed(2)}</strong></div>
                    <div>GRA PAYE: <strong>GH₵ {previewCalc.graPayeWithheld.toFixed(2)}</strong></div>
                  </div>
                  <div style={{ marginTop: '0.35rem', color: '#16a34a', fontWeight: 700 }}>
                    Estimated Net Payout: GH₵ {previewCalc.netSalaryPayout.toFixed(2)}
                  </div>
                </div>
              )}

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                  Justification &amp; Performance Review Notes for Proprietor*:
                </label>
                <textarea
                  className="input-field"
                  rows={3}
                  placeholder="State credentials completed, added responsibilities, or annual review outcome..."
                  value={justification}
                  onChange={e => setJustification(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelectedStaff(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <Send size={15} /> {submitting ? 'Submitting...' : 'Submit to Owner Queue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Run Monthly Payroll Engine */}
      {showEngineModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem'
        }}>
          <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '520px', padding: '1.75rem', background: 'var(--bg-primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileSpreadsheet size={20} color="var(--accent-primary)" /> Execute Monthly Payroll Engine
                </h3>
                <p className="text-muted" style={{ fontSize: '0.8rem' }}>Processes SSNIT Tier 1 &amp; Tier 2, GRA PAYE, and publishes ledger</p>
              </div>
              <button
                onClick={() => setShowEngineModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                  Pay Period (YYYY-MM):
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={payPeriod}
                  onChange={e => setPayPeriod(e.target.value)}
                  placeholder="e.g. 2026-09"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                  Display Period Name:
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={periodName}
                  onChange={e => setPeriodName(e.target.value)}
                  placeholder="e.g. September 2026"
                />
              </div>

              <div style={{ padding: '0.85rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem' }}>
                <div style={{ fontWeight: 700, marginBottom: '0.35rem' }}>Engine Batch Specifications:</div>
                <div className="text-muted">• Target Active Staff: {staffProfiles.length} profiles</div>
                <div className="text-muted">• Pension Model: Act 766 (5.5% Employee / 13.0% Employer)</div>
                <div className="text-muted">• Tax Assessment: 2026 Graduated GRA PAYE Brackets (0% - 35%)</div>
                <div className="text-muted">• Dispatch: Generates and publishes official payslips to Employee Vaults</div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowEngineModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={runningEngine}
                  onClick={handleRunPayrollEngine}
                  style={{ background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)' }}
                >
                  {runningEngine ? 'Executing Engine...' : 'Run & Publish Payroll Batch'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
