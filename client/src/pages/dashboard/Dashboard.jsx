import React, { useContext, useEffect, useState } from "react";
import {
  Target, CheckCircle, TrendingUp, Users, Calendar, Loader2, ArrowRight,
  UserCheck, Building, DollarSign, XCircle, AlertCircle, Briefcase,
  BarChart2, Award, ClipboardList
} from "lucide-react";
import {
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, Tooltip, Legend, CartesianGrid,
} from "recharts";
import { AuthContext } from "../../context/AuthContext";
import api from "../../services/api";
import { useNavigate } from "react-router-dom";

const STATUS_COLORS = {
  New: "#3b82f6",
  Contacted: "#6366f1",
  Qualified: "#a855f7",
  "Proposal Sent": "#eab308",
  Negotiation: "#f97316",
  Won: "#10b981",
  Lost: "#ef4444",
};
const PRIORITY_COLORS = { high: "#ef4444", medium: "#f97316", low: "#3b82f6" };
const DEFAULT_COLORS = ["#3b82f6","#6366f1","#a855f7","#10b981","#ef4444","#f59e0b","#ec4899"];

const TooltipStyle = {
  contentStyle: { backgroundColor: "rgba(15,23,42,0.97)", borderColor: "rgba(255,255,255,0.08)", borderRadius: "12px" },
  itemStyle: { color: "#fff" },
  labelStyle: { color: "#fff", fontWeight: "bold" },
};

