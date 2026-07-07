import React, { useContext, useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, Building, Calendar, Tag, DollarSign, UserCheck, Plus, Send, Edit, Loader2, ShieldAlert, CheckSquare, AlertTriangle } from 'lucide-react';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import RoleGate from '../../components/RoleGate';
import LeadForm from './LeadForm';
import LostReasonModal from '../../components/pipeline/LostReasonModal';

const STATUS_SELECT_COLORS = {
  'New': 'text-blue-400',
  'Contacted': 'text-indigo-400',
  'Qualified': 'text-purple-400',
  'Proposal Sent': 'text-yellow-400',
  'Won': 'text-green-400',
  'Lost': 'text-red-400'
};

const PRIORITY_BADGES = {
  'high': 'bg-red-500/10 text-red-400 border border-red-500/20',
  'medium': 'bg-orange-500/10 text-orange-400 border border-orange-500/20',
  'low': 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
};

export default function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [lead, setLead] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Note creation
  const [noteText, setNoteText] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);

  // Status/Assignee quick adjustments
  const [companySettings, setCompanySettings] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [lostModal, setLostModal] = useState(null); // { status: 'Lost' }

  const loadLeadDetails = async () => {
    try {
      const res = await api.get(`/leads/${id}`);
      if (res.data.success) {
        setLead(res.data.data);
        setTimeline(res.data.timeline || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to retrieve lead details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeadDetails();

    const fetchDefaults = async () => {
      try {
        const settingsRes = await api.get('/company/settings');
        if (settingsRes.data.success) {
          setCompanySettings(settingsRes.data.data);
        }

        if (user.role !== 'employee') {
          const usersRes = await api.get('/users');
          if (usersRes.data.success) {
            setTeamMembers(usersRes.data.data);
          }
        }
      } catch (e) {
        console.error('Failed loading detail metadata:', e);
      }
    };
    fetchDefaults();
  }, [id, user]);

  const handleStatusChange = async (newStatus) => {
    if (newStatus === 'Lost') {
      setLostModal({ status: 'Lost' });
      return;
    }
    await saveStatusChange(newStatus);
  };

  const saveStatusChange = async (newStatus, lostReason) => {
    try {
      const res = await api.patch(`/leads/${id}/status`, { status: newStatus, lostReason });
      if (res.data.success) {
        setLead(prev => ({ ...prev, status: newStatus, lostReason }));
        loadLeadDetails(); // Refresh timeline
        window.dispatchEvent(
          new CustomEvent('lead:statusChanged', {
            detail: { leadId: id, to: newStatus }
          })
        );
      }
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to update status');
    }
  };

  const handleAssignChange = async (newAssigneeId) => {
    if (!newAssigneeId) return;
    try {
      const res = await api.patch(`/leads/${id}/assign`, { assignedTo: newAssigneeId });
      if (res.data.success) {
        loadLeadDetails(); // Refetches all since assignedTo details will change
      }
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to reassign lead');
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;

    setSubmittingNote(true);
    try {
      const res = await api.post(`/leads/${id}/notes`, { text: noteText });
      if (res.data.success) {
        setLead(res.data.data); // Updates note array
        setNoteText('');
        loadLeadDetails(); // Refresh timeline logs
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add note');
    } finally {
      setSubmittingNote(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 text-brand-500 animate-spin" />
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="text-center py-20 max-w-md mx-auto glass-panel rounded-2xl p-8">
        <ShieldAlert className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-white font-semibold mb-2">Access Denied / Not Found</h3>
        <p className="text-slate-400 text-xs leading-relaxed mb-6">{error || 'Lead could not be loaded.'}</p>
        <Link to="/leads" className="inline-flex items-center gap-2 bg-slate-900 border border-slate-800 text-white px-4 py-2.5 rounded-xl text-xs hover:bg-slate-800 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Leads
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Navigation and Actions */}
      <div className="flex justify-between items-center">
        <Link to="/leads" className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Pipeline
        </Link>

        <button
          onClick={() => setShowEditModal(true)}
          className="flex items-center gap-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white font-medium px-4 py-2 rounded-xl text-xs transition-colors"
        >
          <Edit className="h-3.5 w-3.5" />
          Edit Lead
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Lead Info Card */}
        <div className="lg:col-span-1 glass-panel rounded-3xl p-6 border border-slate-800/80 space-y-6 h-fit">
          <div>
            <span className={`inline-flex px-2 py-0.5 rounded text-[9px] font-bold uppercase mb-2 ${PRIORITY_BADGES[lead.priority]}`}>
              {lead.priority} Priority
            </span>
            <h2 className="text-xl font-bold font-display text-white">{lead.name}</h2>
            <p className="text-slate-400 text-xs mt-1">{lead.clientCompanyName || 'Individual Client'}</p>
          </div>

          <div className="space-y-4 border-t border-slate-800/60 pt-6">
            {/* Quick Status Adjust */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Stage</label>
              <select
                className="glass-input w-full px-3 py-2 rounded-xl text-xs"
                value={lead.status}
                onChange={(e) => handleStatusChange(e.target.value)}
              >
                {(companySettings?.leadStatuses || ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Won', 'Lost']).map(st => (
                  <option key={st} value={st} className="text-slate-800 bg-white">{st}</option>
                ))}
              </select>
            </div>

            {/* Quick Assignee Adjust (Admins/Managers) */}
            {user.role !== 'employee' && (
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Owner representative</label>
                <select
                  className="glass-input w-full px-3 py-2 rounded-xl text-xs"
                  value={lead.assignedTo?._id || lead.assignedTo || ''}
                  onChange={(e) => handleAssignChange(e.target.value)}
                >
                  <option value="">Unassigned</option>
                  {teamMembers.map(member => (
                    <option key={member._id} value={member._id} className="text-slate-800 bg-white">
                      {member.name} ({member.role === 'manager' ? 'Manager' : 'Agent'})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Contact Details */}
          <div className="space-y-3.5 border-t border-slate-800/60 pt-6 text-xs text-slate-300">
            {lead.email && (
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-slate-500" />
                <a href={`mailto:${lead.email}`} className="hover:text-brand-400 transition-colors truncate">{lead.email}</a>
              </div>
            )}
            {lead.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-slate-500" />
                <a href={`tel:${lead.phone}`} className="hover:text-brand-400 transition-colors">{lead.phone}</a>
              </div>
            )}
            <div className="flex items-center gap-3">
              <DollarSign className="h-4 w-4 text-slate-500" />
              <span>Est. Value: <strong className="text-white">${lead.estimatedValue?.toLocaleString() || '0'}</strong></span>
            </div>
            <div className="flex items-center gap-3">
              <Tag className="h-4 w-4 text-slate-500" />
              <span>Source: <strong className="text-white">{lead.source}</strong></span>
            </div>
            {lead.followUpDate && (
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-slate-500" />
                <span>Follow-up: <strong className="text-white">{new Date(lead.followUpDate).toLocaleDateString()}</strong></span>
              </div>
            )}
          </div>

          {/* Lost Reason (shown when status is Lost) */}
          {lead.status === 'Lost' && lead.lostReason && (
            <div className="border-t border-slate-800/60 pt-6">
              <label className="block text-[10px] font-bold text-red-500/80 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <AlertTriangle className="h-3 w-3" /> Lost Reason
              </label>
              <span className="px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
                {lead.lostReason}
              </span>
            </div>
          )}

          {/* Tags */}
          {lead.tags && lead.tags.length > 0 && (
            <div className="border-t border-slate-800/60 pt-6">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Tags</label>
              <div className="flex flex-wrap gap-1.5">
                {lead.tags.map(t => (
                  <span key={t} className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-300 font-medium">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Timeline & Notes */}
        <div className="lg:col-span-2 space-y-6">
          {/* Notes Section */}
          <div className="glass-panel rounded-3xl p-6 border border-slate-800/80 space-y-4">
            <h3 className="text-sm font-bold font-display text-white uppercase tracking-wider mb-2">Follow-up Notes</h3>

            {/* Note input */}
            <form onSubmit={handleAddNote} className="flex gap-2">
              <input
                type="text"
                placeholder="Log a follow-up or add custom comments..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                className="glass-input flex-1 px-4 py-2.5 rounded-xl text-xs"
              />
              <button
                type="submit"
                disabled={submittingNote || !noteText.trim()}
                className="p-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white transition-all shadow-md shadow-brand-500/10 disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>

            {/* Notes List */}
            <div className="space-y-3 mt-4 max-h-[300px] overflow-y-auto pr-1">
              {lead.notes.length === 0 ? (
                <p className="text-center text-xs text-slate-600 py-6 italic">No notes logged yet.</p>
              ) : (
                [...lead.notes].reverse().map((note) => (
                  <div key={note._id} className="p-3.5 rounded-2xl bg-slate-950/40 border border-slate-850/60 text-xs">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-white">{note.authorName}</span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(note.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    </div>
                    <p className="text-slate-300 leading-relaxed font-medium">{note.text}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Activity Logs (Audit Timeline) */}
          <div className="glass-panel rounded-3xl p-6 border border-slate-800/80 space-y-6">
            <h3 className="text-sm font-bold font-display text-white uppercase tracking-wider">Activity Timeline</h3>

            <div className="space-y-6 pl-2 max-h-[350px] overflow-y-auto pr-2">
              {timeline.length === 0 ? (
                <p className="text-xs text-slate-600 italic">No timeline entries found</p>
              ) : (
                timeline.map((item) => (
                  <div key={item._id} className="text-xs flex gap-4 relative pb-4 border-l border-slate-850 pl-6 last:border-0 last:pb-0">
                    {/* Circle icon marker */}
                    <div className="absolute top-0.5 left-[-5px] w-2.5 h-2.5 rounded-full bg-slate-800 ring-4 ring-slate-950 flex items-center justify-center">
                      <div className="w-1 h-1 rounded-full bg-brand-500" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex justify-between items-start gap-4">
                        <p className="text-slate-300 font-medium leading-relaxed">
                          <span className="text-white font-bold">{item.userName}</span>{' '}
                          {item.action === 'LEAD_CREATED' && 'created this lead.'}
                          {item.action === 'LEAD_NOTE_ADDED' && 'logged a follow-up note.'}
                          {item.action === 'LEAD_DELETED' && 'archived this lead.'}
                          {item.action === 'LEAD_ASSIGNED' && 'reassigned lead ownership.'}
                          {item.action === 'LEAD_UPDATED' && 'updated lead attributes.'}
                          {item.action === 'LEAD_STATUS_CHANGED' && `moved lead status to "${item.metadata?.status?.to || 'Updated'}".`}
                          {item.action === 'MEETING_SCHEDULED' && 'scheduled a meeting.'}
                          {item.action === 'MEETING_UPDATED' && 'updated a meeting.'}
                        </p>
                        <span className="text-[10px] text-slate-500 whitespace-nowrap">
                          {new Date(item.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}{' '}
                          {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {/* Detail block if status changed or reassigned */}
                      {(item.action === 'LEAD_UPDATED' || item.action === 'LEAD_STATUS_CHANGED') && item.metadata?.status && (
                        <div className="mt-2 py-1 px-2.5 rounded bg-slate-900 border border-slate-800 w-fit text-[10px] text-slate-400 flex items-center gap-1.5 font-semibold">
                          <span>Status changed:</span>
                          <span className="text-slate-300">{item.metadata.status.from || '—'}</span>
                          <span>→</span>
                          <span className="text-white font-bold">{item.metadata.status.to}</span>
                          {item.metadata.lostReason && (
                            <span className="text-red-400 font-bold ml-2">Reason: {item.metadata.lostReason}</span>
                          )}
                        </div>
                      )}

                      {item.action === 'LEAD_ASSIGNED' && (
                        <div className="mt-2 py-1 px-2.5 rounded bg-slate-900 border border-slate-800 w-fit text-[10px] text-slate-400">
                          Ownership re-assigned
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Form Modal */}
      {showEditModal && (
        <LeadForm
          lead={lead}
          companySettings={companySettings}
          teamMembers={teamMembers}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => { setShowEditModal(false); loadLeadDetails(); }}
        />
      )}

      {/* Lost Reason Modal */}
      {lostModal && (
        <LostReasonModal
          leadName={lead.name}
          onConfirm={(reason) => {
            saveStatusChange('Lost', reason);
            setLostModal(null);
          }}
          onCancel={() => setLostModal(null)}
        />
      )}
    </div>
  );
}
