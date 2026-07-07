import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, DollarSign, Building, User, Loader2, TrendingUp } from 'lucide-react';
import api from '../../services/api';

const PRIORITY_BADGES = {
  'high':   'bg-red-500/10 text-red-400 border border-red-500/20',
  'medium': 'bg-orange-500/10 text-orange-400 border border-orange-500/20',
  'low':    'bg-slate-500/10 text-slate-400 border border-slate-500/20'
};

export default function ConvertedLeads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLeads = async () => {
    try {
      const res = await api.get('/leads?status=Won');
      if (res.data.success) setLeads(res.data.data || []);
    } catch (e) {
      console.error('Failed to load converted leads:', e);
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

  const totalValue = leads.reduce((sum, l) => sum + (l.estimatedValue || 0), 0);

  return (
    <div className="space-y-6 fade-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-white flex items-center gap-3">
            <CheckCircle2 className="h-7 w-7 text-green-400" />
            Converted Leads
          </h1>
          <p className="text-slate-400 text-sm mt-1">Successfully closed deals marked as Won</p>
        </div>
      </div>

      {/* Summary Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl p-5 border border-green-500/20 col-span-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-green-500/10 text-green-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Deals Won</span>
          </div>
          <p className="text-3xl font-bold font-display text-white">{leads.length}</p>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-emerald-500/20 sm:col-span-2">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Pipeline Value</span>
          </div>
          <p className="text-3xl font-bold font-display text-white">
            ${totalValue.toLocaleString()}
          </p>
          {leads.length > 0 && (
            <p className="text-xs text-slate-500 mt-1">
              Avg. ${Math.round(totalValue / leads.length).toLocaleString()} per deal
            </p>
          )}
        </div>
      </div>

      {/* Lead List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-7 w-7 text-brand-500 animate-spin" />
        </div>
      ) : leads.length === 0 ? (
        <div className="glass-panel rounded-3xl p-16 text-center border border-slate-800/60">
          <CheckCircle2 className="h-12 w-12 text-slate-700 mx-auto mb-4" />
          <h3 className="text-white font-semibold mb-2">No converted leads yet</h3>
          <p className="text-slate-500 text-sm">Mark a lead as "Won" to see it here.</p>
        </div>
      ) : (
        <div className="glass-panel rounded-3xl border border-slate-800/80 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-800/80 bg-slate-950/40">
                  <th className="text-left px-5 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Lead</th>
                  <th className="text-left px-5 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider hidden md:table-cell">Source</th>
                  <th className="text-left px-5 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Assigned To</th>
                  <th className="text-left px-5 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Value</th>
                  <th className="text-left px-5 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider hidden md:table-cell">Priority</th>
                  <th className="text-right px-5 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Closed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {leads.map(lead => (
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
                    <td className="px-5 py-4 hidden lg:table-cell">
                      <div className="flex items-center gap-2 text-slate-300">
                        <div className="w-6 h-6 rounded-lg bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center text-[9px] font-bold">
                          {lead.assignedTo?.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        {lead.assignedTo?.name || '—'}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-green-400 font-semibold">
                      ${(lead.estimatedValue || 0).toLocaleString()}
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${PRIORITY_BADGES[lead.priority]}`}>
                        {lead.priority}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right text-slate-500">
                      {new Date(lead.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
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