// Reusable metric card
function MetricCard({ title, value, icon: Icon, colorClass, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`glass-card rounded-2xl p-5 border border-slate-800 hover:border-slate-600 transition-all cursor-pointer group flex items-center justify-between ${onClick ? "hover:scale-[1.01]" : ""}`}
    >
      <div>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">{title}</p>
        <h3 className="text-2xl font-bold font-display text-white">{value ?? "—"}</h3>
      </div>
      <span className={`p-2.5 rounded-xl border ${colorClass} group-hover:scale-110 transition-transform duration-200`}>
        <Icon className="h-5 w-5" />
      </span>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await api.get("/dashboard/overview");
        if (res.data.success) setData(res.data.data);
      } catch (err) {
        console.error("Failed to load dashboard:", err);
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
        <AlertCircle className="h-10 w-10 text-slate-600 mx-auto mb-3" />
        <p className="text-slate-400 text-sm">Failed to load dashboard data. Please refresh.</p>
      </div>
    );
  }

  const { metrics = {}, breakdowns = {}, teamPerformance = [], meetings = [], recentActivities = [] } = data;
  const goLeads = (status) => navigate(status ? `/leads?status=${encodeURIComponent(status)}` : "/leads");

  /* ===================== MASTER ADMIN ===================== */
  const MasterAdminDashboard = () => {
    const tabs = ["overview", "analytics", "team"];

    const cards = [
      { title: "Total Companies",      value: metrics.totalCompanies,           icon: Building,       c: "text-blue-400 bg-blue-500/10 border-blue-500/20",    nav: () => navigate("/settings") },
      { title: "Total Clients",         value: metrics.totalClients,             icon: UserCheck,      c: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", nav: () => navigate("/crm/clients") },
      { title: "Total Leads",           value: metrics.totalLeads,               icon: Target,         c: "text-brand-400 bg-brand-500/10 border-brand-500/20", nav: () => goLeads() },
      { title: "New Leads",             value: metrics.newLeads,                 icon: AlertCircle,    c: "text-blue-400 bg-blue-500/10 border-blue-500/20",    nav: () => goLeads("New") },
      { title: "Contacted",             value: metrics.contactedLeads,           icon: ClipboardList,  c: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20", nav: () => goLeads("Contacted") },
      { title: "Qualified",             value: metrics.qualifiedLeads,           icon: Award,          c: "text-purple-400 bg-purple-500/10 border-purple-500/20", nav: () => goLeads("Qualified") },
      { title: "Proposal Sent",         value: metrics.proposalSentLeads,        icon: BarChart2,      c: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20", nav: () => goLeads("Proposal Sent") },
      { title: "Negotiation",           value: metrics.negotiationLeads,         icon: TrendingUp,     c: "text-orange-400 bg-orange-500/10 border-orange-500/20", nav: () => goLeads("Negotiation") },
      { title: "Won Leads",             value: metrics.wonLeads,                 icon: CheckCircle,    c: "text-green-400 bg-green-500/10 border-green-500/20",  nav: () => goLeads("Won") },
      { title: "Lost Leads",            value: metrics.lostLeads,                icon: XCircle,        c: "text-red-400 bg-red-500/10 border-red-500/20",       nav: () => goLeads("Lost") },
      { title: "Total Employees",       value: metrics.totalEmployees,           icon: Users,          c: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", nav: () => navigate("/users") },
      { title: "Total Managers",        value: metrics.totalManagers,            icon: Briefcase,      c: "text-purple-400 bg-purple-500/10 border-purple-500/20", nav: () => navigate("/users") },
      { title: "Total Revenue",         value: `$${(metrics.totalRevenue||0).toLocaleString()}`,   icon: DollarSign, c: "text-green-400 bg-green-500/10 border-green-500/20", nav: () => navigate("/reports") },
      { title: "Monthly Revenue",       value: `$${(metrics.monthlyRevenue||0).toLocaleString()}`, icon: DollarSign, c: "text-teal-400 bg-teal-500/10 border-teal-500/20", nav: () => navigate("/reports") },
      { title: "Weekly Revenue",        value: `$${(metrics.weeklyRevenue||0).toLocaleString()}`,  icon: DollarSign, c: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", nav: () => navigate("/reports") },
      { title: "Yearly Revenue",        value: `$${(metrics.yearlyRevenue||0).toLocaleString()}`,  icon: DollarSign, c: "text-green-400 bg-green-500/10 border-green-500/20", nav: () => navigate("/reports") },
      { title: "Meetings Today",        value: metrics.meetingsScheduledToday,   icon: Calendar,       c: "text-brand-400 bg-brand-500/10 border-brand-500/20", nav: () => navigate("/crm/meetings") },
      { title: "Upcoming Meetings",     value: metrics.upcomingMeetings,         icon: Calendar,       c: "text-purple-400 bg-purple-500/10 border-purple-500/20", nav: () => navigate("/crm/meetings") },
      { title: "Completed Meetings",    value: metrics.completedMeetings,        icon: CheckCircle,    c: "text-green-400 bg-green-500/10 border-green-500/20",  nav: () => navigate("/crm/meetings") },
    ];

    const statusPieData  = (breakdowns.leadsByStatus  || []).map(i => ({ name: i._id, value: i.count }));
    const priorityPieData = (breakdowns.leadsByPriority || []).map(i => ({ name: i._id, value: i.count }));
    const sourceBarData  = (breakdowns.leadsBySource  || []).map(i => ({ name: i._id, count: i.count }));

    const sortedPerf = [...teamPerformance].sort((a, b) => b.won - a.won);

    return (
      <div className="space-y-6">
        {/* Tabs */}
        <div className="flex border-b border-slate-800 gap-6">
          {tabs.map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`pb-3 text-sm font-semibold capitalize transition-all border-b-2 ${activeTab === t ? "border-brand-500 text-white" : "border-transparent text-slate-400 hover:text-white"}`}>
              {t === "team" ? "Team Performance" : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {cards.map((c, i) => (
                <MetricCard key={i} title={c.title} value={c.value} icon={c.icon} colorClass={c.c} onClick={c.nav} />
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Rankings */}
              <div className="lg:col-span-2 glass-panel rounded-2xl p-6 border border-slate-800/80">
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-5 flex items-center gap-2">
                  <Award className="h-4 w-4 text-brand-400" /> Agent Rankings
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="glass-card rounded-xl p-4 border border-slate-800 text-center">
                    <p className="text-[9px] text-slate-500 uppercase font-bold mb-1">Top Performer</p>
                    <p className="text-sm font-bold text-emerald-400">{sortedPerf[0]?.name || "—"}</p>
                    <p className="text-xs text-slate-500 mt-1">{sortedPerf[0]?.won ?? 0} wins</p>
                  </div>
                  <div className="glass-card rounded-xl p-4 border border-slate-800 text-center">
                    <p className="text-[9px] text-slate-500 uppercase font-bold mb-1">Win Rate</p>
                    <p className="text-sm font-bold text-brand-400">
                      {metrics.totalLeads ? `${((metrics.wonLeads / metrics.totalLeads) * 100).toFixed(1)}%` : "0%"}
                    </p>
                  </div>
                  <div className="glass-card rounded-xl p-4 border border-slate-800 text-center">
                    <p className="text-[9px] text-slate-500 uppercase font-bold mb-1">Needs Attention</p>
                    <p className="text-sm font-bold text-red-400">{sortedPerf[sortedPerf.length - 1]?.name || "—"}</p>
                  </div>
                </div>
              </div>

              {/* Recent Meetings */}
              <div className="glass-panel rounded-2xl p-6 border border-slate-800/80">
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-brand-400" /> Upcoming
                </h3>
                <div className="space-y-2 overflow-y-auto max-h-48">
                  {meetings.length === 0 ? (
                    <p className="text-slate-500 text-xs">No upcoming meetings</p>
                  ) : meetings.slice(0, 5).map(m => (
                    <div key={m._id} className="p-2.5 rounded-xl bg-slate-900/40 border border-slate-800">
                      <p className="text-xs font-semibold text-white truncate">{m.title}</p>
                      <p className="text-[10px] text-slate-400">{new Date(m.scheduledAt).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="glass-panel rounded-2xl p-6 border border-slate-800/80">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-5">Audit Log</h3>
              <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                {recentActivities.length === 0 ? (
                  <p className="text-slate-500 text-xs">No recent activity</p>
                ) : recentActivities.map(a => (
                  <div key={a._id} className="flex gap-3 relative pb-3 border-l border-slate-800 pl-4 last:border-0 last:pb-0">
                    <div className="absolute top-0.5 left-[-4.5px] w-2.5 h-2.5 rounded-full bg-brand-500 ring-4 ring-slate-950" />
                    <div className="flex-1">
                      <p className="text-xs text-slate-300">
                        <span className="text-white font-bold">{a.userName}</span>{" "}
                        {a.action.replace(/_/g, " ").toLowerCase()}{" "}
                        <span className="text-brand-400 font-semibold">{a.metadata?.name || a.targetType}</span>
                      </p>
                      <span className="text-[10px] text-slate-500">{new Date(a.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === "analytics" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-panel rounded-2xl p-6 border border-slate-800/80">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-6">Leads by Status</h3>
              <div className="h-72 flex items-center justify-center">
                {statusPieData.length === 0 ? <p className="text-slate-500 text-sm">No data</p> : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={statusPieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                        {statusPieData.map((e, i) => <Cell key={i} fill={STATUS_COLORS[e.name] || DEFAULT_COLORS[i % DEFAULT_COLORS.length]} />)}
                      </Pie>
                      <Tooltip {...TooltipStyle} />
                      <Legend verticalAlign="bottom" height={36} formatter={v => <span className="text-xs text-slate-300">{v}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="glass-panel rounded-2xl p-6 border border-slate-800/80">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-6">Leads by Priority</h3>
              <div className="h-72 flex items-center justify-center">
                {priorityPieData.length === 0 ? <p className="text-slate-500 text-sm">No data</p> : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={priorityPieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                        {priorityPieData.map((e, i) => <Cell key={i} fill={PRIORITY_COLORS[e.name] || DEFAULT_COLORS[i % DEFAULT_COLORS.length]} />)}
                      </Pie>
                      <Tooltip {...TooltipStyle} />
                      <Legend verticalAlign="bottom" height={36} formatter={v => <span className="text-xs text-slate-300">{v}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="glass-panel rounded-2xl p-6 border border-slate-800/80 md:col-span-2">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-6">Leads by Source</h3>
              <div className="h-64">
                {sourceBarData.length === 0 ? <p className="text-slate-500 text-sm flex items-center justify-center h-full">No data</p> : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sourceBarData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                      <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                      <Tooltip {...TooltipStyle} />
                      <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Team Tab */}
        {activeTab === "team" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass-panel rounded-2xl p-6 border border-slate-800/80">
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-6">Agent Performance</h3>
                <div className="h-64">
                  {teamPerformance.length === 0 ? <p className="text-slate-500 text-sm flex items-center justify-center h-full">No data</p> : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={teamPerformance}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                        <YAxis stroke="#64748b" fontSize={10} allowDecimals={false} />
                        <Tooltip {...TooltipStyle} />
                        <Legend formatter={v => <span className="text-xs text-slate-300">{v}</span>} />
                        <Bar dataKey="total" fill="#6366f1" radius={[3, 3, 0, 0]} name="Total" />
                        <Bar dataKey="won" fill="#10b981" radius={[3, 3, 0, 0]} name="Won" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              <div className="glass-panel rounded-2xl p-6 border border-slate-800/80">
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-5">Conversion Leaderboard</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-800">
                        <th className="text-left py-2 text-slate-400 font-bold uppercase">Agent</th>
                        <th className="text-center py-2 text-slate-400 font-bold uppercase">Leads</th>
                        <th className="text-center py-2 text-slate-400 font-bold uppercase">Won</th>
                        <th className="text-right py-2 text-slate-400 font-bold uppercase">Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40">
                      {sortedPerf.map((m, i) => (
                        <tr key={i} className="hover:bg-slate-900/30 transition-colors">
                          <td className="py-3 text-white font-medium flex items-center gap-2">
                            {i === 0 && <span className="text-yellow-400">🥇</span>}
                            {i === 1 && <span className="text-slate-400">🥈</span>}
                            {i === 2 && <span className="text-orange-400">🥉</span>}
                            {m.name}
                          </td>
                          <td className="py-3 text-center text-slate-300">{m.total}</td>
                          <td className="py-3 text-center text-green-400 font-bold">{m.won}</td>
                          <td className="py-3 text-right font-bold text-brand-400">{(m.rate || 0).toFixed(1)}%</td>
                        </tr>
                      ))}
                      {teamPerformance.length === 0 && (
                        <tr><td colSpan={4} className="text-center py-8 text-slate-500">No performance data yet.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  /* ===================== MANAGER ===================== */
  const ManagerDashboard = () => {
    const statusPieData = (breakdowns.leadsByStatus || []).map(i => ({ name: i._id, value: i.count }));

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard title="Team Leads"  value={metrics.totalLeads}  icon={Target}    colorClass="text-brand-400 bg-brand-500/10 border-brand-500/20"   onClick={() => goLeads()} />
          <MetricCard title="Won"         value={metrics.wonLeads}    icon={CheckCircle} colorClass="text-green-400 bg-green-500/10 border-green-500/20"   onClick={() => goLeads("Won")} />
          <MetricCard title="Win Rate"    value={metrics.totalLeads ? `${((metrics.wonLeads/metrics.totalLeads)*100).toFixed(1)}%` : "0%"} icon={TrendingUp} colorClass="text-brand-400 bg-brand-500/10 border-brand-500/20" />
          <MetricCard title="Revenue"     value={`$${(metrics.totalRevenue||0).toLocaleString()}`} icon={DollarSign} colorClass="text-green-400 bg-green-500/10 border-green-500/20" onClick={() => navigate("/reports")} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-panel rounded-2xl p-6 border border-slate-800/80">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-6">Team Pipeline Status</h3>
            <div className="h-72 flex items-center justify-center">
              {statusPieData.length === 0 ? <p className="text-slate-500 text-sm">No data</p> : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusPieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                      {statusPieData.map((e, i) => <Cell key={i} fill={STATUS_COLORS[e.name] || DEFAULT_COLORS[i % DEFAULT_COLORS.length]} />)}
                    </Pie>
                    <Tooltip {...TooltipStyle} />
                    <Legend verticalAlign="bottom" height={36} formatter={v => <span className="text-xs text-slate-300">{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-6 border border-slate-800/80">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-6">Team Agent Performance</h3>
            <div className="h-72">
              {teamPerformance.length === 0 ? <p className="text-slate-500 text-sm flex items-center justify-center h-full">No data</p> : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={teamPerformance}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                    <YAxis stroke="#64748b" fontSize={10} allowDecimals={false} />
                    <Tooltip {...TooltipStyle} />
                    <Legend formatter={v => <span className="text-xs text-slate-300">{v}</span>} />
                    <Bar dataKey="total" fill="#6366f1" radius={[3, 3, 0, 0]} name="Total" />
                    <Bar dataKey="won" fill="#10b981" radius={[3, 3, 0, 0]} name="Won" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Upcoming Meetings */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800/80">
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-brand-400" /> Upcoming Team Meetings
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {meetings.length === 0 ? (
              <p className="text-slate-500 text-xs">No upcoming meetings for your team.</p>
            ) : meetings.slice(0, 6).map(m => (
              <div key={m._id} className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/60 flex justify-between items-center">
                <div>
                  <p className="text-xs font-semibold text-white truncate">{m.title}</p>
                  <p className="text-[10px] text-slate-400">{m.leadId?.name && `Lead: ${m.leadId.name}`}</p>
                </div>
                <span className="text-[10px] text-slate-500 shrink-0 ml-2">{new Date(m.scheduledAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  /* ===================== EMPLOYEE ===================== */
  const EmployeeDashboard = () => {
    const statusPieData = (breakdowns.leadsByStatus || []).map(i => ({ name: i._id, value: i.count }));

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard title="My Leads"   value={metrics.totalLeads}  icon={Target}     colorClass="text-brand-400 bg-brand-500/10 border-brand-500/20"   onClick={() => goLeads()} />
          <MetricCard title="Won Deals"  value={metrics.wonLeads}    icon={CheckCircle} colorClass="text-green-400 bg-green-500/10 border-green-500/20"   onClick={() => goLeads("Won")} />
          <MetricCard title="My Revenue" value={`$${(metrics.totalRevenue||0).toLocaleString()}`} icon={DollarSign} colorClass="text-emerald-400 bg-emerald-500/10 border-emerald-500/20" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 glass-panel rounded-2xl p-6 border border-slate-800/80">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-6">My Pipeline Distribution</h3>
            <div className="h-72 flex items-center justify-center">
              {statusPieData.length === 0 ? <p className="text-slate-500 text-sm">No leads yet. Create your first lead!</p> : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusPieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                      {statusPieData.map((e, i) => <Cell key={i} fill={STATUS_COLORS[e.name] || DEFAULT_COLORS[i % DEFAULT_COLORS.length]} />)}
                    </Pie>
                    <Tooltip {...TooltipStyle} />
                    <Legend verticalAlign="bottom" height={36} formatter={v => <span className="text-xs text-slate-300">{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-6 border border-slate-800/80">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-brand-400" /> My Meetings
            </h3>
            <div className="space-y-2 overflow-y-auto max-h-64">
              {meetings.length === 0 ? (
                <p className="text-slate-500 text-xs">No meetings scheduled.</p>
              ) : meetings.slice(0, 5).map(m => (
                <div key={m._id} className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/60">
                  <p className="text-xs font-semibold text-white">{m.title}</p>
                  <p className="text-[10px] text-slate-400 mt-1">{new Date(m.scheduledAt).toLocaleString()}</p>
                  <span className={`inline-block mt-1 text-[9px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                    m.status === "Completed" ? "text-green-400 bg-green-500/10 border-green-500/20" :
                    m.status === "Cancelled" ? "text-red-400 bg-red-500/10 border-red-500/20" :
                    "text-blue-400 bg-blue-500/10 border-blue-500/20"
                  }`}>{m.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 fade-up">
      {/* Header */}
      <div className="glass-panel rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900/90 to-slate-950/80 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-white tracking-tight">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {user?.role === "masterAdmin" && "Full system overview — all companies, leads, and team performance."}
            {user?.role === "manager" && "Your team's pipeline, performance metrics, and upcoming meetings."}
            {user?.role === "employee" && "Your personal pipeline, meetings, and progress at a glance."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/crm/leads/new")}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-semibold px-4 py-2 rounded-xl text-sm shadow-lg shadow-brand-500/20 transition-all">
            <Target className="h-4 w-4" /> New Lead
          </button>
        </div>
      </div>

      {user?.role === "masterAdmin" && <MasterAdminDashboard />}
      {user?.role === "manager"     && <ManagerDashboard />}
      {user?.role === "employee"    && <EmployeeDashboard />}
    </div>
  );
}
