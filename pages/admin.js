import { useState, useEffect } from 'react';
import Head from 'next/head';
import NavigationSidebar from '../components/NavigationSidebar';
import withAuth from '../lib/withAuth';
import { useAuth } from '../lib/authContext';

const ADMIN_EMAIL = 'pranay.8787@gmail.com';

function AdminDashboard() {
  const { user, session } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [resetModal, setResetModal] = useState(null); // { id, email }
  const [newPassword, setNewPassword] = useState('');
  const [resetting, setResetting] = useState(false);
  const [resetResult, setResetResult] = useState(null); // { success, message }
  const [confirming, setConfirming] = useState(false);
  const [confirmResult, setConfirmResult] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberAvatar, setNewMemberAvatar] = useState('👤');
  const [addingMember, setAddingMember] = useState(false);

  // Guard: only admin email can see this
  const isAdmin = user?.email === ADMIN_EMAIL;

  useEffect(() => {
    if (session && isAdmin) {
      fetchUsers();
      fetchTeamMembers();
    }
  }, [session, isAdmin]);

  async function fetchUsers() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      if (res.ok) setUsers(data.users || []);
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword() {
    if (!newPassword.trim() || !resetModal) return;
    setResetting(true);
    setResetResult(null);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ userId: resetModal.id, newPassword: newPassword.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setResetResult({ success: true, message: `Password updated for ${resetModal.email}` });
        setNewPassword('');
        setTimeout(() => { setResetModal(null); setResetResult(null); }, 2000);
      } else {
        setResetResult({ success: false, message: data.error || 'Failed to reset password' });
      }
    } finally {
      setResetting(false);
    }
  }

  async function handleConfirmAll() {
    setConfirming(true);
    setConfirmResult(null);
    try {
      const res = await fetch('/api/admin/confirm-all', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setConfirmResult({ success: true, message: `Confirmed ${data.confirmed} of ${data.total} unverified users` });
        fetchUsers();
      } else {
        setConfirmResult({ success: false, message: data.error || 'Failed' });
      }
    } finally {
      setConfirming(false);
    }
  }

  async function fetchTeamMembers() {
    const res = await fetch('/api/kanban/team-members', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    const data = await res.json();
    if (Array.isArray(data)) setTeamMembers(data);
  }

  async function handleAddMember() {
    if (!newMemberName.trim()) return;
    setAddingMember(true);
    const res = await fetch('/api/kanban/team-members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ name: newMemberName.trim(), avatar: newMemberAvatar }),
    });
    if (res.ok) {
      setNewMemberName('');
      setNewMemberAvatar('👤');
      fetchTeamMembers();
    }
    setAddingMember(false);
  }

  async function handleDeleteMember(id) {
    if (!confirm('Remove this team member?')) return;
    await fetch(`/api/kanban/team-members?id=${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    fetchTeamMembers();
  }

  const filteredUsers = users.filter(u =>
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Not the admin — show access denied
  if (!isAdmin) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black">
        <Head><title>Admin</title></Head>
        <NavigationSidebar />
        <main className="flex-1 flex items-center justify-center text-white">
          <div className="text-center glass-card rounded-2xl p-12">
            <div className="text-5xl mb-4">🚫</div>
            <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
            <p className="text-gray-400">This page is restricted to administrators.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black">
      <Head><title>Admin Dashboard</title></Head>
      <NavigationSidebar />

      <main className="flex-1 text-white p-4 md:p-8 pt-16 md:pt-8 overflow-auto">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold gradient-text mb-1">
              🛡️ Admin Dashboard
            </h1>
            <p className="text-sm text-gray-400">Manage users and reset passwords</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-900/50 border border-gray-700/50 rounded-xl p-4">
              <div className="text-3xl font-bold text-cyan-400">{users.length}</div>
              <div className="text-sm text-gray-400 mt-1">Total Users</div>
            </div>
            <div className="bg-gray-900/50 border border-gray-700/50 rounded-xl p-4">
              <div className="text-3xl font-bold text-green-400">
                {users.filter(u => u.email_confirmed_at).length}
              </div>
              <div className="text-sm text-gray-400 mt-1">Confirmed</div>
            </div>
          </div>

          {/* Confirm All Unverified */}
          <div className="mb-6 flex items-center gap-4">
            <button
              onClick={handleConfirmAll}
              disabled={confirming}
              className="px-4 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {confirming ? 'Confirming...' : 'Confirm All Unverified'}
            </button>
            {confirmResult && (
              <span className={`text-sm ${confirmResult.success ? 'text-green-400' : 'text-red-400'}`}>
                {confirmResult.message}
              </span>
            )}
          </div>

          {/* Search */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="🔍 Search by email..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-gray-800/50 border border-gray-600/50 rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:border-purple-500"
            />
          </div>

          {/* Users Table */}
          <div className="glass-card rounded-2xl overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-gray-400">Loading users...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-12 text-center text-gray-500">No users found</div>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-800/70 border-b border-gray-600/50">
                    <th className="px-5 py-4 text-left text-xs font-semibold text-gray-400">EMAIL</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold text-gray-400 hidden sm:table-cell">CREATED</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold text-gray-400 hidden sm:table-cell">STATUS</th>
                    <th className="px-5 py-4 text-right text-xs font-semibold text-gray-400">ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u, i) => (
                    <tr
                      key={u.id}
                      className={`border-b border-gray-600/30 hover:bg-purple-900/10 transition-colors ${i % 2 === 0 ? 'bg-gray-800/20' : ''}`}
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {u.email?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <span className="text-white text-sm font-medium truncate max-w-[180px] block">{u.email}</span>
                            <span className="text-gray-500 text-xs font-mono">{u.id}</span>
                          </div>
                          {u.email === ADMIN_EMAIL && (
                            <span className="px-2 py-0.5 bg-yellow-500/20 border border-yellow-500/40 rounded text-xs text-yellow-400 flex-shrink-0">admin</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-gray-400 text-sm hidden sm:table-cell">
                        {new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-5 py-3 hidden sm:table-cell">
                        <span className={`px-2 py-1 rounded text-xs ${u.email_confirmed_at ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                          {u.email_confirmed_at ? 'confirmed' : 'unconfirmed'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={() => { setResetModal({ id: u.id, email: u.email }); setNewPassword(''); setResetResult(null); }}
                          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium rounded-lg transition-colors"
                        >
                          Reset Password
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="mt-3 text-right text-sm text-gray-500">
            {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'}
          </div>

          {/* Team Members */}
          <div className="mt-10">
            <h2 className="text-xl font-bold text-white mb-4">👥 Team Members</h2>
            <p className="text-sm text-gray-400 mb-4">Manage assignees for the Team Board.</p>

            <div className="glass-card rounded-2xl overflow-hidden mb-4">
              {teamMembers.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No team members yet</div>
              ) : (
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-800/70 border-b border-gray-600/50">
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400">AVATAR</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400">NAME</th>
                      <th className="px-5 py-3 text-right text-xs font-semibold text-gray-400">ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamMembers.map((m, i) => (
                      <tr key={m.id} className={`border-b border-gray-600/30 ${i % 2 === 0 ? 'bg-gray-800/20' : ''}`}>
                        <td className="px-5 py-3 text-2xl">{m.avatar}</td>
                        <td className="px-5 py-3 text-white text-sm font-medium">{m.name}</td>
                        <td className="px-5 py-3 text-right">
                          <button
                            onClick={() => handleDeleteMember(m.id)}
                            className="px-3 py-1.5 bg-red-900/40 hover:bg-red-800 text-red-300 text-xs font-medium rounded-lg transition-colors"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="Emoji avatar"
                value={newMemberAvatar}
                onChange={e => setNewMemberAvatar(e.target.value)}
                className="w-20 bg-gray-800/50 border border-gray-600/50 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-purple-500 text-center"
              />
              <input
                type="text"
                placeholder="Member name"
                value={newMemberName}
                onChange={e => setNewMemberName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddMember()}
                className="flex-1 bg-gray-800/50 border border-gray-600/50 rounded-lg px-4 py-2 text-white text-sm outline-none focus:border-purple-500"
              />
              <button
                onClick={handleAddMember}
                disabled={addingMember || !newMemberName.trim()}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {addingMember ? 'Adding...' : 'Add Member'}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Reset Password Modal */}
      {resetModal && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => { setResetModal(null); setResetResult(null); }}
        >
          <div
            className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-white mb-1">🔑 Reset Password</h2>
            <p className="text-gray-400 text-sm mb-5">
              Set a new password for <span className="text-white font-medium">{resetModal.email}</span>
            </p>

            {resetResult && (
              <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${resetResult.success ? 'bg-green-900/40 border border-green-500/50 text-green-300' : 'bg-red-900/40 border border-red-500/50 text-red-300'}`}>
                {resetResult.message}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-1">New Password</label>
              <input
                type="password"
                placeholder="Min. 6 characters"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleResetPassword()}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:border-purple-500"
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleResetPassword}
                disabled={resetting || !newPassword.trim() || newPassword.length < 6}
                className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-medium rounded-lg text-sm transition-colors"
              >
                {resetting ? 'Resetting...' : 'Reset Password'}
              </button>
              <button
                onClick={() => { setResetModal(null); setResetResult(null); }}
                className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium rounded-lg text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default withAuth(AdminDashboard);
