import React, { useContext, useEffect, useState, useCallback } from "react";
import {
  FileDown, Loader2, BarChart2, TrendingUp, DollarSign,
  Target, CheckCircle, XCircle, Calendar, RefreshCw, Printer, AlertCircle
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid, Legend, LineChart, Line
} from "recharts";
import api from "../../services/api";
import { AuthContext } from "../../context/AuthContext";

const PERIODS = ["Daily", "Weekly", "Monthly", "Quarterly", "Yearly"];

const CHART_COLORS = {
  leads: "#6366f1",
  won: "#10b981",
  lost: "#ef4444",
  revenue: "#f59e0b",
};

const TooltipStyle = {
  contentStyle: { backgroundColor: "rgba(15,23,42,0.97)", borderColor: "rgba(255,255,255,0.08)", borderRadius: "12px" },
  labelStyle: { color: "#fff", fontWeight: "bold" },
  itemStyle: { color: "#fff" },
};

function StatCard({ title, value, icon: Icon, colorClass, sub }) {
  return (
    <div className="glass-card rounded-2xl p-5 border border-slate-800">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{title}</p>
        <span className={`p-2 rounded-xl border ${colorClass}`}><Icon className="h-4 w-4" /></span>
      </div>
      <h3 className="text-2xl font-bold font-display text-white">{value}</h3>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}

export default function ReportsPage() {
  const { user } = useContext(AuthContext);
  const [period, setPeriod] = useState("Monthly");
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/reports?period=${period}`);
      if (res.data.success) {
        setReportData(res.data.data);
      } else {
        setError("Failed to load report data.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load report. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const handleCSVDownload = async () => {
    setDownloading(true);
    try {
      const res = await api.get(`/reports/export?period=${period}`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `CRM_Report_${period}_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("CSV download failed:", err);
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const r = reportData;
  // Align with reportController response shape
  const metrics = r?.metrics || {};
  const recentLeads = r?.recentLeads || [];
  const recentMeetings = r?.recentMeetings || [];
  // topAgents and leadsOverTime are optional (future enhancement)
  const topAgents = r?.topAgents || [];
  const leadsOverTime = r?.leadsOverTime || [];
  const revenueOverTime = r?.revenueOverTime || [];

  // Build combined chart if time-series data is available
  const combinedChart = leadsOverTime.map((item, idx) => ({
    name: item.label || item._id || `Period ${idx + 1}`,
    leads: item.count || 0,
    won: item.won || 0,
    revenue: revenueOverTime[idx]?.revenue || 0,
  }));


  return (
    <div className="space-y-6 fade-up" id="reports-printable">
      {/* Header */}
      <div className="glass-panel rounded-3xl border border-slate-800 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 print:border-none print:p-0">
        <div>
          <h1 className="text-2xl font-bold font-display text-white flex items-center gap-3">
            <BarChart2 className="h-7 w-7 text-brand-400" />
            Reports & Analytics
          </h1>
          <p className="text-slate-400 text-sm mt-1">Business insights with exportable data across time periods.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap print:hidden">
          <button onClick={fetchReport}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 text-sm transition-all">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          <button onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white text-sm transition-all">
            <Printer className="h-4 w-4" /> Print PDF
          </button>
          <button onClick={handleCSVDownload} disabled={downloading || !reportData}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 text-white text-sm font-semibold shadow-lg shadow-brand-500/20 hover:shadow-brand-500/30 transition-all disabled:opacity-60">
            {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
            Export CSV
          </button>
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex gap-2 flex-wrap print:hidden">
        {PERIODS.map(p => (
          <button key={p} onClick={() => setPeriod(p)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
              period === p
                ? "bg-brand-500/15 text-brand-400 border-brand-500/40"
                : "border-slate-800 text-slate-400 hover:border-slate-600 hover:text-white"
            }`}>
            {p}
          </button>
        ))}
      </div>

      {/* Error State */}
      {error && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <AlertCircle className="h-5 w-5 shrink-0" /> {error}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 text-brand-500 animate-spin" />
        </div>
      ) : reportData ? (
        <div className="space-y-6">
          {/* Summary print header */}
          <div className="hidden print:block mb-4">
            <h2 className="text-xl font-bold text-black">{period} CRM Report</h2>
            <p className="text-sm text-gray-500">Generated: {new Date().toLocaleString()}</p>
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
            <StatCard title="Total Leads"   value={metrics.totalLeads || 0}        icon={Target}       colorClass="text-brand-400 bg-brand-500/10 border-brand-500/20" />
            <StatCard title="Won Leads"     value={metrics.wonLeads || 0}           icon={CheckCircle}  colorClass="text-green-400 bg-green-500/10 border-green-500/20" />
            <StatCard title="Lost Leads"    value={metrics.lostLeads || 0}          icon={XCircle}      colorClass="text-red-400 bg-red-500/10 border-red-500/20" />
            <StatCard title="Revenue"       value={`$${(metrics.totalRevenue || 0).toLocaleString()}`} icon={DollarSign} colorClass="text-emerald-400 bg-emerald-500/10 border-emerald-500/20" />
            <StatCard title="Win Rate"      value={metrics.totalLeads ? `${((metrics.wonLeads / metrics.totalLeads) * 100).toFixed(1)}%` : "0%"}
              icon={TrendingUp} colorClass="text-yellow-400 bg-yellow-500/10 border-yellow-500/20"
              sub={`${metrics.wonLeads || 0} of ${metrics.totalLeads || 0} leads converted`} />
          </div>

          {/* Combined leads + revenue over time */}
          {combinedChart.length > 0 && (
            <div className="glass-panel rounded-2xl p-6 border border-slate-800/80">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-6">Performance Over Time — {period}</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={combinedChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                    <YAxis yAxisId="left" stroke="#64748b" fontSize={11} allowDecimals={false} />
                    <YAxis yAxisId="right" orientation="right" stroke="#64748b" fontSize={11} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                    <Tooltip {...TooltipStyle} />
                    <Legend formatter={v => <span className="text-xs text-slate-300 capitalize">{v}</span>} />
                    <Bar yAxisId="left" dataKey="leads" fill={CHART_COLORS.leads} radius={[3, 3, 0, 0]} name="Leads" />
                    <Bar yAxisId="left" dataKey="won" fill={CHART_COLORS.won} radius={[3, 3, 0, 0]} name="Won" />
                    <Line yAxisId="right" type="monotone" dataKey="revenue" stroke={CHART_COLORS.revenue} strokeWidth={2} dot={false} name="Revenue" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Top Agents — shown when API provides this data */}
          {topAgents.length > 0 && (
            <div className="glass-panel rounded-2xl p-6 border border-slate-800/80">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-5">Top Performing Agents — {period}</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/40">
                      <th className="text-left px-4 py-3 text-slate-400 font-bold uppercase">Rank</th>
                      <th className="text-left px-4 py-3 text-slate-400 font-bold uppercase">Agent</th>
                      <th className="text-center px-4 py-3 text-slate-400 font-bold uppercase">Leads</th>
                      <th className="text-center px-4 py-3 text-slate-400 font-bold uppercase">Won</th>
                      <th className="text-right px-4 py-3 text-slate-400 font-bold uppercase">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {topAgents.map((agent, i) => (
                      <tr key={i} className="hover:bg-slate-900/30 transition-colors">
                        <td className="px-4 py-3 font-bold">{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i+1}`}</td>
                        <td className="px-4 py-3 text-white font-semibold">{agent.name || agent._id}</td>
                        <td className="px-4 py-3 text-center text-slate-300">{agent.total || 0}</td>
                        <td className="px-4 py-3 text-center text-green-400 font-bold">{agent.won || 0}</td>
                        <td className="px-4 py-3 text-right text-emerald-400 font-bold">${(agent.revenue || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Recent Leads in Period */}
          {recentLeads.length > 0 && (
            <div className="glass-panel rounded-2xl p-6 border border-slate-800/80">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-5">Recent Leads — {period}</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/40">
                      <th className="text-left px-4 py-3 text-slate-400 font-bold uppercase">Lead</th>
                      <th className="text-left px-4 py-3 text-slate-400 font-bold uppercase hidden md:table-cell">Company</th>
                      <th className="text-left px-4 py-3 text-slate-400 font-bold uppercase hidden lg:table-cell">Assigned To</th>
                      <th className="text-center px-4 py-3 text-slate-400 font-bold uppercase">Status</th>
                      <th className="text-right px-4 py-3 text-slate-400 font-bold uppercase">Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {recentLeads.map((lead, i) => (
                      <tr key={lead._id || i} className="hover:bg-slate-900/30 transition-colors">
                        <td className="px-4 py-3 text-white font-semibold">{lead.name}</td>
                        <td className="px-4 py-3 text-slate-400 hidden md:table-cell">{lead.clientCompanyName || "—"}</td>
                        <td className="px-4 py-3 text-slate-300 hidden lg:table-cell">{lead.assignedTo?.name || "Unassigned"}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                            lead.status === "Won" ? "text-green-400 bg-green-500/10 border border-green-500/20" :
                            lead.status === "Lost" ? "text-red-400 bg-red-500/10 border border-red-500/20" :
                            "text-brand-400 bg-brand-500/10 border border-brand-500/20"
                          }`}>{lead.status}</span>
                        </td>
                        <td className="px-4 py-3 text-right text-emerald-400 font-bold">${(lead.estimatedValue || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}


          {/* All Periods Quick Summary */}
          <div className="glass-panel rounded-2xl p-6 border border-slate-800/80">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-5">Quick Export by Period</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
              {PERIODS.map(p => (
                <div key={p} className="glass-card rounded-xl border border-slate-800 p-4">
                  <p className="text-xs font-semibold text-white mb-3">{p} Report</p>
                  <button
                    onClick={async () => {
                      try {
                        const res = await api.get(`/reports/export?period=${p}`, { responseType: "blob" });
                        const url = window.URL.createObjectURL(new Blob([res.data]));
                        const link = document.createElement("a");
                        link.href = url;
                        link.setAttribute("download", `CRM_${p}_Report_${new Date().toISOString().slice(0, 10)}.csv`);
                        document.body.appendChild(link);
                        link.click();
                        link.remove();
                        window.URL.revokeObjectURL(url);
                      } catch (err) {
                        console.error("Download failed:", err);
                      }
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-brand-500/20 bg-brand-500/10 text-brand-400 text-xs hover:bg-brand-500/20 transition-all">
                    <FileDown className="h-3.5 w-3.5" /> Download CSV
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {/* Print Styles - inlined */}
      <style>{`
        @media print {
          body { background: white !important; color: black !important; }
          .print\\:hidden { display: none !important; }
          .glass-panel, .glass-card {
            background: white !important;
            border: 1px solid #e5e7eb !important;
            box-shadow: none !important;
          }
          .text-white { color: black !important; }
          .text-slate-400, .text-slate-500 { color: #6b7280 !important; }
          .text-brand-400 { color: #4f46e5 !important; }
          .text-green-400 { color: #059669 !important; }
          .text-red-400 { color: #dc2626 !important; }
        }
      `}</style>
    </div>
  );
}
