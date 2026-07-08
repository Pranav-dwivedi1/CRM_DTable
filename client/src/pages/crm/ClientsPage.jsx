import React, { useContext, useEffect, useState, useCallback } from "react";
import {
  UserCheck, Search, Filter, Loader2, XCircle, DollarSign,
  Building, ChevronDown, Trash2, Edit2, Eye, CheckCircle2, X, Save
} from "lucide-react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import { AuthContext } from "../../context/AuthContext";

const PRIORITY_BADGES = {
  high:   "bg-red-500/10 text-red-400 border-red-500/20",
  medium: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  low:    "bg-slate-500/10 text-slate-400 border-slate-500/20",
};

const SOURCE_OPTIONS = ["Website", "Referral", "LinkedIn", "Cold Call", "Email Campaign", "Other"];
const PRIORITY_OPTIONS = ["high", "medium", "low"];

function EditModal({ lead, onClose, onSave }) {
  const [form, setForm] = useState({
    name: lead.name || "",
    email: lead.email || "",
    phone: lead.phone || "",
    source: lead.source || "",
    priority: lead.priority || "medium",
    estimatedValue: lead.estimatedValue || "",
    notes: lead.notes || "",
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put(`/leads/${lead._id}`, form);
      if (res.data.success) onSave(res.data.data);
    } catch (err) {
      console.error("Failed to update client:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="glass-panel rounded-3xl border border-slate-700 p-6 w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white">Edit Client</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-all">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Full Name</label>
              <input name="name" value={form.name} onChange={handleChange} required
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500/30 transition-all" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email</label>
              <input name="email" value={form.email} onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:border-brand-500 focus:outline-none transition-all" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Phone</label>
              <input name="phone" value={form.phone} onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:border-brand-500 focus:outline-none transition-all" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Estimated Value ($)</label>
              <input name="estimatedValue" type="number" value={form.estimatedValue} onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:border-brand-500 focus:outline-none transition-all" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Source</label>
              <select name="source" value={form.source} onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:border-brand-500 focus:outline-none transition-all">
                {SOURCE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Priority</label>
              <select name="priority" value={form.priority} onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:border-brand-500 focus:outline-none transition-all">
                {PRIORITY_OPTIONS.map(p => <option key={p} value={p} className="capitalize">{p}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Notes</label>
            <textarea name="notes" value={form.notes} onChange={handleChange} rows={3}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:border-brand-500 focus:outline-none resize-none transition-all" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-400 text-sm hover:bg-slate-800 hover:text-white transition-all">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 text-white text-sm font-semibold shadow-lg shadow-brand-500/20 hover:shadow-brand-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ClientsPage() {
  const { user } = useContext(AuthContext);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterSource, setFilterSource] = useState("");
  const [sortBy, setSortBy] = useState("updatedAt");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editLead, setEditLead] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const limit = 12;

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        status: "Won",
        page,
        limit,
        sortBy,
        sortDir,
        ...(search && { search }),
        ...(filterPriority && { priority: filterPriority }),
        ...(filterSource && { source: filterSource }),
      });
      const res = await api.get(`/leads?${params}`);
      if (res.data.success) {
        setClients(res.data.data || []);
        setTotalPages(res.data.totalPages || 1);
      }
    } catch (err) {
      console.error("Failed to load clients:", err);
    } finally {
      setLoading(false);
    }
  }, [page, search, filterPriority, filterSource, sortBy, sortDir]);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this client permanently? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      await api.delete(`/leads/${id}`);
      setClients(c => c.filter(x => x._id !== id));
    } catch (err) {
      console.error("Failed to delete client:", err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleSaveEdit = (updated) => {
    setClients(c => c.map(x => x._id === updated._id ? updated : x));
    setEditLead(null);
  };

  const totalValue = clients.reduce((s, c) => s + (c.estimatedValue || 0), 0);

  return (
    <div className="space-y-6 fade-up">
      {editLead && <EditModal lead={editLead} onClose={() => setEditLead(null)} onSave={handleSaveEdit} />}

      {/* Header */}
      <div className="glass-panel rounded-3xl border border-slate-800 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-white flex items-center gap-3">
            <UserCheck className="h-7 w-7 text-emerald-400" />
            Clients
          </h1>
          <p className="text-slate-400 text-sm mt-1">All won deals — your converted clients.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="glass-card rounded-xl border border-emerald-500/20 px-4 py-2 flex items-center gap-3">
            <DollarSign className="h-4 w-4 text-emerald-400" />
            <div>
              <p className="text-[9px] text-slate-500 uppercase font-bold">Total Value</p>
              <p className="text-sm font-bold text-white">${totalValue.toLocaleString()}</p>
            </div>
          </div>
          <div className="glass-card rounded-xl border border-emerald-500/20 px-4 py-2 flex items-center gap-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <div>
              <p className="text-[9px] text-slate-500 uppercase font-bold">Total Clients</p>
              <p className="text-sm font-bold text-white">{clients.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Row */}
      <div className="flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search clients by name, email, company…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500/30 transition-all"
          />
        </div>

        {/* Priority Filter */}
        <select value={filterPriority} onChange={e => { setFilterPriority(e.target.value); setPage(1); }}
          className="px-3 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-white text-sm focus:border-brand-500 focus:outline-none transition-all min-w-[130px]">
          <option value="">All Priorities</option>
          {PRIORITY_OPTIONS.map(p => <option key={p} value={p} className="capitalize">{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
        </select>

        {/* Source Filter */}
        <select value={filterSource} onChange={e => { setFilterSource(e.target.value); setPage(1); }}
          className="px-3 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-white text-sm focus:border-brand-500 focus:outline-none transition-all min-w-[140px]">
          <option value="">All Sources</option>
          {SOURCE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        {/* Sort */}
        <select value={`${sortBy}:${sortDir}`}
          onChange={e => {
            const [sb, sd] = e.target.value.split(":");
            setSortBy(sb); setSortDir(sd); setPage(1);
          }}
          className="px-3 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-white text-sm focus:border-brand-500 focus:outline-none transition-all min-w-[160px]">
          <option value="updatedAt:desc">Latest First</option>
          <option value="updatedAt:asc">Oldest First</option>
          <option value="estimatedValue:desc">Highest Value</option>
          <option value="estimatedValue:asc">Lowest Value</option>
          <option value="name:asc">Name A-Z</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 text-brand-500 animate-spin" />
        </div>
      ) : clients.length === 0 ? (
        <div className="glass-panel rounded-3xl border border-slate-800/60 p-16 text-center">
          <UserCheck className="h-12 w-12 text-slate-700 mx-auto mb-4" />
          <h3 className="text-white font-semibold mb-2">No clients found</h3>
          <p className="text-slate-500 text-sm">Mark leads as "Won" to see them here as clients.</p>
        </div>
      ) : (
        <div className="glass-panel rounded-3xl border border-slate-800/80 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-800/80 bg-slate-950/40">
                  <th className="text-left px-5 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Client</th>
                  <th className="text-left px-5 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider hidden md:table-cell">Contact</th>
                  <th className="text-left px-5 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Assigned To</th>
                  <th className="text-left px-5 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Value</th>
                  <th className="text-left px-5 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider hidden md:table-cell">Priority</th>
                  <th className="text-left px-5 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider hidden xl:table-cell">Source</th>
                  <th className="text-right px-5 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {clients.map(client => (
                  <tr key={client._id} className="hover:bg-slate-900/30 transition-colors group">
                    <td className="px-5 py-4">
                      <Link to={`/leads/${client._id}`} className="group-hover:text-brand-400 transition-colors">
                        <p className="font-semibold text-white">{client.name}</p>
                        {client.clientCompanyName && (
                          <p className="text-slate-500 text-[10px] flex items-center gap-1 mt-0.5">
                            <Building className="h-3 w-3" /> {client.clientCompanyName}
                          </p>
                        )}
                      </Link>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <p className="text-slate-300">{client.email || "—"}</p>
                      <p className="text-slate-500 text-[10px]">{client.phone || ""}</p>
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell">
                      <div className="flex items-center gap-2 text-slate-300">
                        <div className="w-6 h-6 rounded-lg bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center text-[9px] font-bold">
                          {client.assignedTo?.name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        {client.assignedTo?.name || "—"}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-green-400 font-semibold">
                      ${(client.estimatedValue || 0).toLocaleString()}
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${PRIORITY_BADGES[client.priority]}`}>
                        {client.priority}
                      </span>
                    </td>
                    <td className="px-5 py-4 hidden xl:table-cell text-slate-400">{client.source}</td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link to={`/leads/${client._id}`}
                          className="p-1.5 rounded-lg hover:bg-slate-700/60 text-slate-400 hover:text-white transition-all" title="View">
                          <Eye className="h-3.5 w-3.5" />
                        </Link>
                        {(user?.role === "masterAdmin" || user?.role === "manager") && (
                          <button onClick={() => setEditLead(client)}
                            className="p-1.5 rounded-lg hover:bg-brand-500/10 text-slate-400 hover:text-brand-400 transition-all" title="Edit">
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {user?.role === "masterAdmin" && (
                          <button onClick={() => handleDelete(client._id)} disabled={deletingId === client._id}
                            className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-all" title="Delete">
                            {deletingId === client._id
                              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              : <Trash2 className="h-3.5 w-3.5" />}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-800">
              <p className="text-xs text-slate-500">Page {page} of {totalPages}</p>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                  Previous
                </button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
