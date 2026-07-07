import React, { useContext, useEffect, useState } from 'react';
import { Target, CheckCircle, TrendingUp, Users, Calendar, Loader2, ArrowRight, UserCheck } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';
import { Link } from 'react-router-dom';

const STATUS_COLORS = {
  'New': '#3b82f6',          // Blue
  'Contacted': '#6366f1',    // Indigo
  'Qualified': '#a855f7',    // Purple
  'Proposal Sent': '#eab308', // Yellow
  'Won': '#10b981',          // Green
  'Lost': '#ef4444',         // Red
  // Fallbacks for byteTech seeding
  'Lead Seeding': '#3b82f6',
  'Active Discussion': '#6366f1',
  'Contract Offered': '#a855f7',
  'Closed Won': '#10b981',
  'Closed Lost': '#ef4444'
};

const DEFAULT_COLORS = ['#3b82f6', '#6366f1', '#a855f7', '#10b981', '#ef4444', '#f59e0b', '#ec4899'];

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await api.get('/dashboard/summary');
        if (res.data.success) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load dashboard summary:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 text-brand-500 animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12 glass-card rounded-2xl p-8 max-w-md mx-auto">
        <p className="text-slate-400 text-sm">Failed to generate dashboard overview. Please refresh your page.</p>
      </div>
    );
  }

  const { metrics, leadsByStatus = [], leadsBySource = [], teamPerformance = [], recentActivities = [], followUpsToday = [], followUpsThisWeek = [] } = data;

  // Format Statuses for Pie Chart
  const statusData = leadsByStatus.map(item => ({
    name: item._id,
    value: item.count
  }));

  // Format Sources for Bar Chart
  const sourceData = leadsBySource.map(item => ({
    name: item._id,
    count: item.count
  }));

  // Format team performance
  const performanceData = teamPerformance.map(item => ({
    name: item.name,
    Total: item.total,
    Won: item.won
  }));

  return (
    <div className="space-y-8">
      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Total Leads */}
        <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-[0.03] text-brand-500">
            <Target className="h-28 w-28" />
          </div>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Total Leads</p>
              <h3 className="text-3xl font-bold font-display text-white">{metrics.totalLeads}</h3>
            </div>
            <span className="p-3 bg-brand-500/10 border border-brand-500/20 text-brand-400 rounded-xl">
              <Target className="h-6 w-6" />
            </span>
          </div>
          <div className="text-slate-500 text-xs mt-4">Active leads in current pipeline</div>
        </div>

        {/* Card 2: Won Leads */}
        <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-[0.03] text-green-500">
            <CheckCircle className="h-28 w-28" />
          </div>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Won Deals</p>
              <h3 className="text-3xl font-bold font-display text-white">{metrics.wonLeads}</h3>
            </div>
            <span className="p-3 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl">
              <CheckCircle className="h-6 w-6" />
            </span>
          </div>
          <div className="text-slate-500 text-xs mt-4">Successfully closed business transactions</div>
        </div>

        {/* Card 3: Conversion Rate */}
        <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-[0.03] text-purple-500">
            <TrendingUp className="h-28 w-28" />
          </div>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Conversion Rate</p>
              <h3 className="text-3xl font-bold font-display text-white">{metrics.conversionRate}%</h3>
            </div>
            <span className="p-3 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-xl">
              <TrendingUp className="h-6 w-6" />
            </span>
          </div>
          <div className="text-slate-500 text-xs mt-4">Rate of successfully converted leads</div>
        </div>
      </div>

      {/* Visual Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution (Pie Chart) */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800/80">
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-6">Leads by Status</h3>
          <div className="h-80 flex items-center justify-center">
            {statusData.length === 0 ? (
              <p className="text-slate-500 text-sm">No lead data to display</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || DEFAULT_COLORS[index % DEFAULT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', borderColor: 'rgba(255, 255, 255, 0.08)', borderRadius: '12px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend verticalAlign="bottom" height={36} formatter={(value) => <span className="text-xs text-slate-300">{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Source Breakdown (Bar Chart) */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800/80">
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-6">Leads by Source</h3>
          <div className="h-80">
            {sourceData.length === 0 ? (
              <p className="text-slate-500 text-sm flex items-center justify-center h-full">No source data to display</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sourceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', borderColor: 'rgba(255, 255, 255, 0.08)', borderRadius: '12px' }}
                    labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                    itemStyle={{ color: '#5275ff' }}
                  />
                  <Bar dataKey="count" fill="#5275ff" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Role Scoped Metrics / Activity Feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1 & 2: Main list based on role */}
        <div className="lg:col-span-2 space-y-6">
          {user.role === 'employee' ? (
            /* Employee follow-ups list */
            <div className="glass-panel rounded-2xl p-6 border border-slate-800/80 space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-brand-400" />
                  Follow-ups Due Today
                </h3>
                {followUpsToday.length === 0 ? (
                  <p className="text-slate-500 text-xs py-2">No follow-ups due today</p>
                ) : (
                  <div className="divide-y divide-slate-800/50">
                    {followUpsToday.map((item) => (
                      <div key={item._id} className="py-3 flex justify-between items-center group">
                        <div>
                          <p className="text-sm font-semibold text-white">{item.name}</p>
                          <p className="text-xs text-slate-400">{item.clientCompanyName || 'No company listed'}</p>
                        </div>
                        <Link to={`/leads/${item._id}`} className="text-brand-400 hover:text-brand-300 text-xs flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                          Open Card
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t border-slate-800/60 pt-6">
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-purple-400" />
                  Upcoming (This Week)
                </h3>
                {followUpsThisWeek.length === 0 ? (
                  <p className="text-slate-500 text-xs py-2">No upcoming follow-ups</p>
                ) : (
                  <div className="divide-y divide-slate-800/50">
                    {followUpsThisWeek.map((item) => (
                      <div key={item._id} className="py-3 flex justify-between items-center group">
                        <div>
                          <p className="text-sm font-semibold text-white">{item.name}</p>
                          <p className="text-xs text-slate-400">
                            Due {new Date(item.followUpDate).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                        <Link to={`/leads/${item._id}`} className="text-brand-400 hover:text-brand-300 text-xs flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                          Open Card
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Admin & Manager Team Comparison chart */
            <div className="glass-panel rounded-2xl p-6 border border-slate-800/80">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                <Users className="h-4 w-4 text-brand-400" />
                Team Performance
              </h3>
              <div className="h-72">
                {performanceData.length === 0 ? (
                  <p className="text-slate-500 text-sm flex items-center justify-center h-full">No team data to display</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                      <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', borderColor: 'rgba(255, 255, 255, 0.08)', borderRadius: '12px' }}
                        labelStyle={{ color: '#ffffff', fontWeight: 'bold' }}
                      />
                      <Legend formatter={(value) => <span className="text-xs text-slate-400">{value}</span>} />
                      <Bar dataKey="Total" fill="#6366f1" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="Won" fill="#10b981" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Column 3: Recent Activity Feed */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800/80 flex flex-col">
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-6 flex items-center gap-2">
            <Loader2 className="h-4 w-4 text-brand-400" />
            Audit Logs
          </h3>

          <div className="space-y-4 overflow-y-auto max-h-[340px] pr-2 flex-1">
            {recentActivities.length === 0 ? (
              <p className="text-slate-500 text-xs">No recent activity logged</p>
            ) : (
              recentActivities.map((act) => (
                <div key={act._id} className="text-xs flex gap-3 relative pb-4 border-l border-slate-800 pl-4 last:border-0 last:pb-0">
                  <div className="absolute top-0.5 left-[-4.5px] w-2.5 h-2.5 rounded-full bg-brand-500 ring-4 ring-slate-950" />
                  <div className="flex-1">
                    <p className="text-slate-300 font-medium">
                      <span className="text-slate-100 font-bold">{act.userName}</span>{' '}
                      {act.action === 'LEAD_CREATED' && 'created lead'}
                      {act.action === 'LEAD_UPDATED' && 'updated lead'}
                      {act.action === 'LEAD_ASSIGNED' && 'reassigned lead'}
                      {act.action === 'LEAD_NOTE_ADDED' && 'added a note to'}
                      {act.action === 'LEAD_DELETED' && 'soft-deleted lead'}
                      {act.action === 'USER_CREATED' && 'created user'}
                      {act.action === 'USER_DEACTIVATED' && 'suspended user'}
                      {act.action === 'USER_REACTIVATED' && 'activated user'}
                      {act.action === 'COMPANY_SETTINGS_UPDATED' && 'updated company info'}{' '}
                      <span className="text-brand-400 font-semibold">
                        {act.metadata?.name || (act.targetType === 'Lead' ? 'Lead Card' : act.targetType)}
                      </span>
                    </p>
                    <span className="text-[10px] text-slate-500 block mt-1">
                      {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{' '}
                      ({new Date(act.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })})
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
