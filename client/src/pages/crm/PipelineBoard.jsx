import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Kanban, List, PlusCircle, RefreshCw, Loader2, Wifi, WifiOff } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { useLeads, useCompanySettings, useLeadStatusChange } from '../../hooks/useLeads';
import { useToast } from '../../components/Toast';
import { connectSocket, getSocket } from '../../services/socket';
import KanbanBoard from '../../components/pipeline/KanbanBoard';
import MobileLeadList from '../../components/pipeline/MobileLeadList';

// ─── Responsive hook ──────────────────────────────────────────────────────────
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < breakpoint);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [breakpoint]);
  return isMobile;
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PipelineBoard() {
  const { user } = useContext(AuthContext);
  const toast = useToast();
  const isMobile = useIsMobile();
  const [socketConnected, setSocketConnected] = useState(false);
  const [changingLeadId, setChangingLeadId] = useState(null);

  // ── Data ──
  const { data: leads = [], isLoading: leadsLoading, refetch: refetchLeads } = useLeads({ limit: 300 });
  const { data: settings, isLoading: settingsLoading } = useCompanySettings();
  const statuses = settings?.leadStatuses || ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Won', 'Lost'];

  // ── Status change mutation ──
  const { mutateAsync: changeStatus } = useLeadStatusChange();

  const handleStatusChange = async ({ id, status, lostReason, oldStatus }) => {
    setChangingLeadId(id);
    try {
      await changeStatus({ id, status, lostReason, oldStatus });
      toast.success(`Lead moved to "${status}"`);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to update stage';
      toast.error(msg);
      throw err; // re-throw so KanbanBoard can revert
    } finally {
      setChangingLeadId(null);
    }
  };

  // ── Socket.io real-time sync ──
  useEffect(() => {
    connectSocket();
    const socket = getSocket();
    if (!socket) return;

    const onConnect = () => setSocketConnected(true);
    const onDisconnect = () => setSocketConnected(false);
    const onStatusChanged = (payload) => {
      // A different user changed a lead — invalidate React Query cache
      refetchLeads();
      if (payload?.updatedBy?._id !== user?._id) {
        toast.info(`"${payload.newStatus}" — status updated by ${payload.updatedBy?.name}`);
      }
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('lead:statusChanged', onStatusChanged);
    setSocketConnected(socket.connected);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('lead:statusChanged', onStatusChanged);
    };
  }, [user]);

  const isLoading = leadsLoading || settingsLoading;

  return (
    <div className="space-y-5 fade-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400">
              <Kanban className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold font-display text-white">Pipeline Board</h1>
            {/* Socket indicator */}
            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
              socketConnected
                ? 'bg-green-500/10 text-green-400 border-green-500/20'
                : 'bg-slate-500/10 text-slate-500 border-slate-700'
            }`}>
              {socketConnected
                ? <><Wifi className="h-3 w-3" /> Live</>
                : <><WifiOff className="h-3 w-3" /> Offline</>
              }
            </div>
          </div>
          <p className="text-slate-400 text-sm mt-1 ml-14">
            {isMobile ? 'Tap a stage dropdown to move leads' : 'Drag cards between stages to update pipeline'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refetchLeads()}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900 transition-all disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            to="/crm/leads/new"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-semibold px-4 py-2.5 rounded-xl text-sm shadow-lg shadow-brand-500/25 transition-all"
          >
            <PlusCircle className="h-4 w-4" />
            New Lead
          </Link>
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-4 overflow-x-auto pb-1">
        {statuses.map(status => {
          const count = leads.filter(l => l.status === status).length;
          const value = leads.filter(l => l.status === status).reduce((s, l) => s + (l.estimatedValue || 0), 0);
          return (
            <div key={status} className="shrink-0 px-4 py-2 rounded-xl bg-slate-900/60 border border-slate-800/60 text-center min-w-[100px]">
              <p className="text-[10px] text-slate-500 font-medium truncate">{status}</p>
              <p className="text-lg font-bold text-white font-display">{count}</p>
              {value > 0 && <p className="text-[10px] text-brand-400">${value.toLocaleString()}</p>}
            </div>
          );
        })}
      </div>

      {/* Main Content */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-7 w-7 text-brand-500 animate-spin" />
        </div>
      ) : isMobile ? (
        /* ── Mobile: stacked list with stage dropdown ── */
        <MobileLeadList
          leads={leads}
          statuses={statuses}
          onStatusChange={handleStatusChange}
          isChanging={changingLeadId}
        />
      ) : (
        /* ── Desktop: full drag-and-drop Kanban ── */
        <KanbanBoard
          leads={leads}
          statuses={statuses}
          onStatusChange={handleStatusChange}
          isChanging={!!changingLeadId}
          toast={toast}
        />
      )}
    </div>
  );
}
