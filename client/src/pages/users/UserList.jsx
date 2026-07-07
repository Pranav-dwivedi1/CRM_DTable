import React, { useState, useEffect, useContext } from 'react';
import { Users, Plus, Search, MoreVertical, Edit2, Trash2, UserCheck, UserX, Shield, Briefcase, User } from 'lucide-react';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext';

const ROLES = {
  masterAdmin: { label: 'Master Admin', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  manager: { label: 'Manager', color: 'bg-brand-500/10 text-brand-400 border-brand-500/20' },
  employee: { label: 'Agent', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
};

function UserModal({ user, onClose, onSaved, managers }) {
  const { user: currentUser } = useContext(AuthContext);
  const isEdit = !!user;

  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    role: user?.role || 'employee',
    managerId: user?.managerId?._id || user?.managerId || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password;
      if (payload.role !== 'employee') delete payload.managerId;

      if (isEdit) {
        await api.patch(`/users/${user._id}`, payload);
      } else {
        await api.post('/users', payload);
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const isMasterAdmin = currentUser?.role === 'masterAdmin';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="glass-panel rounded-2xl border border-slate-800 w-full max-w-md p-6 shadow-2xl">
        <h2 className="text-lg font-bold text-white mb-5">{isEdit ? 'Edit Team Member' : 'Add Team Member'}</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Full Name</label>
            <input
              className="glass-input w-full px-4 py-2.5 rounded-xl text-sm"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Email Address</label>
            <input
              type="email"
              className="glass-input w-full px-4 py-2.5 rounded-xl text-sm"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              {isEdit ? 'New Password (leave blank to keep)' : 'Password'}
            </label>
            <input
              type="password"
              className="glass-input w-full px-4 py-2.5 rounded-xl text-sm"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              required={!isEdit}
              minLength={8}
            />
          </div>

          {isMasterAdmin && (
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Role</label>
              <select
                className="glass-input w-full px-4 py-2.5 rounded-xl text-sm"
                value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              >
                <option value="employee">Agent (Employee)</option>
                <option value="manager">Manager</option>
                <option value="masterAdmin">Master Admin</option>
              </select>
            </div>
          )}

          {(isMasterAdmin && form.role === 'employee') && (
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Assigned Manager</label>
              <select
                className="glass-input w-full px-4 py-2.5 rounded-xl text-sm"
                value={form.managerId}
                onChange={e => setForm(f => ({ ...f, managerId: e.target.value }))}
                required
              >
                <option value="">Select a manager...</option>
                {managers.map(m => (
                  <option key={m._id} value={m._id}>{m.name}</option>
                ))}
              </select>
            </div>
          )}

          {error && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-sm font-medium hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : (isEdit ? 'Save Changes' : 'Add Member')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function UserCard({ member, currentUser, managers, onEdit, onToggleStatus, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const roleInfo = ROLES[member.role] || ROLES.employee;
  const initials = member.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const isMe = member._id === currentUser?._id;

  const RoleIcon = member.role === 'masterAdmin' ? Shield : member.role === 'manager' ? Briefcase : User;

  return (
    <div className={`glass-card rounded-2xl border border-slate-800 p-5 transition-all ${member.status === 'inactive' ? 'opacity-50' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`h-12 w-12 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 ${
            member.role === 'masterAdmin' ? 'bg-purple-600/10 border border-purple-500/20 text-purple-400' :
            member.role === 'manager' ? 'bg-brand-600/10 border border-brand-500/20 text-brand-400' :
            'bg-emerald-600/10 border border-emerald-500/20 text-emerald-400'
          }`}>
            {initials}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-white text-sm truncate">{member.name}</h3>
              {isMe && <span className="text-[9px] font-bold text-slate-500 bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5">YOU</span>}
            </div>
            <p className="text-xs text-slate-400 truncate mt-0.5">{member.email}</p>
          </div>
        </div>

        {!isMe && (
          <div className="relative ml-2">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
            {menuOpen && (
              <div
                className="absolute right-0 top-8 z-20 glass-panel rounded-xl border border-slate-800 p-1 w-40 shadow-xl"
                onMouseLeave={() => setMenuOpen(false)}
              >
                <button
                  onClick={() => { onEdit(member); setMenuOpen(false); }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <Edit2 className="h-3.5 w-3.5" /> Edit Details
                </button>
                <button
                  onClick={() => { onToggleStatus(member); setMenuOpen(false); }}
                  className={`flex items-center gap-2 w-full px-3 py-2 text-xs rounded-lg transition-colors ${
                    member.status === 'active'
                      ? 'text-amber-400 hover:bg-amber-500/10'
                      : 'text-emerald-400 hover:bg-emerald-500/10'
                  }`}
                >
                  {member.status === 'active'
                    ? <><UserX className="h-3.5 w-3.5" /> Deactivate</>
                    : <><UserCheck className="h-3.5 w-3.5" /> Activate</>
                  }
                </button>
                {currentUser?.role === 'masterAdmin' && (
                  <button
                    onClick={() => { onDelete(member); setMenuOpen(false); }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete User
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border ${roleInfo.color}`}>
          <RoleIcon className="h-3 w-3" /> {roleInfo.label}
        </span>
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
          member.status === 'active'
            ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
            : 'text-red-400 bg-red-500/10 border-red-500/20'
        }`}>
          {member.status}
        </span>
      </div>

      {member.managerId && (
        <p className="text-[10px] text-slate-500 mt-2">
          Reports to: <span className="text-slate-400 font-medium">{member.managerId?.name || 'Unassigned'}</span>
        </p>
      )}
    </div>
  );
}

export default function UserList() {
  const { user: currentUser } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalUser, setModalUser] = useState(null); // null=closed, {}=new, {user}=edit
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users');
      setUsers(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const managers = users.filter(u => u.role === 'manager' || u.role === 'masterAdmin');

  const handleToggleStatus = async (member) => {
    const newStatus = member.status === 'active' ? 'inactive' : 'active';
    try {
      await api.patch(`/users/${member._id}/status`, { status: newStatus });
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/users/${deleteTarget._id}`);
      setDeleteTarget(null);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user');
      setDeleteTarget(null);
    }
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: users.length,
    admins: users.filter(u => u.role === 'masterAdmin').length,
    managers: users.filter(u => u.role === 'manager').length,
    agents: users.filter(u => u.role === 'employee').length,
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-display text-white">Team Directory</h2>
          <p className="text-sm text-slate-400 mt-0.5">{stats.total} members across your workspace</p>
        </div>
        {(currentUser?.role === 'masterAdmin' || currentUser?.role === 'manager') && (
          <button
            onClick={() => { setModalUser({}); setModalOpen(true); }}
            id="add-team-member-btn"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition-all shadow-lg shadow-brand-600/20"
          >
            <Plus className="h-4 w-4" /> Add Member
          </button>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Members', value: stats.total, icon: Users, color: 'text-slate-400' },
          { label: 'Admins', value: stats.admins, icon: Shield, color: 'text-purple-400' },
          { label: 'Managers', value: stats.managers, icon: Briefcase, color: 'text-brand-400' },
          { label: 'Agents', value: stats.agents, icon: User, color: 'text-emerald-400' },
        ].map(s => (
          <div key={s.label} className="glass-card rounded-2xl border border-slate-800 p-4">
            <div className={`${s.color} mb-2`}><s.icon className="h-4 w-4" /></div>
            <p className="text-2xl font-bold text-white">{s.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        <input
          id="user-search-input"
          className="glass-input w-full pl-11 pr-4 py-2.5 rounded-xl text-sm"
          placeholder="Search by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm flex justify-between items-center">
          {error}
          <button onClick={() => setError('')} className="text-red-500 hover:text-red-300 font-bold ml-4">✕</button>
        </div>
      )}

      {/* Users Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass-card rounded-2xl border border-slate-800 p-5 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-slate-800" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-slate-800 rounded w-2/3" />
                  <div className="h-2 bg-slate-800 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Users className="h-12 w-12 text-slate-700 mb-4" />
          <h3 className="text-lg font-semibold text-slate-400">
            {search ? 'No members match your search' : 'No team members found'}
          </h3>
          <p className="text-sm text-slate-600 mt-1">
            {search ? 'Try a different name or email' : 'Add your first team member to get started'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredUsers.map(member => (
            <UserCard
              key={member._id}
              member={member}
              currentUser={currentUser}
              managers={managers}
              onEdit={(u) => { setModalUser(u); setModalOpen(true); }}
              onToggleStatus={handleToggleStatus}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      {/* User Create/Edit Modal */}
      {modalOpen && (
        <UserModal
          user={modalUser && modalUser._id ? modalUser : null}
          managers={managers}
          onClose={() => { setModalOpen(false); setModalUser(null); }}
          onSaved={() => { setModalOpen(false); setModalUser(null); fetchUsers(); }}
        />
      )}

      {/* Delete Confirm Dialog */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-panel rounded-2xl border border-slate-800 w-full max-w-sm p-6 shadow-2xl text-center">
            <div className="h-12 w-12 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Delete {deleteTarget.name}?</h3>
            <p className="text-sm text-slate-400 mt-2">
              This action is permanent. Ensure all leads assigned to this user have been reassigned first.
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-sm font-medium hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors"
              >
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
