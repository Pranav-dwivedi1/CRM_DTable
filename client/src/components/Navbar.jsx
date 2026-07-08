import React, { useContext, useState, useEffect } from "react";
import { Bell, Calendar, User, ChevronDown, Check, Search, Building, Target, CheckSquare, MessageSquare } from "lucide-react";
import { AuthContext } from "../context/AuthContext";
import api from "../services/api";
import { Link, useNavigate } from "react-router-dom";
import { getSocket } from "../services/socket";

export default function Navbar({ title }) {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);

  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Fetch notifications and connect socket
  useEffect(() => {
    if (!user) return;

    const loadNotifications = async () => {
      try {
        const res = await api.get("/notifications");
        if (res.data.success) {
          setNotifications(res.data.data || []);
          setUnreadCount(res.data.unreadCount || 0);
        }
      } catch (e) {
        console.error("Failed to load notifications in header:", e);
      }
    };

    loadNotifications();

    const socket = getSocket();
    if (socket) {
      const handleNewNotification = (newNotif) => {
        setNotifications((prev) => [newNotif, ...prev]);
        setUnreadCount((prev) => prev + 1);
      };
      socket.on("notification:new", handleNewNotification);
      return () => {
        socket.off("notification:new", handleNewNotification);
      };
    }
  }, [user]);

  // Handle marking read
  const handleMarkRead = async (id) => {
    try {
      const res = await api.patch(`/notifications/${id}/read`);
      if (res.data.success) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (e) {
      console.error("Failed to mark notification read:", e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await api.patch("/notifications/read-all");
      if (res.data.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (e) {
      console.error("Failed to mark all notifications read:", e);
    }
  };

  // Handle global search
  const handleSearchChange = async (val) => {
    setSearchQuery(val);
    if (!val.trim()) {
      setSearchResults(null);
      setShowSearchResults(false);
      return;
    }

    try {
      const res = await api.get(`/search?q=${encodeURIComponent(val)}`);
      if (res.data.success) {
        setSearchResults(res.data.data);
        setShowSearchResults(true);
      }
    } catch (e) {
      console.error("Search failed:", e);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults(null);
    setShowSearchResults(false);
  };

  return (
    <header className="h-16 px-8 border-b border-slate-800/80 bg-slate-950/20 backdrop-blur-md sticky top-0 flex items-center justify-between z-30">
      {/* Title */}
      <h1 className="text-xl font-bold font-display text-white tracking-tight shrink-0">
        {title}
      </h1>

      {/* Global Search Bar */}
      <div className="relative flex-1 max-w-md mx-8 hidden md:block">
        <div className="relative">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search leads, clients, companies, meetings..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => searchQuery && setShowSearchResults(true)}
            className="glass-input w-full pl-10 pr-4 py-2 rounded-xl text-sm border-slate-800 focus:border-brand-500/50"
          />
        </div>

        {/* Search Results Dropdown */}
        {showSearchResults && searchResults && (
          <div 
            className="absolute left-0 mt-2 w-full glass-panel rounded-2xl border border-slate-800 shadow-2xl p-4 max-h-96 overflow-y-auto space-y-4 z-50 text-xs"
            onMouseLeave={() => setShowSearchResults(false)}
          >
            {/* Leads */}
            {searchResults.leads?.length > 0 && (
              <div>
                <h4 className="font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Target className="h-3.5 w-3.5 text-brand-400" /> Leads
                </h4>
                <div className="space-y-1">
                  {searchResults.leads.map((lead) => (
                    <Link
                      key={lead._id}
                      to={`/leads/${lead._id}`}
                      onClick={clearSearch}
                      className="flex justify-between p-2 rounded-lg hover:bg-slate-900/60 transition-colors"
                    >
                      <span className="text-white font-medium">{lead.name}</span>
                      <span className="text-slate-400">{lead.clientCompanyName || "Individual"}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Meetings */}
            {searchResults.meetings?.length > 0 && (
              <div>
                <h4 className="font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-purple-400" /> Meetings
                </h4>
                <div className="space-y-1">
                  {searchResults.meetings.map((meet) => (
                    <Link
                      key={meet._id}
                      to="/crm/meetings"
                      onClick={clearSearch}
                      className="flex justify-between p-2 rounded-lg hover:bg-slate-900/60 transition-colors"
                    >
                      <span className="text-white font-medium">{meet.title}</span>
                      <span className="text-slate-400">
                        {new Date(meet.scheduledAt).toLocaleDateString()}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Companies */}
            {searchResults.companies?.length > 0 && (
              <div>
                <h4 className="font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Building className="h-3.5 w-3.5 text-emerald-400" /> Companies
                </h4>
                <div className="space-y-1">
                  {searchResults.companies.map((comp) => (
                    <Link
                      key={comp._id}
                      to="/settings"
                      onClick={clearSearch}
                      className="flex p-2 rounded-lg hover:bg-slate-900/60 transition-colors text-white font-medium"
                    >
                      {comp.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Users */}
            {searchResults.users?.length > 0 && (
              <div>
                <h4 className="font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-amber-400" /> Team Members
                </h4>
                <div className="space-y-1">
                  {searchResults.users.map((member) => (
                    <Link
                      key={member._id}
                      to="/users"
                      onClick={clearSearch}
                      className="flex justify-between p-2 rounded-lg hover:bg-slate-900/60 transition-colors"
                    >
                      <span className="text-white font-medium">{member.name}</span>
                      <span className="text-[10px] uppercase font-bold text-slate-500">{member.role}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {!(searchResults.leads?.length || searchResults.meetings?.length || searchResults.companies?.length || searchResults.users?.length) && (
              <div className="text-center py-4 text-slate-500">No results found for "{searchQuery}"</div>
            )}
          </div>
        )}
      </div>

      {/* Action Icons */}
      <div className="flex items-center gap-4 shrink-0">
        {/* Notifications Icon & Popover */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="p-2 rounded-xl bg-slate-900/50 border border-slate-800 hover:bg-slate-800/50 hover:text-white transition-all text-slate-400 relative"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-slate-950 animate-pulse" />
            )}
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-3 w-80 glass-panel rounded-2xl border border-slate-800 shadow-2xl p-4 z-50">
              <div className="flex items-center justify-between border-b border-slate-800/85 pb-2 mb-3">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Notifications
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[10px] text-brand-400 hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {notifications.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-xs">
                  No notifications yet
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {notifications.map((item) => (
                    <div
                      key={item._id}
                      className={`p-2.5 rounded-xl border transition-colors flex items-start justify-between gap-2 ${
                        item.isRead
                          ? "bg-slate-900/10 border-slate-850/40 opacity-70"
                          : "bg-slate-900/60 border-slate-800"
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="text-xs text-white font-semibold flex items-center gap-1">
                          {item.type === "meeting_reminder" ? (
                            <Calendar className="h-3 w-3 text-purple-400" />
                          ) : item.type === "revenue_achievement" ? (
                            <Target className="h-3 w-3 text-emerald-400" />
                          ) : (
                            <Target className="h-3 w-3 text-brand-400" />
                          )}
                          {item.title}
                        </p>
                        <p className="text-[11px] text-slate-300 mt-1 leading-normal">
                          {item.message}
                        </p>
                        <span className="text-[9px] text-slate-500 block mt-1">
                          {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {!item.isRead && (
                        <button
                          onClick={() => handleMarkRead(item._id)}
                          className="p-1 rounded-md text-slate-500 hover:text-white hover:bg-slate-800 shrink-0 transition-colors"
                        >
                          <Check className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Separator */}
        <div className="h-6 w-px bg-slate-800" />

        {/* User Card */}
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center font-bold text-xs uppercase">
            {user?.name ? user.name.charAt(0) : "U"}
          </div>
          <div className="hidden sm:block text-left">
            <span className="block text-xs font-semibold text-white leading-none">
              {user?.name}
            </span>
            <span className="text-[9px] text-slate-400 font-medium uppercase tracking-wider mt-0.5 inline-block">
              {user?.role}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
