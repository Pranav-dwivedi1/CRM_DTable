import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarClock, PlusCircle, X, Clock, MapPin, Users,
  CheckCircle2, AlertCircle, Loader2, ChevronDown, Edit3
} from 'lucide-react';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext';

const STATUS_STYLES = {
  'Scheduled': 'bg-blue-500/15 text-blue-300 border border-blue-500/25',
  'Completed': 'bg-green-500/15 text-green-300 border border-green-500/25',
  'Cancelled': 'bg-red-500/15 text-red-300 border border-red-500/25'
};

export default function Meetings() {
  const { user } = useContext(AuthContext);
  const [meetings, setMeetings] = useState([]);
  const [leads, setLeads] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editMeeting, setEditMeeting] = useState(null);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    leadId: '', title: '', scheduledAt: '', location: '', notes: '', attendees: [], status: 'Scheduled'
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchMeetings = async () => {
    try {
      const res = await api.get('/meetings');
      if (res.data.success) setMeetings(res.data.data);
    } catch (e) {
      console.error('Failed to load meetings:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
    const fetchMeta = async () => {
      try {
        const leadsRes = await api.get('/leads');
        if (leadsRes.data.success) setLeads(leadsRes.data.data || []);
        if (user?.role !== 'employee') {
          const usersRes = await api.get('/users');
          if (usersRes.data.success) setTeamMembers(usersRes.data.data || []);
        }
      } catch (e) { /* ignore */ }
    };
    fetchMeta();
  }, [user]);

  const openCreate = () => {
    setEditMeeting(null);
    setFormData({ leadId: '', title: '', scheduledAt: '', location: '', notes: '', attendees: [], status: 'Scheduled' });
    setError('');
    setShowForm(true);
  };

  const openEdit = (m) => {
    setEditMeeting(m);
    setFormData({
      leadId: m.leadId?._id || m.leadId || '',
      title: m.title || '',
      scheduledAt: m.scheduledAt ? new Date(m.scheduledAt).toISOString().slice(0, 16) : '',
      location: m.location || '',
      notes: m.notes || '',
      attendees: (m.attendees || []).map(a => a._id || a),
      status: m.status || 'Scheduled'
    });
    setError('');
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    const payload = {
      ...formData,
      scheduledAt: new Date(formData.scheduledAt).toISOString()
    };
    try {
      if (editMeeting) {
        await api.patch(`/meetings/${editMeeting._id}`, payload);
      } else {
        await api.post('/meetings', payload);
      }
      setShowForm(false);
      fetchMeetings();
    } catch (err) {
      setError(err.response?.data?.message || (err.response?.data?.errors?.[0]?.message) || 'Failed to save meeting.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this meeting?')) return;
    try {
      await api.delete(`/meetings/${id}`);
      fetchMeetings();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to delete meeting.');
    }
  };

  const upcoming = meetings.filter(m => m.status === 'Scheduled' && new Date(m.scheduledAt) >= new Date());
  const past = meetings.filter(m => m.status !== 'Scheduled' || new Date(m.scheduledAt) < new Date());

  return (
    <div className="space-y-6 fade-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-white">Meetings</h1>
          <p className="text-slate-400 text-sm mt-1">Schedule and manage your lead meetings</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-semibold px-5 py-2.5 rounded-xl text-sm shadow-lg shadow-brand-500/25 transition-all"
        >
          <PlusCircle className="h-4 w-4" />
          Schedule Meeting
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-7 w-7 text-brand-500 animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Upcoming */}
          <section>
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-brand-400" /> Upcoming ({upcoming.length})
            </h2>
            {upcoming.length === 0 ? (
              <div className="glass-panel rounded-2xl p-10 text-center border border-slate-800/60">
                <CalendarClock className="h-10 w-10 text-slate-700 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">No upcoming meetings scheduled.</p>
                <button onClick={openCreate} className="mt-4 text-xs text-brand-400 hover:underline">Schedule one →</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {upcoming.map(m => <MeetingCard key={m._id} meeting={m} onEdit={openEdit} onDelete={handleDelete} />)}
              </div>
            )}
          </section>

          {/* Past */}
          {past.length > 0 && (
            <section>
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                Past & Cancelled ({past.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {past.map(m => <MeetingCard key={m._id} meeting={m} onEdit={openEdit} onDelete={handleDelete} muted />)}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Schedule / Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg glass-panel rounded-3xl border border-slate-800 shadow-2xl overflow-hidden modal-enter">
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
              <h3 className="text-md font-bold font-display text-white">
                {editMeeting ? 'Edit Meeting' : 'Schedule Meeting'}
              </h3>
              <button onClick={() => setShowForm(false)} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-950/80 transition-all">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-start gap-2 text-xs">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Meeting Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="Product Demo Call"
                    value={formData.title}
                    onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                    className="glass-input w-full px-3 py-2 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Related Lead *</label>
                  <select
                    required
                    value={formData.leadId}
                    onChange={e => setFormData(p => ({ ...p, leadId: e.target.value }))}
                    className="glass-input w-full px-3 py-2 rounded-xl text-xs"
                  >
                    <option value="">Select a lead...</option>
                    {leads.map(l => (
                      <option key={l._id} value={l._id}>{l.name} {l.clientCompanyName ? `· ${l.clientCompanyName}` : ''}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Scheduled Date & Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.scheduledAt}
                    onChange={e => setFormData(p => ({ ...p, scheduledAt: e.target.value }))}
                    className="glass-input w-full px-3 py-2 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Location / Link</label>
                  <input
                    type="text"
                    placeholder="Zoom link or office address"
                    value={formData.location}
                    onChange={e => setFormData(p => ({ ...p, location: e.target.value }))}
                    className="glass-input w-full px-3 py-2 rounded-xl text-xs"
                  />
                </div>

                {editMeeting && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Status</label>
                    <select
                      value={formData.status}
                      onChange={e => setFormData(p => ({ ...p, status: e.target.value }))}
                      className="glass-input w-full px-3 py-2 rounded-xl text-xs"
                    >
                      <option value="Scheduled">Scheduled</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Notes</label>
                  <textarea
                    rows={3}
                    placeholder="Agenda, talking points..."
                    value={formData.notes}
                    onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))}
                    className="glass-input w-full px-3 py-2 rounded-xl text-xs resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-800 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 rounded-xl border border-slate-800 text-xs text-slate-300 hover:bg-slate-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-semibold px-5 py-2 rounded-xl text-xs shadow-lg shadow-brand-500/25 transition-all disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editMeeting ? 'Update Meeting' : 'Schedule Meeting'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function MeetingCard({ meeting: m, onEdit, onDelete, muted = false }) {
  const STATUS_STYLES = {
    'Scheduled': 'bg-blue-500/15 text-blue-300 border border-blue-500/25',
    'Completed': 'bg-green-500/15 text-green-300 border border-green-500/25',
    'Cancelled': 'bg-red-500/15 text-red-300 border border-red-500/25'
  };

  return (
    <div className={`glass-card rounded-2xl p-5 border ${muted ? 'border-slate-800/40 opacity-70' : 'border-slate-800/60'} space-y-3`}>
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-white text-sm font-semibold leading-snug line-clamp-2">{m.title}</h3>
        <span className={`shrink-0 px-2 py-0.5 rounded text-[9px] font-bold uppercase ${STATUS_STYLES[m.status]}`}>
          {m.status}
        </span>
      </div>

      {m.leadId && (
        <Link
          to={`/leads/${m.leadId._id || m.leadId}`}
          className="text-brand-400 hover:text-brand-300 text-xs font-medium truncate block"
        >
          {m.leadId.name || 'View Lead'} {m.leadId.clientCompanyName ? `· ${m.leadId.clientCompanyName}` : ''}
        </Link>
      )}

      <div className="space-y-1.5 text-[11px] text-slate-400">
        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-slate-500 shrink-0" />
          {new Date(m.scheduledAt).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}{' '}
          {new Date(m.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
        {m.location && (
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 text-slate-500 shrink-0" />
            <span className="truncate">{m.location}</span>
          </div>
        )}
        {m.attendees?.length > 0 && (
          <div className="flex items-center gap-2">
            <Users className="h-3.5 w-3.5 text-slate-500 shrink-0" />
            <span>{m.attendees.length} attendee{m.attendees.length !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {m.notes && (
        <p className="text-[11px] text-slate-500 border-t border-slate-800/60 pt-2 line-clamp-2 italic">
          {m.notes}
        </p>
      )}

      <div className="flex gap-2 pt-1 border-t border-slate-800/40">
        <button
          onClick={() => onEdit(m)}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-semibold text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
        >
          <Edit3 className="h-3 w-3" /> Edit
        </button>
        <button
          onClick={() => onDelete(m._id)}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-semibold text-red-500/70 hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <X className="h-3 w-3" /> Delete
        </button>
      </div>
    </div>
  );
}
