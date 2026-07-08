import React, { useContext, useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Target,
  Users,
  Settings,
  LogOut,
  Activity,
  User,
  ChevronDown,
  ChevronRight,
  BarChart2,
  PlusCircle,
  CalendarClock,
  CheckCircle2,
  XCircle,
  List,
  FileDown,
  MessageSquare,
  UserCheck,
  Building2,
} from "lucide-react";
import { AuthContext } from "../context/AuthContext";

export default function Sidebar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [crmOpen, setCrmOpen] = useState(true);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const isCrmActive = location.pathname.startsWith("/crm");

  const topNavItems = [
    {
      to: "/",
      name: "Dashboard",
      icon: LayoutDashboard,
      roles: ["masterAdmin", "manager", "employee"],
      exact: true,
    },
    {
      to: "/leads",
      name: "All Leads",
      icon: Target,
      roles: ["masterAdmin", "manager", "employee"],
      exact: false,
    },
    {
      to: "/analytics",
      name: "Analytics",
      icon: BarChart2,
      roles: ["masterAdmin", "manager", "employee"],
      exact: false,
    },
    {
      to: "/reports",
      name: "Reports",
      icon: FileDown,
      roles: ["masterAdmin", "manager", "employee"],
      exact: false,
    },
    {
      to: "/users",
      name: "Team Members",
      icon: Users,
      roles: ["masterAdmin", "manager"],
      exact: false,
    },
    {
      to: "/settings/companies",
      name: "Companies",
      icon: Building2,
      roles: ["masterAdmin"],
      exact: false,
    },
    {
      to: "/settings",
      name: "Settings",
      icon: Settings,
      roles: ["masterAdmin"],
      exact: false,
    },
  ];

  const crmNavItems = [
    {
      to: "/crm/dashboard",
      name: "CRM Dashboard",
      icon: BarChart2,
      roles: ["masterAdmin", "manager", "employee"],
    },
    {
      to: "/crm/pipeline",
      name: "Pipeline Board",
      icon: Target,
      roles: ["masterAdmin", "manager", "employee"],
    },
    {
      to: "/crm/leads/new",
      name: "Create New Lead",
      icon: PlusCircle,
      roles: ["masterAdmin", "manager", "employee"],
    },
    {
      to: "/crm/meetings",
      name: "Meetings",
      icon: CalendarClock,
      roles: ["masterAdmin", "manager", "employee"],
    },
    {
      to: "/crm/leads/converted",
      name: "Converted",
      icon: CheckCircle2,
      roles: ["masterAdmin", "manager", "employee"],
    },
    {
      to: "/crm/leads/lost",
      name: "Lost",
      icon: XCircle,
      roles: ["masterAdmin", "manager", "employee"],
    },
    {
      to: "/crm/leads",
      name: "All Leads",
      icon: List,
      roles: ["masterAdmin", "manager", "employee"],
    },
    {
      to: "/crm/clients",
      name: "Clients",
      icon: UserCheck,
      roles: ["masterAdmin", "manager", "employee"],
    },
    {
      to: "/crm/communications",
      name: "Communications",
      icon: MessageSquare,
      roles: ["masterAdmin", "manager", "employee"],
    },
  ];

  const getRoleBadge = (role) => {
    switch (role) {
      case "masterAdmin":
        return "Admin";
      case "manager":
        return "Manager";
      case "employee":
        return "Agent";
      default:
        return "User";
    }
  };

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
      isActive
        ? "bg-gradient-to-r from-brand-600/25 to-brand-500/5 text-white border-l-4 border-brand-500 font-semibold shadow-inner shadow-brand-500/10"
        : "text-slate-400 hover:bg-slate-900 hover:text-white border-l-4 border-transparent"
    }`;

  const crmSubLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 ${
      isActive
        ? "bg-brand-500/10 text-brand-400 border border-brand-500/30 font-semibold"
        : "text-slate-400 hover:bg-slate-900/60 hover:text-white border border-transparent"
    }`;

  return (
    <aside className="w-64 shrink-0 h-screen sticky top-0 glass-panel border-r border-slate-800 flex flex-col justify-between z-20">
      <div className="flex flex-col min-h-0 flex-1">
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-800/80 flex items-center gap-3 shrink-0">
          <div className="flex items-center justify-center p-2 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-500">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-md font-bold font-display text-white tracking-tight leading-none">
              TenantFlow
            </h2>
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
              Workspace
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1 mt-2 overflow-y-auto flex-1">
          {/* Top-level nav items */}
          {topNavItems.map((item) => {
            const hasAccess = item.roles.includes(user?.role);
            if (!hasAccess) return null;
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.exact}
                className={navLinkClass}
              >
                <Icon className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
                {item.name}
              </NavLink>
            );
          })}

          {/* CRM Section Divider */}
          <div className="pt-3 pb-1">
            <button
              onClick={() => setCrmOpen((prev) => !prev)}
              className={`w-full flex items-center justify-between px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-200 ${
                isCrmActive
                  ? "text-brand-400 bg-brand-500/5"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <span className="flex items-center gap-2">
                <Target className="h-3.5 w-3.5" />
                CRM
              </span>
              {crmOpen ? (
                <ChevronDown className="h-3.5 w-3.5 transition-transform duration-200" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 transition-transform duration-200" />
              )}
            </button>
          </div>

          {/* CRM Sub-items */}
          {crmOpen && (
            <div className="pl-3 space-y-1 border-l border-slate-800/60 ml-4">
              {crmNavItems.map((item) => {
                const hasAccess = item.roles.includes(user?.role);
                if (!hasAccess) return null;
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === "/crm/leads"}
                    className={crmSubLinkClass}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {item.name}
                  </NavLink>
                );
              })}
            </div>
          )}
        </nav>
      </div>

      {/* User Footer Profile */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 shrink-0">
        <div className="flex items-center gap-3 mb-4 p-2 rounded-xl bg-slate-900/50 border border-slate-800/50">
          <div className="h-10 w-10 rounded-xl bg-brand-600/10 border border-brand-500/20 text-brand-400 flex items-center justify-center font-bold">
            {user?.name ? (
              user.name.charAt(0).toUpperCase()
            ) : (
              <User className="h-5 w-5" />
            )}
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-semibold text-white truncate">
              {user?.name}
            </h4>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold bg-brand-500/10 text-brand-400 border border-brand-500/20 mt-1">
              {getRoleBadge(user?.role)}
            </span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
