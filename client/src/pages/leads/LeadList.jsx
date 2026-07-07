import React, { useContext, useEffect, useState } from 'react';
import { Search, SlidersHorizontal, Plus, Grid, List, Eye, Trash2, Loader2, ChevronLeft, ChevronRight, Target, ClipboardList } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import RoleGate from '../../components/RoleGate';
import LeadForm from './LeadForm';

const STATUS_BADGE_COLORS = {
  'New': 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  'Contacted': 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
  'Qualified': 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
  'Proposal Sent': 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
  'Won': 'bg-green-500/10 text-green-400 border border-green-500/20',
  'Lost': 'bg-red-500/10 text-red-400 border border-red-500/20',
  // Seeding fallbacks
  'Lead Seeding': 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  'Active Discussion': 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
  'Contract Offered': 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
  'Closed Won': 'bg-green-500/10 text-green-400 border border-green-500/20',
  'Closed Lost': 'bg-red-500/10 text-red-400 border border-red-500/20',
};

const PRIORITY_BADGES = {
  'high': 'bg-red-500/10 text-red-400 border border-red-500/20',
  'medium': 'bg-orange-500/10 text-orange-400 border border-orange-500/20',
  'low': 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
};

export default function LeadList() {
  const { user } = useContext(AuthContext);
  
  // State
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('kanban'); // 'table' or 'kanban'
  const [companySettings, setCompanySettings] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null); // for editing

  // Filters state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [assignedFilter, setAssignedFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Load basic company settings and users for filters
  useEffect(() => {
    const initData = async () => {
      try {
        const companyRes = await api.get('/company/settings');
        if (companyRes.data.success) {
          setCompanySettings(companyRes.data.data);
        }
        
        if (user.role !== 'employee') {
          const usersRes = await api.get('/users');
          if (usersRes.data.success) {
            setTeamMembers(usersRes.data.data);
          }
        }
      } catch (e) {
        console.error('Failed loading filter defaults:', e);
      }
    };
    initData();
  }, [user]);

  // Load leads
  const loadLeads = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: viewMode === 'table' ? 10 : 100, // Kanban fits more card listings
        search,
        status: statusFilter,
        source: sourceFilter,
        assignedTo: assignedFilter
      };

      const res = await api.get('/leads', { params });
      if (res.data.success) {
        setLeads(res.data.data);
        if (res.data.pagination) {
          setTotalPages(res.data.pagination.pages);
        }
      }
    } catch (e) {
      console.error('Error fetching leads:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();

    window.addEventListener('lead:statusChanged', loadLeads);
    return () => {
      window.removeEventListener('lead:statusChanged', loadLeads);
    };
  }, [page, statusFilter, sourceFilter, assignedFilter, viewMode]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadLeads();
  };

  const handleClearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setSourceFilter('');
    setAssignedFilter('');
    setPage(1);
  };

  const handleDeleteLead = async (id) => {
    if (!window.confirm('Are you sure you want to delete this lead?')) return;
    try {
      const res = await api.delete(`/leads/${id}`);
      if (res.data.success) {
        setLeads(prev => prev.filter(l => l._id !== id));
      }
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to delete lead');
    }
  };

  // Group leads for Kanban columns
  const getKanbanColumns = () => {
    const statuses = companySettings?.leadStatuses || ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Won', 'Lost'];
    const columns = {};
    statuses.forEach(status => {
      columns[status] = [];
    });
    leads.forEach(lead => {
      if (columns[lead.status] !== undefined) {
        columns[lead.status].push(lead);
      } else {
        // Fallback for unconfigured statuses
        if (!columns['OtherStatus']) columns['OtherStatus'] = [];
        columns['OtherStatus'].push(lead);
      }
    });
    return columns;
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <p className="text-slate-400 text-xs mt-1">Organize, edit, and convert client requests</p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Toggles */}
          <div className="flex p-1 rounded-xl bg-slate-900 border border-slate-800">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'kanban' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-white'}`}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-white'}`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          {/* Create Button */}
          <button
            onClick={() => { setSelectedLead(null); setShowCreateModal(true); }}
            className="flex items-center gap-2 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-medium px-4 py-2.5 rounded-xl shadow-lg shadow-brand-500/20 hover:shadow-brand-500/35 transition-all text-sm"
          >
            <Plus className="h-4 w-4" />
            Create Lead
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-panel rounded-2xl p-4 border border-slate-800/80 flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Search form */}
        <form onSubmit={handleSearchSubmit} className="relative w-full lg:max-w-xs shrink-0">
          <input
            type="text"
            placeholder="Search leads..."
            className="glass-input w-full pl-10 pr-4 py-2 rounded-xl text-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 hover:text-white">
            <Search className="h-4 w-4" />
          </button>
        </form>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:justify-end">
          {/* Status filter */}
          <select
            className="glass-input px-3 py-2 rounded-xl text-xs"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Statuses</option>
            {(companySettings?.leadStatuses || ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Won', 'Lost']).map(st => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>

          {/* Source filter */}
          <select
            className="glass-input px-3 py-2 rounded-xl text-xs"
            value={sourceFilter}
            onChange={(e) => { setSourceFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Sources</option>
            {(companySettings?.leadSources || ['Website', 'Referral', 'Cold Call', 'Social Media', 'Other']).map(src => (
              <option key={src} value={src}>{src}</option>
            ))}
          </select>

          {/* Assigned rep filter (Admins and Managers only) */}
          {user.role !== 'employee' && (
            <select
              className="glass-input px-3 py-2 rounded-xl text-xs"
              value={assignedFilter}
              onChange={(e) => { setAssignedFilter(e.target.value); setPage(1); }}
            >
              <option value="">All Assignees</option>
              {teamMembers.map(member => (
                <option key={member._id} value={member._id}>{member.name} ({member.role === 'manager' ? 'Manager' : 'Agent'})</option>
              ))}
            </select>
          )}

          {/* Clear Filters Button */}
          {(statusFilter || sourceFilter || assignedFilter || search) && (
            <button
              onClick={handleClearFilters}
              className="text-xs text-brand-400 hover:text-brand-300 font-medium px-2 py-1"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Content Layout */}
      {loading ? (
        <div className="flex items-center justify-center h-[50vh]">
          <Loader2 className="h-8 w-8 text-brand-500 animate-spin" />
        </div>
      ) : leads.length === 0 ? (
        <div className="text-center py-20 glass-card rounded-2xl p-8 max-w-md mx-auto">
          <ClipboardList className="h-12 w-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-white font-semibold mb-2">No Leads Found</h3>
          <p className="text-slate-400 text-xs leading-relaxed mb-6">
            There are no leads match your search criteria. Create a new lead card to build your pipeline.
          </p>
          <button
            onClick={() => { setSelectedLead(null); setShowCreateModal(true); }}
            className="inline-flex items-center gap-2 bg-slate-900 border border-slate-800 text-white px-4 py-2.5 rounded-xl text-xs hover:bg-slate-800 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add First Lead
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="glass-panel rounded-2xl border border-slate-800/80 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] uppercase font-bold tracking-wider text-slate-400 bg-slate-950/40">
                  <th className="p-4">Lead Name</th>
                  <th className="p-4">Company</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Priority</th>
                  <th className="p-4">Value</th>
                  <th className="p-4">Assigned To</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {leads.map((lead) => (
                  <tr key={lead._id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="p-4">
                      <div>
                        <Link to={`/leads/${lead._id}`} className="font-semibold text-white hover:text-brand-400 transition-colors">
                          {lead.name}
                        </Link>
                        <p className="text-[10px] text-slate-400 mt-0.5">{lead.email || 'No email'}</p>
                      </div>
                    </td>
                    <td className="p-4 text-slate-300 font-medium">{lead.clientCompanyName || '—'}</td>
                    <td className="p-4">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold ${STATUS_BADGE_COLORS[lead.status] || 'bg-slate-500/10 text-slate-400 border border-slate-500/20'}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${PRIORITY_BADGES[lead.priority]}`}>
                        {lead.priority}
                      </span>
                    </td>
                    <td className="p-4 text-slate-200 font-semibold">
                      {lead.estimatedValue ? `$${lead.estimatedValue.toLocaleString()}` : '$0'}
                    </td>
                    <td className="p-4 text-slate-300">{lead.assignedTo?.name || 'Unassigned'}</td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          to={`/leads/${lead._id}`}
                          className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition-colors"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Link>
                        <RoleGate allowedRoles={['masterAdmin', 'manager']}>
                          <button
                            onClick={() => handleDeleteLead(lead._id)}
                            className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </RoleGate>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex justify-between items-center text-xs">
              <span className="text-slate-400">Page {page} of {totalPages}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                  disabled={page === 1}
                  className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-all disabled:opacity-30"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={page === totalPages}
                  className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-all disabled:opacity-30"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* KANBAN BOARD VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 overflow-x-auto pb-4 pipeline-scroll">
          {Object.entries(getKanbanColumns()).map(([colName, colLeads]) => (
            <div key={colName} className="glass-panel rounded-2xl border border-slate-800/80 p-3 min-w-[200px] flex flex-col max-h-[70vh]">
              {/* Column Header */}
              <div className="flex justify-between items-center pb-2.5 border-b border-slate-800/60 mb-3">
                <span className="text-xs font-bold text-white tracking-wide truncate pr-2">{colName}</span>
                <span className="text-[10px] bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-semibold">
                  {colLeads.length}
                </span>
              </div>

              {/* Column Cards */}
              <div className="space-y-3 overflow-y-auto flex-1 pr-1 pb-2">
                {colLeads.length === 0 ? (
                  <div className="text-center py-8 text-[10px] text-slate-600 italic">No leads here</div>
                ) : (
                  colLeads.map((item) => (
                    <div key={item._id} className="glass-card rounded-xl p-3 border border-slate-800/60 flex flex-col justify-between gap-3 text-left">
                      <div>
                        {/* Name and priority */}
                        <div className="flex justify-between items-start gap-2 mb-1.5">
                          <Link to={`/leads/${item._id}`} className="text-xs font-bold text-white hover:text-brand-400 transition-colors leading-snug line-clamp-2">
                            {item.name}
                          </Link>
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase ${PRIORITY_BADGES[item.priority]}`}>
                            {item.priority.charAt(0)}
                          </span>
                        </div>

                        {/* Client details */}
                        <p className="text-[10px] font-medium text-slate-300 truncate">{item.clientCompanyName || 'Individual'}</p>
                        
                        {/* Est value */}
                        {item.estimatedValue > 0 && (
                          <p className="text-[10px] font-bold text-brand-400 mt-1.5">${item.estimatedValue.toLocaleString()}</p>
                        )}
                      </div>

                      {/* Card Footer */}
                      <div className="flex justify-between items-center border-t border-slate-800/50 pt-2 text-[9px] text-slate-500 font-medium">
                        <span className="truncate max-w-[80px]" title={item.assignedTo?.name || 'Unassigned'}>
                          {item.assignedTo ? item.assignedTo.name.split(' ')[0] : 'Unassigned'}
                        </span>
                        
                        <div className="flex items-center gap-1.5">
                          <Link to={`/leads/${item._id}`} className="hover:text-white transition-colors" title="View details">
                            <Eye className="h-3 w-3" />
                          </Link>
                          <RoleGate allowedRoles={['masterAdmin', 'manager']}>
                            <button
                              onClick={() => handleDeleteLead(item._id)}
                              className="hover:text-red-400 transition-colors"
                              title="Delete lead"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </RoleGate>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Lead Form Modal */}
      {showCreateModal && (
        <LeadForm
          lead={selectedLead}
          companySettings={companySettings}
          teamMembers={teamMembers}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => { setShowCreateModal(false); loadLeads(); }}
        />
      )}
    </div>
  );
}
