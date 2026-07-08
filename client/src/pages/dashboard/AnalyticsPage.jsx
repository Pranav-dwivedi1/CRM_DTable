import React, { useContext, useEffect, useState } from "react";
import {
  BarChart3,
  PieChart as PieChartIcon,
  TrendingUp,
  Users,
  CalendarDays,
  FileDown,
  Loader2,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import api from "../../services/api";
import { AuthContext } from "../../context/AuthContext";

const COLORS = [
  "#3b82f6",
  "#8b5cf6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#14b8a6",
];

export default function AnalyticsPage() {
  const { user } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [overview, analytics] = await Promise.all([
          api.get("/dashboard/overview"),
          api.get("/dashboard/analytics"),
        ]);
        if (overview.data.success && analytics.data.success) {
          setData({
            overview: overview.data.data,
            analytics: analytics.data.data,
          });
        }
      } catch (err) {
        console.error("Failed to load analytics page", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-8 text-sm text-slate-400">
        Analytics are temporarily unavailable.
      </div>
    );
  }

  const overviewMetrics = data.overview.metrics;
  const statusBreakdown = data.analytics.breakdowns.leadsByStatus || [];
  const sourceBreakdown = data.analytics.breakdowns.leadsBySource || [];
  const priorityBreakdown = data.analytics.breakdowns.leadsByPriority || [];
  const monthlyTrend = data.analytics.breakdowns.monthlyTrend || [];
  const weeklyTrend = data.analytics.breakdowns.weeklyTrend || [];
  const yearlyTrend = data.analytics.breakdowns.yearlyTrend || [];
  const teamPerformance = data.analytics.breakdowns.teamPerformance || [];

  const cards = [
    {
      label: "Total Leads",
      value: overviewMetrics.totalLeads,
      icon: BarChart3,
    },
    {
      label: "Revenue",
      value: `$${overviewMetrics.totalRevenue?.toLocaleString() || 0}`,
      icon: TrendingUp,
    },
    {
      label: "Meetings Today",
      value: overviewMetrics.meetingsScheduledToday,
      icon: CalendarDays,
    },
    { label: "Won Leads", value: overviewMetrics.wonLeads, icon: Users },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-3xl border border-slate-800 bg-slate-950/60 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Advanced analytics</h1>
          <p className="mt-1 text-sm text-slate-400">
            Role-aware reporting for managers, employees, and the master admin.
          </p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-300">
          <FileDown className="h-4 w-4" /> Export report
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {card.label}
                </span>
                <Icon className="h-4 w-4 text-brand-400" />
              </div>
              <div className="text-2xl font-semibold text-white">
                {card.value}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
            Lead status
          </h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusBreakdown.map((item) => ({
                    name: item._id,
                    value: item.count,
                  }))}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={2}
                >
                  {statusBreakdown.map((entry, index) => (
                    <Cell
                      key={entry._id || index}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
            Lead sources
          </h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={sourceBreakdown.map((item) => ({
                  name: item._id,
                  count: item.count,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
            Performance trend
          </h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyTrend.map((item) => ({
                  name: `${item._id.year}-${item._id.month}`,
                  value: item.count,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip />
                <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
            Team conversions
          </h2>
          <div className="space-y-3">
            {teamPerformance.length === 0 ? (
              <p className="text-sm text-slate-500">
                No team performance data available.
              </p>
            ) : (
              teamPerformance.map((row) => (
                <div
                  key={row.name}
                  className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-white">{row.name}</p>
                    <p className="text-xs text-slate-500">{row.total} leads</p>
                  </div>
                  <div className="text-sm font-semibold text-brand-400">
                    {row.rate.toFixed(1)}%
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
          Reports
        </h2>
        <div className="grid gap-3 md:grid-cols-3">
          {["Daily", "Weekly", "Monthly", "Quarterly", "Yearly"].map(
            (period) => (
              <div
                key={period}
                className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-300"
              >
                <div className="font-semibold text-white">{period}</div>
                <div className="mt-2 text-xs text-slate-500">
                  Export-ready summary for {period.toLowerCase()} performance.
                </div>
              </div>
            ),
          )}
        </div>
      </div>
    </div>
  );
}
