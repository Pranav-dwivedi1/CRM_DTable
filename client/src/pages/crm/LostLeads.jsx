import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { XCircle, Building, Loader2, Filter } from 'lucide-react';
import api from '../../services/api';

const LOST_REASONS = ['All', 'Budget', 'No Response', 'Chose Competitor', 'Not a Fit', 'Other'];

const REASON_STYLES = {
  'Budget':            'bg-orange-500/10 text-orange-400 border border-orange-500/20',
  'No Response':       'bg-slate-500/10 text-slate-400 border border-slate-500/20',
  'Chose Competitor':  'bg-purple-500/10 text-purple-400 border border-purple-500/20',
  'Not a Fit':         'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
  'Other':             'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
};

const PRIORITY_BADGES = {
  'high':   'bg-red-500/10 text-red-400 border border-red-500/20',
  'medium': 'bg-orange-500/10 text-orange-400 border border-orange-500/20',
  'low':    'bg-slate-500/10 text-slate-400 border border-slate-500/20'
};

export default function LostLeads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterReason, setFilterReason] = useState('All');

  const fetchLeads = async () => {
    try {
      const res = await api.get('/leads?status=Lost');
      if (res.data.success) setLeads(res.data.data || []);
    } catch (e) {
      console.error('Failed to load lost leads:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();

    window.addEventListener('lead:statusChanged', fetchLeads);
    return () => {
      window.removeEventListener('lead:statusChanged', fetchLeads);
    };
  }, []);

  const filtered = filterReason === 'All'
    ? leads
    : leads.filter(l => l.lostReason === filterReason);

  // Reason breakdown for stats
  const reasonStats = LOST_REASONS.slice(1).map(r => ({
    reason: r,
    count: leads.filter(l => l.lostReason === r).length
  })).filter(s => s.count > 0);

  return (
    <div className="space-y-6 fade-up">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-display text-white flex items-center gap-3">
          <XCircle className="h-7 w-7 text-red-400" />
          Lost Leads
        </h1>
        <p className="text-slate-400 text-sm mt-1">Leads that were disqualified or dropped from the pipeline</p>
      </div>

      {/* Reason Breakdown */}
      {reasonStats.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {reasonStats.map(({ reason, count }) => (
            <button
              key={reason}
              onClick={() => setFilterReason(filterReason === reason ? 'All' : reason)}
              className={`glass-card rounded-xl p-4 border text-left transition-all ${
                filterReason === reason
                  ? 'border-brand-500/50 bg-brand-500/10'
                  : 'border-slate-800/60'
              }`}
            >
              <p className="text-lg font-bold font-display text-white">{count}</p>
              <p className="text-[10px] text-slate-400 mt-1 leading-tight">{reason}</p>
            </button>
          ))}
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="h-3.5 w-3.5 text-slate-500" />
        <span className="text-xs text-slate-500">Filter:</span>
        {LOST_REASONS.map(r => (
          <button
            key={r}
            onClick={() => setFilterReason(r)}
            className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-all ${
              filterReason === r
                ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
                : 'text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700'
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      {/* Lead List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-7 w-7 text-brand-500 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-panel rounded-3xl p-16 text-center border border-slate-800/60">
          <XCircle className="h-12 w-12 text-slate-700 mx-auto mb-4" />
          <h3 className="text-white font-semibold mb-2">
            {filterReason === 'All' ? 'No lost leads' : `No leads lost due to "${filterReason}"`}
          </h3>
          <p className="text-slate-500 text-sm">
            {filterReason !== 'All' && (
              <button onClick={() => setFilterReason('All')} className="text-brand-400 hover:underline">Clear filter</button>
            )}
          </p>
        </div>
      ) : (
        <div className="glass-panel rounded-3xl border border-slate-800/80 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-800/80 bg-slate-950/40">
                  <th className="text-left px-5 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Lead</th>
                  <th className="text-left px-5 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider hidden md:table-cell">Source</th>
                  <th className="text-left px-5 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Lost Reason</th>
                  <th className="text-left px-5 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Assigned To</th>
                  <th className="text-left px-5 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider hidden md:table-cell">Value</th>
                  <th className="text-left px-5 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider hidden md:table-cell">Priority</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {filtered.map(lead => (
                  <tr key={lead._id} className="hover:bg-slate-900/30 transition-colors group">
                    <td className="px-5 py-4">
                      <Link to={`/leads/${lead._id}`} className="group-hover:text-brand-400 transition-colors">
                        <p className="font-semibold text-white">{lead.name}</p>
                        {lead.clientCompanyName && (
                          <p className="text-slate-500 text-[10px] flex items-center gap-1 mt-0.5">
                            <Building className="h-3 w-3" /> {lead.clientCompanyName}
                          </p>
                        )}
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-slate-400 hidden md:table-cell">{lead.source}</td>
                    <td className="px-5 py-4">
                      {lead.lostReason ? (
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${REASON_STYLES[lead.lostReason] || 'bg-slate-500/10 text-slate-400'}`}>
                          {lead.lostReason}
                        </span>
                      ) : (
                        <span className="text-slate-600 italic">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell">
                      <div className="flex items-center gap-2 text-slate-300">
                        <div className="w-6 h-6 rounded-lg bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center text-[9px] font-bold">
                          {lead.assignedTo?.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        {lead.assignedTo?.name || '—'}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-300 hidden md:table-cell">
                      ${(lead.estimatedValue || 0).toLocaleString()}
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${PRIORITY_BADGES[lead.priority]}`}>
                        {lead.priority}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
