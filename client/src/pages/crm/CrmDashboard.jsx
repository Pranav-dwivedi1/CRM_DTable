import React, { useContext, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BarChart2, TrendingUp, CalendarClock, Activity,
  Users, Target, CheckCircle2, XCircle, Clock, PlusCircle, ArrowRight, Kanban
} from 'lucide-react';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import { connectSocket, getSocket } from '../../services/socket';

const STATUS_COLORS = {
  'New': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'Contacted': 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  'Qualified': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  'Proposal Sent': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  'Won': 'bg-green-500/20 text-green-300 border-green-500/30',
  'Lost': 'bg-red-500/20 text-red-300 border-red-500/30',
  'Converted': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
};

const STATUS_BAR_COLORS = {
  'New': 'bg-blue-500',
  'Contacted': 'bg-indigo-500',
  'Qualified': 'bg-purple-500',
  'Proposal Sent': 'bg-yellow-500',
  'Won': 'bg-green-500',
  'Lost': 'bg-red-500',
  'Converted': 'bg-emerald-500'
};

export default function CrmDashboard() {
  const { user } = useContext(AuthContext);
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['crmDashboard'],
    queryFn: async () => {
      const res = await api.get('/dashboard/crm-summary');
      return res.data.data;
    }
  });

  // Real-time socket sync
  useEffect(() => {
    connectSocket();
    const socket = getSocket();
    if (!socket) return;

    const onSync = () => {
      refetch();
    };

    socket.on('lead:statusChanged', onSync);
    return () => {
      socket.off('lead:statusChanged', onSync);
    };
  }, [refetch]);

  const totalFromStatus = data?.leadsByStatus?.reduce((acc, s) => acc + s.count, 0) || 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-white">CRM Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">
            {user?.role === 'employee' ? 'Your personal CRM overview' :
             user?.role === 'manager' ? "Your team's CRM performance" :
             'Company-wide CRM analytics'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/crm/pipeline"
            className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white border border-slate-800 font-semibold px-5 py-2.5 rounded-xl text-sm transition-all"
          >
            <Kanban className="h-4 w-4" />
            Pipeline Board
          </Link>
          <Link
            to="/crm/leads/new"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-semibold px-5 py-2.5 rounded-xl text-sm shadow-lg shadow-brand-500/25 transition-all"
          >
            <PlusCircle className="h-4 w-4" />
            New Lead
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Target}
          label="Total Leads"
          value={data?.metrics?.totalLeads ?? 0}
          iconBg="bg-brand-500/10 text-brand-400"
        />
        <StatCard
          icon={CheckCircle2}
          label="Won / Converted"
          value={data?.leadsByStatus?.find(s => s._id === 'Won')?.count ?? 0}
          iconBg="bg-green-500/10 text-green-400"
        />
        <StatCard
          icon={XCircle}
          label="Lost"
          value={data?.leadsByStatus?.find(s => s._id === 'Lost')?.count ?? 0}
          iconBg="bg-red-500/10 text-red-400"
        />
        <StatCard
          icon={CalendarClock}
          label="Upcoming Meetings"
          value={data?.upcomingMeetings?.length ?? 0}
          iconBg="bg-purple-500/10 text-purple-400"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Lead Status Distribution */}
        <div className="lg:col-span-3 glass-panel rounded-3xl p-6 border border-slate-800/80">
          <h2 className="text-sm font-bold font-display text-white uppercase tracking-wider mb-5">Lead Status Distribution</h2>
          {data?.leadsByStatus?.length === 0 ? (
            <p className="text-slate-500 text-xs text-center py-10">No leads found</p>
          ) : (
            <div className="space-y-3">
              {(data?.leadsByStatus || []).map((s) => {
                const pct = totalFromStatus > 0 ? Math.round((s.count / totalFromStatus) * 100) : 0;
                return (
                  <div key={s._id} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${STATUS_COLORS[s._id] || 'bg-slate-500/20 text-slate-300 border-slate-500/30'}`}>
                          {s._id}
                        </span>
                      </div>
                      <span className="text-slate-400 font-semibold">{s.count} <span className="text-slate-600">({pct}%)</span></span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${STATUS_BAR_COLORS[s._id] || 'bg-slate-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Upcoming Meetings */}
        <div className="lg:col-span-2 glass-panel rounded-3xl p-6 border border-slate-800/80">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-bold font-display text-white uppercase tracking-wider">Upcoming Meetings</h2>
            <Link to="/crm/meetings" className="text-[10px] font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1">
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {!data?.upcomingMeetings?.length ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <CalendarClock className="h-8 w-8 text-slate-700 mb-3" />
              <p className="text-slate-500 text-xs">No upcoming meetings</p>
              <Link to="/crm/meetings" className="mt-3 text-[10px] text-brand-400 hover:underline">Schedule one →</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {data.upcomingMeetings.map((m) => (
                <div key={m._id} className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/60">
                  <p className="text-white text-xs font-semibold truncate">{m.title}</p>
                  <p className="text-slate-400 text-[10px] mt-1 truncate">
                    {m.leadId?.name || 'Unknown Lead'} {m.leadId?.clientCompanyName ? `· ${m.leadId.clientCompanyName}` : ''}
                  </p>
                  <div className="flex items-center gap-1.5 mt-2 text-[10px] text-slate-500">
                    <Clock className="h-3 w-3" />
                    {new Date(m.scheduledAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}{' '}
                    {new Date(m.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {m.location && <span className="ml-1 text-slate-600">· {m.location}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div className="glass-panel rounded-3xl p-6 border border-slate-800/80">
        <h2 className="text-sm font-bold font-display text-white uppercase tracking-wider mb-5">Recent Lead Activity</h2>
        {!data?.recentActivities?.length ? (
          <p className="text-slate-500 text-xs text-center py-8">No recent activity</p>
        ) : (
          <div className="space-y-4 max-h-[280px] overflow-y-auto pr-2">
            {data.recentActivities.map((item) => (
              <div key={item._id} className="flex gap-4 text-xs relative pb-4 border-l border-slate-800 pl-6 last:border-0 last:pb-0">
                <div className="absolute top-0.5 left-[-5px] w-2.5 h-2.5 rounded-full bg-slate-800 ring-4 ring-slate-950 flex items-center justify-center">
                  <div className="w-1 h-1 rounded-full bg-brand-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <p className="text-slate-300 font-medium leading-relaxed">
                      <span className="text-white font-bold">{item.userName}</span>{' '}
                      {item.action === 'LEAD_CREATED' && 'created a lead.'}
                      {item.action === 'LEAD_NOTE_ADDED' && 'logged a note.'}
                      {item.action === 'LEAD_UPDATED' && 'updated a lead.'}
                      {item.action === 'LEAD_ASSIGNED' && 'reassigned a lead.'}
                      {item.action === 'LEAD_DELETED' && 'archived a lead.'}
                      {item.action === 'LEAD_STATUS_CHANGED' && `moved status to "${item.metadata?.status?.to || 'Updated'}".`}
                      {item.action === 'MEETING_SCHEDULED' && 'scheduled a meeting.'}
                      {item.action === 'MEETING_UPDATED' && 'updated a meeting.'}
                    </p>
                    <span className="text-[10px] text-slate-500 whitespace-nowrap shrink-0">
                      {new Date(item.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, iconBg }) {
  return (
    <div className="glass-card rounded-2xl p-5 border border-slate-800/60">
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-xl ${iconBg}`}>
          <Icon className="h-5 w-5" />
        </div>
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-3xl font-bold font-display text-white">{value}</p>
    </div>
  );
}
