import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronRight, DollarSign, Calendar, Building } from 'lucide-react';
import LostReasonModal from './LostReasonModal';

const PRIORITY_STYLES = {
  high:   'bg-red-500/10 text-red-400 border border-red-500/20',
  medium: 'bg-orange-500/10 text-orange-400 border border-orange-500/20',
  low:    'bg-slate-500/10 text-slate-400 border border-slate-500/20'
};

const STATUS_STYLES = {
  'New':           'bg-blue-500/10 text-blue-400',
  'Contacted':     'bg-indigo-500/10 text-indigo-400',
  'Qualified':     'bg-purple-500/10 text-purple-400',
  'Proposal Sent': 'bg-yellow-500/10 text-yellow-400',
  'Won':           'bg-green-500/10 text-green-400',
  'Lost':          'bg-red-500/10 text-red-400'
};

/**
 * Mobile fallback: stacked list view grouped by status.
 * Each lead card has a "Change Stage" dropdown.
 *
 * Props:
 *  - leads           : Lead[]
 *  - statuses        : string[] (ordered list from company settings)
 *  - onStatusChange  : ({ id, status, lostReason?, oldStatus }) => Promise<void>
 *  - isChanging      : string | null (leadId currently being changed)
 */
export default function MobileLeadList({ leads, statuses, onStatusChange, isChanging }) {
  const [openSections, setOpenSections] = useState(() => {
    const init = {};
    statuses.forEach(s => { init[s] = true; });
    return init;
  });
  const [pendingChange, setPendingChange] = useState(null); // { lead, newStatus }

  const toggleSection = (status) => {
    setOpenSections(prev => ({ ...prev, [status]: !prev[status] }));
  };

  const handleDropdownChange = (lead, newStatus) => {
    if (newStatus === lead.status || !newStatus) return;
    if (newStatus === 'Lost') {
      setPendingChange({ lead, newStatus });
    } else {
      onStatusChange({ id: lead._id, status: newStatus, oldStatus: lead.status });
    }
  };

  const handleLostConfirm = (lostReason) => {
    if (!pendingChange) return;
    const { lead, newStatus } = pendingChange;
    onStatusChange({ id: lead._id, status: newStatus, lostReason, oldStatus: lead.status });
    setPendingChange(null);
  };

  const grouped = {};
  statuses.forEach(s => { grouped[s] = []; });
  leads.forEach(lead => {
    if (grouped[lead.status] !== undefined) {
      grouped[lead.status].push(lead);
    }
  });

  return (
    <div className="space-y-4">
      {statuses.map(status => {
        const sectionLeads = grouped[status] || [];
        const isOpen = openSections[status] !== false;
        const totalValue = sectionLeads.reduce((s, l) => s + (l.estimatedValue || 0), 0);

        return (
          <div key={status} className="glass-panel rounded-2xl border border-slate-800/80 overflow-hidden">
            {/* Section Header */}
            <button
              onClick={() => toggleSection(status)}
              className="w-full flex items-center justify-between px-4 py-3.5 border-b border-slate-800/60 hover:bg-slate-900/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                {isOpen ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${STATUS_STYLES[status] || 'bg-slate-500/10 text-slate-400'}`}>
                  {status}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">{sectionLeads.length} lead{sectionLeads.length !== 1 ? 's' : ''}</span>
              </div>
              {totalValue > 0 && (
                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                  <DollarSign className="h-3 w-3" />
                  {totalValue.toLocaleString()}
                </div>
              )}
            </button>

            {/* Cards */}
            {isOpen && (
              <div className="p-3 space-y-3">
                {sectionLeads.length === 0 ? (
                  <p className="text-center text-[10px] text-slate-600 italic py-4">No leads in this stage</p>
                ) : (
                  sectionLeads.map(lead => (
                    <div key={lead._id} className="glass-card rounded-xl p-4 border border-slate-800/60 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <Link
                            to={`/leads/${lead._id}`}
                            className="text-sm font-semibold text-white hover:text-brand-400 transition-colors leading-snug line-clamp-1"
                          >
                            {lead.name}
                          </Link>
                          {lead.clientCompanyName && (
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                              <Building className="h-3 w-3" />
                              {lead.clientCompanyName}
                            </div>
                          )}
                        </div>
                        <span className={`shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${PRIORITY_STYLES[lead.priority]}`}>
                          {lead.priority}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        {lead.estimatedValue > 0 && (
                          <div className="flex items-center gap-1 text-brand-400 font-semibold">
                            <DollarSign className="h-3 w-3" />
                            {lead.estimatedValue.toLocaleString()}
                          </div>
                        )}
                        {lead.followUpDate && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(lead.followUpDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </div>
                        )}
                      </div>

                      {/* Stage Change Dropdown */}
                      <div className="border-t border-slate-800/50 pt-3">
                        <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Change Stage</label>
                        <select
                          value={lead.status}
                          onChange={e => handleDropdownChange(lead, e.target.value)}
                          disabled={isChanging === lead._id}
                          className="glass-input w-full px-3 py-2 rounded-xl text-xs disabled:opacity-50"
                        >
                          {statuses.map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                        {isChanging === lead._id && (
                          <p className="text-[10px] text-brand-400 mt-1 animate-pulse">Updating...</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Lost Reason Modal */}
      {pendingChange && (
        <LostReasonModal
          leadName={pendingChange.lead.name}
          onConfirm={handleLostConfirm}
          onCancel={() => setPendingChange(null)}
          loading={isChanging === pendingChange.lead._id}
        />
      )}
    </div>
  );
}
