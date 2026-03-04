import { useEffect, useState, useCallback } from 'react';
import { m } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../context/AuthContext.jsx';
import apiClient from '../api/client.js';

const ROLES = ['user', 'admin'];

function fmt(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now - d;
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function Admin() {
  const { user: currentUser, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState([]);
  const [videoStats, setVideoStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [grantingId, setGrantingId] = useState(null);
  const [grantAmount, setGrantAmount] = useState({});

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    const [profilesRes, statsRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, email, full_name, role, credits, created_at, avatar_url')
        .order('created_at', { ascending: false }),
      supabase.rpc('get_all_user_video_stats'),
    ]);

    if (profilesRes.error) {
      setError(profilesRes.error.message);
    } else {
      setProfiles(profilesRes.data ?? []);
    }

    if (!statsRes.error && statsRes.data) {
      const map = {};
      for (const row of statsRes.data) {
        map[row.user_id] = { video_count: row.video_count, last_video_at: row.last_video_at };
      }
      setVideoStats(map);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const grantCredits = async (profileId) => {
    const amount = parseInt(grantAmount[profileId] || '100', 10);
    if (!amount || amount < 100) return;
    setGrantingId(profileId);
    try {
      await apiClient.post('/api/admin/grant-credits', { user_id: profileId, credits: amount });
      setProfiles((prev) =>
        prev.map((p) => p.id === profileId ? { ...p, credits: (p.credits ?? 0) + amount } : p)
      );
      setGrantAmount((prev) => ({ ...prev, [profileId]: '' }));
      if (profileId === currentUser?.id) await refreshProfile();
    } catch (err) {
      alert(err?.response?.data?.detail || 'Failed to grant credits.');
    } finally {
      setGrantingId(null);
    }
  };

  const changeRole = async (profileId, newRole) => {
    setUpdatingId(profileId);
    const { error: err } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', profileId);
    if (err) {
      alert(`Failed to update role: ${err.message}`);
    } else {
      setProfiles((prev) =>
        prev.map((p) => (p.id === profileId ? { ...p, role: newRole } : p))
      );
    }
    setUpdatingId(null);
  };

  const filtered = profiles.filter((p) => {
    const q = search.toLowerCase();
    return p.email?.toLowerCase().includes(q) || p.full_name?.toLowerCase().includes(q);
  });

  // Summary stats
  const totalVideos = Object.values(videoStats).reduce((sum, s) => sum + Number(s.video_count), 0);
  const activeUsers = Object.keys(videoStats).length;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col font-body">
      {/* Nav */}
      <div className="fixed top-0 left-0 right-0 z-50 h-14 border-b border-white/[0.06] bg-[#0a0a0a]/90 backdrop-blur-xl flex items-center justify-between px-6">
        <button onClick={() => navigate('/')} className="text-white/60 hover:text-white text-sm transition">
          ← Back to app
        </button>
        <span className="text-white/40 text-xs uppercase tracking-widest">Admin</span>
        <button onClick={() => signOut().then(() => navigate('/'))} className="text-white/40 hover:text-red-400 text-sm transition">
          Sign out
        </button>
      </div>

      <div className="flex-1 px-4 pt-20 pb-16 max-w-6xl mx-auto w-full">
        <m.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>

          {/* Header */}
          <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight font-display">Admin</h1>
              <p className="text-white/40 text-sm mt-1">
                {profiles.length} user{profiles.length !== 1 ? 's' : ''} · {totalVideos} clip{totalVideos !== 1 ? 's' : ''} created · {activeUsers} active user{activeUsers !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={loadData}
              className="px-4 py-2 rounded-xl border border-white/10 text-white/60 hover:text-white hover:border-white/30 text-sm transition"
            >
              Refresh
            </button>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
            {[
              { label: 'Total users', value: profiles.length },
              { label: 'Total clips made', value: totalVideos },
              { label: 'Users with clips', value: activeUsers },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
                <p className="text-white/40 text-xs uppercase tracking-wider mb-1">{s.label}</p>
                <p className="text-white text-2xl font-bold">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Search */}
          <div className="mb-6">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by email or name…"
              className="w-full max-w-sm bg-white/[0.05] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-primary text-sm transition"
            />
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-24">
              <div className="animate-spin w-10 h-10 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : (
            <div className="rounded-2xl border border-white/[0.08] overflow-hidden overflow-x-auto">
              <table className="w-full text-sm min-w-[700px]">
                <thead>
                  <tr className="border-b border-white/[0.08] bg-white/[0.02]">
                    <th className="text-left px-6 py-4 text-white/40 font-medium">User</th>
                    <th className="text-left px-6 py-4 text-white/40 font-medium">Email</th>
                    <th className="text-left px-6 py-4 text-white/40 font-medium">Credits</th>
                    <th className="text-left px-6 py-4 text-white/40 font-medium">Give credits</th>
                    <th className="text-left px-6 py-4 text-white/40 font-medium">Clips</th>
                    <th className="text-left px-6 py-4 text-white/40 font-medium">Last clip</th>
                    <th className="text-left px-6 py-4 text-white/40 font-medium">Joined</th>
                    <th className="text-left px-6 py-4 text-white/40 font-medium">Role</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-16 text-white/30">
                        No users found.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((profile) => {
                      const stats = videoStats[profile.id];
                      return (
                        <tr
                          key={profile.id}
                          className="border-b border-white/[0.04] hover:bg-white/[0.02] transition"
                        >
                          {/* Avatar + Name */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {profile.avatar_url ? (
                                <img src={profile.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
                                  {(profile.full_name || profile.email || '?')[0].toUpperCase()}
                                </div>
                              )}
                              <span className="text-white/80">
                                {profile.full_name || <span className="text-white/30 italic">No name</span>}
                              </span>
                              {profile.id === currentUser?.id && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary">you</span>
                              )}
                            </div>
                          </td>

                          {/* Email */}
                          <td className="px-6 py-4 text-white/60">{profile.email}</td>

                          {/* Credits */}
                          <td className="px-6 py-4">
                            <span className={`text-sm font-semibold ${(profile.credits ?? 0) > 0 ? 'text-primary' : 'text-white/30'}`}>
                              {profile.credits ?? 0}
                            </span>
                          </td>

                          {/* Give credits */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                min="100"
                                max="1000"
                                value={grantAmount[profile.id] || ''}
                                onChange={(e) => setGrantAmount((prev) => ({ ...prev, [profile.id]: e.target.value }))}
                                placeholder="100"
                                className="w-14 bg-white/[0.05] border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs text-center focus:outline-none focus:border-primary"
                              />
                              <button
                                onClick={() => grantCredits(profile.id)}
                                disabled={grantingId === profile.id}
                                className="px-2.5 py-1.5 bg-primary/20 text-primary hover:bg-primary/30 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                              >
                                {grantingId === profile.id ? '…' : '+ Add'}
                              </button>
                            </div>
                          </td>

                          {/* Clips count */}
                          <td className="px-6 py-4">
                            {stats ? (
                              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/20 text-primary">
                                {stats.video_count}
                              </span>
                            ) : (
                              <span className="text-white/25">0</span>
                            )}
                          </td>

                          {/* Last clip */}
                          <td className="px-6 py-4 text-white/50 text-xs">
                            {stats ? fmt(stats.last_video_at) : '-'}
                          </td>

                          {/* Joined */}
                          <td className="px-6 py-4 text-white/40 text-xs">
                            {profile.created_at ? fmt(profile.created_at) : '-'}
                          </td>

                          {/* Role selector */}
                          <td className="px-6 py-4">
                            <select
                              value={profile.role || 'user'}
                              onChange={(e) => changeRole(profile.id, e.target.value)}
                              disabled={updatingId === profile.id || profile.id === currentUser?.id}
                              className="bg-white/[0.05] border border-white/10 rounded-lg px-3 py-1.5 text-white/70 text-xs focus:outline-none focus:border-primary disabled:opacity-40 disabled:cursor-not-allowed transition"
                            >
                              {ROLES.map((r) => (
                                <option key={r} value={r} className="bg-[#1a1a1a]">{r}</option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </m.div>
      </div>
    </div>
  );
}
