import React, { useState } from 'react';
import { Check, X } from 'lucide-react';
import type { SalaryApprovalRequest } from '../data/mockData';
import { dbProcessSalaryApprovalRequest } from '../dbAdapter';
import { useAuth } from '../context/AuthContext';

interface Props {
  pendingRequests: SalaryApprovalRequest[];
  onReload: () => void;
}

export const OwnerApprovalSection: React.FC<Props> = ({
  pendingRequests,
  onReload
}) => {
  const { currentUser } = useAuth();
  const [remarksMap, setRemarksMap] = useState<Record<string, string>>({});
  const [actioningId, setActioningId] = useState<string | null>(null);

  const activePending = pendingRequests.filter(r => r.status === 'Pending_Owner_Review');

  const handleProcess = (requestId: string, status: 'Approved_By_Owner' | 'Rejected_By_Owner') => {
    setActioningId(requestId);
    const remark = remarksMap[requestId] || (status === 'Approved_By_Owner' ? 'Approved by Proprietor' : 'Declined by Proprietor');
    dbProcessSalaryApprovalRequest(requestId, status, currentUser?.uid || 'u-owner', remark);
    setActioningId(null);
    onReload();
  };

  if (activePending.length === 0) {
    return null; // Do not clutter when no pending salary approvals
  }

  return (
    <div className="glass-card animate-fade-in" style={{
      padding: '1.5rem',
      border: '2px solid var(--accent-primary)',
      background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(168,85,247,0.06))',
      boxShadow: '0 8px 24px rgba(99,102,241,0.15)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
        <div>
          <span style={{
            background: 'var(--accent-primary)',
            color: '#fff',
            fontSize: '0.72rem',
            padding: '0.25rem 0.65rem',
            borderRadius: '4px',
            fontWeight: 800,
            letterSpacing: '0.5px',
            textTransform: 'uppercase'
          }}>
            Proprietor Action Required
          </span>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.5rem' }}>
            Executive Payroll Authorization Board
          </h3>
          <p className="text-muted" style={{ fontSize: '0.8rem' }}>
            {activePending.length} pending base salary adjustment proposals submitted by HR/Admin for executive approval.
          </p>
        </div>
      </div>

      <div className="divide-y divide-slate-100" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {activePending.map((req) => (
          <div
            key={req.id}
            style={{
              padding: '1.25rem',
              background: 'var(--bg-primary)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--glass-border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <p style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)' }}>{req.staffName}</p>
                <p className="text-muted" style={{ fontSize: '0.78rem' }}>
                  ID: {req.staffIdNumber} • Departmental Scale: <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{req.department}</span>
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.88rem', fontWeight: 700 }}>
                  Change Base: <span className="text-muted">GH₵ {req.currentBase.toLocaleString()}</span> ➔ <span style={{ color: 'var(--accent-primary)', fontSize: '1rem' }}>GH₵ {req.proposedBase.toLocaleString()}</span>
                </span>
                {req.proposedAllowancesTaxable > 0 && (
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                    + Allowances: GH₵ {req.proposedAllowancesTaxable.toLocaleString()}
                  </div>
                )}
              </div>
            </div>

            <div style={{ padding: '0.65rem 0.85rem', background: 'var(--bg-secondary)', borderRadius: '4px', fontSize: '0.8rem', fontStyle: 'italic', borderLeft: '3px solid var(--accent-primary)' }}>
              <strong>Admin Justification:</strong> "{req.justification}"
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', marginTop: '0.25rem' }}>
              <input
                className="input-field"
                placeholder="Optional proprietor remarks / conditions..."
                value={remarksMap[req.id] || ''}
                onChange={e => setRemarksMap({ ...remarksMap, [req.id]: e.target.value })}
                style={{ flex: 1, minWidth: '220px', fontSize: '0.8rem', height: '34px' }}
              />
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => handleProcess(req.id, 'Approved_By_Owner')}
                  disabled={actioningId === req.id}
                  className="btn btn-primary"
                  style={{ fontSize: '0.78rem', padding: '0.4rem 0.85rem', background: '#16a34a', borderColor: '#16a34a', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <Check size={14} /> Authorize Increase
                </button>
                <button
                  onClick={() => handleProcess(req.id, 'Rejected_By_Owner')}
                  disabled={actioningId === req.id}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.78rem', padding: '0.4rem 0.85rem', color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <X size={14} /> Decline Change
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
