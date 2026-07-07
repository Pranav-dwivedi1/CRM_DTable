import React, { useContext, useState, useEffect } from 'react';
import { Bell, Calendar, User, ChevronDown, Check } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { Link } from 'react-router-dom';

export default function Navbar({ title }) {
  const { user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    const loadNotifications = async () => {
      try {
        const res = await api.get('/dashboard/summary');
        if (res.data.success && user.role === 'employee') {
          // Display follow-ups due today
          setNotifications(res.data.data.followUpsToday || []);
        } else if (res.data.success) {
          // For manager/admin, list recent activities as alerts or mock a welcome notification
          const activities = res.data.data.recentActivities || [];
          // Filter to show created leads as notifications
          const leadCreates = activities
            .filter(act => act.action === 'LEAD_CREATED')
            .map(act => ({
              _id: act._id,
              name: act.metadata.name,
              status: act.metadata.status,
              type: 'activity',
              message: `New lead created: ${act.metadata.name}`
            }));
          setNotifications(leadCreates.slice(0, 5));
        }
      } catch (e) {
        console.error('Failed to load notifications in header:', e);
      }
    };

    loadNotifications();
  }, [user]);

  const clearNotification = (id) => {
    setNotifications(prev => prev.filter(n => n._id !== id));
  };

  return (
    <header className="h-16 px-8 border-b border-slate-800/80 bg-slate-950/20 backdrop-blur-md sticky top-0 flex items-center justify-between z-10">
      {/* Title */}
      <h1 className="text-xl font-bold font-display text-white tracking-tight">
        {title}
      </h1>

      {/* Action Icons */}
      <div className="flex items-center gap-4">
        {/* Notifications Icon & Popover */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="p-2 rounded-xl bg-slate-900/50 border border-slate-800 hover:bg-slate-800/50 hover:text-white transition-all text-slate-400 relative"
          >
            <Bell className="h-5 w-5" />
            {notifications.length > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-slate-950 animate-pulse" />
            )}
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-3 w-80 glass-panel rounded-2xl border border-slate-800 shadow-2xl p-4 z-30">
              <div className="flex items-center justify-between border-b border-slate-800/85 pb-2 mb-3">
                <span className="text-xs font-bold text-white uppercase tracking-wider">Notifications</span>
                <span className="text-[10px] bg-brand-500/10 text-brand-400 px-2 py-0.5 rounded-full border border-brand-500/20">
                  {notifications.length} New
                </span>
              </div>

              {notifications.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-xs">
                  No pending notifications
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {notifications.map((item) => (
                    <div
                      key={item._id}
                      className="p-2.5 rounded-xl bg-slate-900/40 border border-slate-800/60 hover:bg-slate-900/70 transition-colors flex items-start justify-between gap-2"
                    >
                      <div className="min-w-0">
                        {item.type === 'activity' ? (
                          <p className="text-xs text-slate-300 font-medium">{item.message}</p>
                        ) : (
                          <>
                            <p className="text-xs text-brand-400 font-semibold flex items-center gap-1">
                              <Calendar className="h-3 w-3" /> Follow-up Due Today
                            </p>
                            <p className="text-xs text-white font-medium truncate mt-0.5">{item.name}</p>
                            <span className="text-[10px] text-slate-400">{item.clientCompanyName || 'No Company'}</span>
                          </>
                        )}
                      </div>
                      <button
                        onClick={() => clearNotification(item._id)}
                        className="p-1 rounded-md text-slate-500 hover:text-white hover:bg-slate-800 shrink-0 transition-colors"
                      >
                        <Check className="h-3 w-3" />
                      </button>
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
            {user?.name ? user.name.charAt(0) : 'U'}
          </div>
          <div className="hidden sm:block text-left">
            <span className="block text-xs font-semibold text-white leading-none">{user?.name}</span>
            <span className="text-[9px] text-slate-400 font-medium uppercase tracking-wider mt-0.5 inline-block">{user?.role}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
