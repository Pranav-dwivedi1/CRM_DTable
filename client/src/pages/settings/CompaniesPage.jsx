import React, { useState, useEffect } from 'react';
import {
  Building2, Plus, Edit3, Trash2, Globe, Clock, Users, Target,
  DollarSign, Calendar, Eye, Loader2, ArrowLeft, Check, AlertCircle, Save, X
} from 'lucide-react';
import api from '../../services/api';

const TIMEZONES = [
  'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Kolkata', 'Asia/Dubai',
  'Asia/Singapore', 'Asia/Tokyo', 'Australia/Sydney'
];

function CompanyModal({ company, onClose, onSave }) {
  const [form, setForm] = useState({
    name: company?.name || '',
    timezone: company?.timezone || 'UTC',
    leadSources: company?.leadSources?.join(', ') || 'Website, Referral, Cold Call, Social Media, Other',
    leadStatuses: company?.leadStatuses?.join(', ') || 'New, Contacted, Qualified, Proposal Sent, Won, Lost'
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const body = {
      name: form.name.trim(),
      timezone: form.timezone,
      leadSources: form.leadSources.split(',').map(s => s.trim()).filter(Boolean),
      leadStatuses: form.leadStatuses.split(',').map(s => s.trim()).filter(Boolean)
    };

    try {
      let res;
      if (company?._id) {
        res = await api.patch(`/company/${company._id}`, body);
      } else {
        res = await api.post('/company', body);
      }
      if (res.data.success) {
        onSave(res.data.data);
      } else {
        setError(res.data.message || 'Operation failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error occurred while saving company');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="glass-panel rounded-3xl border border-slate-700 p-6 w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white">
            {company ? 'Edit Company' : 'Add New Company'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-all">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
            <AlertCircle className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Company Name</label>
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              required
              placeholder="Tenant Flow Inc."
              className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:border-brand-500 focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Timezone</label>
            <select
              value={form.timezone}
              onChange={e => setForm(f => ({ ...f, timezone: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:border-brand-500 focus:outline-none transition-all"
            >
              {TIMEZONES.map(tz => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Lead Sources (comma separated)
            </label>
            <input
              value={form.leadSources}
              onChange={e => setForm(f => ({ ...f, leadSources: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:border-brand-500 focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Lead Statuses / Stages (comma separated)
            </label>
            <input
              value={form.leadStatuses}
              onChange={e => setForm(f => ({ ...f, leadStatuses: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:border-brand-500 focus:outline-none transition-all"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-400 text-sm hover:bg-slate-800 hover:text-white transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 text-white text-sm font-semibold shadow-lg shadow-brand-500/20 hover:shadow-brand-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Company
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);

  // Detail View State
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);
  const [details, setDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailTab, setDetailTab] = useState('overview');

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const res = await api.get('/company');
      if (res.data.success) {
        setCompanies(res.data.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleFetchDetails = async (companyId) => {
    setSelectedCompanyId(companyId);
    setLoadingDetails(true);
    setDetailTab('overview');
    try {
      const res = await api.get(`/company/${companyId}/details`);
      if (res.data.success) {
        setDetails(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load company details:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleDelete = async (companyId) => {
    if (!window.confirm('WARNING: Deleting a company will permanently destroy all its users, leads, meetings, and activity logs. Are you sure you want to proceed?')) {
      return;
    }
    try {
      const res = await api.delete(`/company/${companyId}`);
      if (res.data.success) {
        setCompanies(companies.filter(c => c._id !== companyId));
        if (selectedCompanyId === companyId) {
          setSelectedCompanyId(null);
          setDetails(null);
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete company');
    }
  };

  const handleSaveCompany = (savedCompany) => {
    if (editingCompany) {
      setCompanies(companies.map(c => c._id === savedCompany._id ? savedCompany : c));
    } else {
      setCompanies([...companies, savedCompany]);
    }
    setShowModal(false);
    setEditingCompany(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 text-brand-500 animate-spin" />
      </div>
    );
  }

  // If a company is selected for details
  if (selectedCompanyId) {
    const companyInfo = details?.company || companies.find(c => c._id === selectedCompanyId);

    return (
      <div className="space-y-6 fade-up">
        {/* Detail view header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setSelectedCompanyId(null); setDetails(null); }}
              className="p-2 rounded-xl hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold font-display text-white">{companyInfo?.name}</h1>
              <p className="text-xs text-slate-500 font-mono mt-0.5">ID: {companyInfo?._id}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => { setEditingCompany(companyInfo); setShowModal(true); }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-900 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
            >
              <Edit3 className="h-3.5 w-3.5" /> Edit
            </button>
            <button
              onClick={() => handleDelete(companyInfo?._id)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-red-500/20 bg-red-500/10 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition-all"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          </div>
        </div>

        {loadingDetails ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 text-brand-500 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* KPI Cards for the company */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="glass-card rounded-2xl p-5 border border-slate-800">
                <div className="flex items-center justify-between mb-3 text-slate-500">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Revenue</span>
                  <DollarSign className="h-4 w-4 text-emerald-400" />
                </div>
                <h3 className="text-2xl font-bold text-white">${(details?.totalRevenue || 0).toLocaleString()}</h3>
              </div>

              <div className="glass-card rounded-2xl p-5 border border-slate-800">
                <div className="flex items-center justify-between mb-3 text-slate-500">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Total Leads</span>
                  <Target className="h-4 w-4 text-brand-400" />
                </div>
                <h3 className="text-2xl font-bold text-white">{details?.leads?.length || 0}</h3>
              </div>

              <div className="glass-card rounded-2xl p-5 border border-slate-800">
                <div className="flex items-center justify-between mb-3 text-slate-500">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Meetings</span>
                  <Calendar className="h-4 w-4 text-purple-400" />
                </div>
                <h3 className="text-2xl font-bold text-white">{details?.meetings?.length || 0}</h3>
              </div>

              <div className="glass-card rounded-2xl p-5 border border-slate-800">
                <div className="flex items-center justify-between mb-3 text-slate-500">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Employees</span>
                  <Users className="h-4 w-4 text-blue-400" />
                </div>
                <h3 className="text-2xl font-bold text-white">{details?.employees?.length || 0}</h3>
              </div>
            </div>

            {/* Inner Tabs */}
            <div className="flex border-b border-slate-800 space-x-6">
              {['overview', 'employees', 'leads', 'meetings'].map(t => (
                <button
                  key={t}
                  onClick={() => setDetailTab(t)}
                  className={`pb-3 text-sm font-semibold capitalize border-b-2 transition-all ${
                    detailTab === t ? 'border-brand-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Tab content */}
            {detailTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-panel rounded-2xl p-6 border border-slate-800/80 space-y-4">
                  <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Company Config</h3>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="text-slate-500 mb-1">Timezone</p>
                      <p className="text-white flex items-center gap-1.5"><Globe className="h-3.5 w-3.5 text-slate-400" /> {companyInfo?.timezone}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 mb-1">Created At</p>
                      <p className="text-white flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-slate-400" /> {new Date(companyInfo?.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                <div className="glass-panel rounded-2xl p-6 border border-slate-800/80 space-y-4">
                  <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Active Pipeline Settings</h3>
                  <div className="space-y-3 text-xs">
                    <div>
                      <p className="text-slate-500 mb-1">Lead Sources</p>
                      <div className="flex flex-wrap gap-1.5">
                        {companyInfo?.leadSources?.map(s => (
                          <span key={s} className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">{s}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-slate-500 mb-1">Pipeline Stages</p>
                      <div className="flex flex-wrap gap-1.5">
                        {companyInfo?.leadStatuses?.map(s => (
                          <span key={s} className="px-2.5 py-1 rounded bg-brand-500/10 border border-brand-500/20 text-brand-400">{s}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {detailTab === 'employees' && (
              <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-500 uppercase tracking-wider">
                        <th className="px-5 py-3 font-semibold">Name</th>
                        <th className="px-5 py-3 font-semibold">Email</th>
                        <th className="px-5 py-3 font-semibold">Role</th>
                        <th className="px-5 py-3 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40 text-slate-300">
                      {details?.employees?.map(emp => (
                        <tr key={emp._id} className="hover:bg-slate-900/30 transition-colors">
                          <td className="px-5 py-3 font-medium text-white">{emp.name}</td>
                          <td className="px-5 py-3">{emp.email}</td>
                          <td className="px-5 py-3 capitalize">{emp.role === 'masterAdmin' ? 'Admin' : emp.role}</td>
                          <td className="px-5 py-3">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                              emp.status === 'Active' ? 'text-green-400 bg-green-500/10' : 'text-slate-400 bg-slate-500/10'
                            }`}>{emp.status || 'Active'}</span>
                          </td>
                        </tr>
                      ))}
                      {details?.employees?.length === 0 && (
                        <tr><td colSpan="4" className="text-center py-6 text-slate-500">No employees registered.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {detailTab === 'leads' && (
              <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-500 uppercase tracking-wider">
                        <th className="px-5 py-3 font-semibold">Lead Name</th>
                        <th className="px-5 py-3 font-semibold">Email</th>
                        <th className="px-5 py-3 font-semibold">Status</th>
                        <th className="px-5 py-3 font-semibold text-right">Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40 text-slate-300">
                      {details?.leads?.map(lead => (
                        <tr key={lead._id} className="hover:bg-slate-900/30 transition-colors">
                          <td className="px-5 py-3 font-medium text-white">{lead.name}</td>
                          <td className="px-5 py-3">{lead.email || '—'}</td>
                          <td className="px-5 py-3">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              lead.status === 'Won' ? 'text-green-400 bg-green-500/10' :
                              lead.status === 'Lost' ? 'text-red-400 bg-red-500/10' :
                              'text-brand-400 bg-brand-500/10'
                            }`}>{lead.status}</span>
                          </td>
                          <td className="px-5 py-3 text-right text-emerald-400 font-bold">${(lead.estimatedValue || 0).toLocaleString()}</td>
                        </tr>
                      ))}
                      {details?.leads?.length === 0 && (
                        <tr><td colSpan="4" className="text-center py-6 text-slate-500">No leads captured.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {detailTab === 'meetings' && (
              <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-500 uppercase tracking-wider">
                        <th className="px-5 py-3 font-semibold">Meeting Subject</th>
                        <th className="px-5 py-3 font-semibold">Related Lead</th>
                        <th className="px-5 py-3 font-semibold">Scheduled Date</th>
                        <th className="px-5 py-3 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40 text-slate-300">
                      {details?.meetings?.map(m => (
                        <tr key={m._id} className="hover:bg-slate-900/30 transition-colors">
                          <td className="px-5 py-3 font-medium text-white">{m.title}</td>
                          <td className="px-5 py-3">{m.leadId?.name || '—'}</td>
                          <td className="px-5 py-3">{new Date(m.scheduledAt).toLocaleString()}</td>
                          <td className="px-5 py-3 capitalize">{m.status}</td>
                        </tr>
                      ))}
                      {details?.meetings?.length === 0 && (
                        <tr><td colSpan="4" className="text-center py-6 text-slate-500">No meetings scheduled.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {showModal && (
          <CompanyModal
            company={editingCompany}
            onClose={() => { setShowModal(false); setEditingCompany(null); }}
            onSave={(saved) => {
              handleSaveCompany(saved);
              if (details) {
                setDetails(prev => ({ ...prev, company: saved }));
              }
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-up">
      {showModal && (
        <CompanyModal
          company={editingCompany}
          onClose={() => { setShowModal(false); setEditingCompany(null); }}
          onSave={handleSaveCompany}
        />
      )}

      {/* Header */}
      <div className="glass-panel rounded-3xl border border-slate-800 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-white flex items-center gap-3">
            <Building2 className="h-7 w-7 text-brand-400" />
            Global Workspace Companies
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage and inspect all companies and tenants in this workspace.</p>
        </div>
        <div>
          <button
            onClick={() => { setEditingCompany(null); setShowModal(true); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 text-white font-semibold text-sm shadow-lg shadow-brand-500/20 hover:shadow-brand-500/30 transition-all"
          >
            <Plus className="h-4 w-4" /> Create Company
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {/* Companies Grid */}
      {companies.length === 0 ? (
        <div className="glass-panel rounded-3xl p-16 text-center border border-slate-800/60">
          <Building2 className="h-12 w-12 text-slate-700 mx-auto mb-4" />
          <h3 className="text-white font-semibold mb-2">No companies created yet</h3>
          <p className="text-slate-500 text-sm">Click the button above to add a company.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {companies.map(c => (
            <div key={c._id} className="glass-card rounded-2xl border border-slate-800 p-5 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="p-2.5 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400">
                      <Building2 className="h-5 w-5" />
                    </span>
                    <div>
                      <h4 className="font-bold text-white text-md line-clamp-1">{c.name}</h4>
                      <p className="text-slate-500 text-[10px] font-mono leading-none mt-1">ID: {c._id}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs pt-2">
                  <div className="text-slate-400 flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5 text-slate-500" />
                    <span className="truncate">{c.timezone || 'UTC'}</span>
                  </div>
                  <div className="text-slate-400 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-slate-500" />
                    <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-800/60">
                <button
                  onClick={() => handleFetchDetails(c._id)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-brand-600/10 hover:bg-brand-600/20 border border-brand-500/20 text-brand-400 text-xs font-semibold transition-all"
                >
                  <Eye className="h-3.5 w-3.5" /> Details
                </button>
                <button
                  onClick={() => { setEditingCompany(c); setShowModal(true); }}
                  className="p-2 rounded-xl border border-slate-750 hover:bg-slate-800 text-slate-400 hover:text-white transition-all"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(c._id)}
                  className="p-2 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/15 text-red-400 transition-all"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
