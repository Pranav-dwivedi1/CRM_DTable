import React, { useState, useEffect, useContext } from 'react';
import {
  Building2, Globe, Tag, Layers, Plus, X, Save,
  Palette, Check, AlertTriangle, RefreshCw
} from 'lucide-react';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext';

const TIMEZONES = [
  'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Kolkata', 'Asia/Dubai',
  'Asia/Singapore', 'Asia/Tokyo', 'Australia/Sydney', 'Pacific/Auckland',
];

function TagEditor({ label, items, onAdd, onRemove, placeholder }) {
  const [input, setInput] = useState('');

  const handleAdd = () => {
    const val = input.trim();
    if (val && !items.includes(val)) {
      onAdd(val);
      setInput('');
    }
  };

  return (
    <div>
      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{label}</label>
      <div className="flex flex-wrap gap-2 mb-2 min-h-[36px]">
        {items.map(item => (
          <span key={item} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600/10 border border-brand-500/20 text-brand-300 text-xs font-medium">
            {item}
            <button onClick={() => onRemove(item)} className="text-brand-500 hover:text-red-400 transition-colors">
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          className="glass-input flex-1 px-3 py-2 rounded-xl text-sm"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={placeholder}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAdd())}
        />
        <button
          type="button"
          onClick={handleAdd}
          className="px-3 py-2 rounded-xl bg-brand-600/10 border border-brand-500/30 text-brand-400 hover:bg-brand-600/20 transition-colors"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function Section({ icon: Icon, title, children }) {
  return (
    <div className="glass-card rounded-2xl border border-slate-800 p-6 space-y-5">
      <div className="flex items-center gap-3 border-b border-slate-800/80 pb-4">
        <div className="p-2 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400">
          <Icon className="h-4 w-4" />
        </div>
        <h3 className="font-bold text-white font-display">{title}</h3>
      </div>
      {children}
    </div>
  );
}

export default function CompanySettings() {
  const { user: currentUser, updateUserProfile } = useContext(AuthContext);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    logoUrl: '',
    timezone: 'UTC',
    leadSources: [],
    leadStatuses: [],
  });

  const fetchCompany = async () => {
    setLoading(true);
    try {
      const res = await api.get('/company/settings');
      const data = res.data.data;
      setCompany(data);
      setForm({
        name: data.name || '',
        logoUrl: data.logoUrl || '',
        timezone: data.timezone || 'UTC',
        leadSources: data.leadSources || [],
        leadStatuses: data.leadStatuses || [],
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load company settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCompany(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess('');
    setError('');
    try {
      const res = await api.patch('/company/settings', form);
      setCompany(res.data.data);
      setSuccess('Company settings saved successfully!');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const isMasterAdmin = currentUser?.role === 'masterAdmin';

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-800 rounded-xl w-64" />
        <div className="glass-card rounded-2xl border border-slate-800 h-48" />
        <div className="glass-card rounded-2xl border border-slate-800 h-48" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-display text-white">Company Settings</h2>
          <p className="text-sm text-slate-400 mt-0.5">Configure your workspace and pipeline defaults</p>
        </div>
        {isMasterAdmin && (
          <button
            type="submit"
            id="save-settings-btn"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition-all shadow-lg shadow-brand-600/20 disabled:opacity-50"
          >
            {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        )}
      </div>

      {/* Alerts */}
      {success && (
        <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-xl text-sm">
          <Check className="h-4 w-4 shrink-0" /> {success}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
          <button type="button" onClick={() => setError('')} className="ml-auto font-bold">✕</button>
        </div>
      )}

      {/* Company Profile */}
      <Section icon={Building2} title="Company Profile">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Company Name</label>
            <input
              id="company-name-input"
              className="glass-input w-full px-4 py-2.5 rounded-xl text-sm"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              required
              disabled={!isMasterAdmin}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Logo URL</label>
            <input
              id="company-logo-input"
              className="glass-input w-full px-4 py-2.5 rounded-xl text-sm"
              value={form.logoUrl}
              onChange={e => setForm(f => ({ ...f, logoUrl: e.target.value }))}
              placeholder="https://example.com/logo.png"
              disabled={!isMasterAdmin}
            />
          </div>
        </div>

        {/* Logo Preview */}
        {form.logoUrl && (
          <div className="flex items-center gap-4 p-4 bg-slate-900/40 rounded-xl border border-slate-800">
            <img src={form.logoUrl} alt="Company logo preview" className="h-10 w-10 rounded-lg object-contain bg-white p-1" onError={e => e.target.style.display='none'} />
            <span className="text-xs text-slate-400">Logo Preview</span>
          </div>
        )}

        {/* Company ID (read-only) */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Company ID</label>
          <div className="glass-input px-4 py-2.5 rounded-xl text-sm text-slate-500 font-mono select-all cursor-text">
            {company?._id}
          </div>
        </div>
      </Section>

      {/* Timezone */}
      <Section icon={Globe} title="Timezone">
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Workspace Timezone</label>
          <select
            id="company-timezone-select"
            className="glass-input w-full px-4 py-2.5 rounded-xl text-sm"
            value={form.timezone}
            onChange={e => setForm(f => ({ ...f, timezone: e.target.value }))}
            disabled={!isMasterAdmin}
          >
            {TIMEZONES.map(tz => (
              <option key={tz} value={tz}>{tz}</option>
            ))}
          </select>
          <p className="text-xs text-slate-500 mt-1.5">Used for follow-up date scheduling and activity timestamps.</p>
        </div>
      </Section>

      {/* Lead Sources */}
      <Section icon={Tag} title="Lead Sources">
        {isMasterAdmin ? (
          <TagEditor
            label="Available Sources"
            items={form.leadSources}
            onAdd={val => setForm(f => ({ ...f, leadSources: [...f.leadSources, val] }))}
            onRemove={val => setForm(f => ({ ...f, leadSources: f.leadSources.filter(s => s !== val) }))}
            placeholder="e.g. LinkedIn, Referral, Cold Email..."
          />
        ) : (
          <div className="flex flex-wrap gap-2">
            {form.leadSources.map(s => (
              <span key={s} className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-xs">{s}</span>
            ))}
          </div>
        )}
        <p className="text-xs text-slate-500">These options appear in the lead source dropdown when creating or editing a lead.</p>
      </Section>

      {/* Lead Statuses */}
      <Section icon={Layers} title="Lead Statuses">
        {isMasterAdmin ? (
          <TagEditor
            label="Pipeline Stages"
            items={form.leadStatuses}
            onAdd={val => setForm(f => ({ ...f, leadStatuses: [...f.leadStatuses, val] }))}
            onRemove={val => setForm(f => ({ ...f, leadStatuses: f.leadStatuses.filter(s => s !== val) }))}
            placeholder="e.g. New, Contacted, Qualified..."
          />
        ) : (
          <div className="flex flex-wrap gap-2">
            {form.leadStatuses.map(s => (
              <span key={s} className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-xs">{s}</span>
            ))}
          </div>
        )}
        <p className="text-xs text-slate-500">
          These statuses define your lead pipeline stages (Kanban columns and filters).
          <span className="text-amber-400 font-medium"> Note:</span> Removing a status will not affect leads already assigned that status.
        </p>
      </Section>

      {/* Read-only info for non-admins */}
      {!isMasterAdmin && (
        <div className="flex items-center gap-3 bg-slate-800/40 border border-slate-700 text-slate-400 px-4 py-3 rounded-xl text-sm">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
          Only Master Admins can modify company settings. Contact your workspace admin to make changes.
        </div>
      )}

      {/* Bottom Save button (for long scroll) */}
      {isMasterAdmin && (
        <div className="flex justify-end pb-6">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition-all shadow-lg shadow-brand-600/20 disabled:opacity-50"
          >
            {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Saving...' : 'Save All Changes'}
          </button>
        </div>
      )}
    </form>
  );
}
