import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { groupService, type Group } from '../services/groupService';

// ─── Add Member Modal ────────────────────────────────────────────────────────
function AddMemberModal({
  groupId,
  token,
  onClose,
  onAdded,
}: {
  groupId: string;
  token: string | null;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [userId, setUserId] = useState('');
  const [isVegetarian, setIsVegetarian] = useState(false);
  const [drinksAlcohol, setDrinksAlcohol] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!userId.trim() || !token) return;
    setLoading(true);
    setError('');
    try {
      await groupService.addGroupMember(token, groupId, {
        userId: userId.trim(),
        preferences: { isVegetarian, drinksAlcohol },
      });
      onAdded();
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <div className="modal-title">Add <em>Member</em></div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {error && (
            <div style={{ color: 'var(--red)', fontFamily: 'DM Mono, monospace', fontSize: 11, marginBottom: 16, padding: '10px 14px', border: '1px solid var(--red)' }}>
              {error}
            </div>
          )}
          <div className="form-field">
            <label className="form-label">User ID</label>
            <input className="form-input" placeholder="Clerk user ID" value={userId} onChange={e => setUserId(e.target.value)} />
          </div>
          <div className="form-field">
            <label className="form-label">Dietary Preferences</label>
            <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
              {[
                { label: 'Vegetarian', state: isVegetarian, set: setIsVegetarian },
                { label: 'Drinks Alcohol', state: drinksAlcohol, set: setDrinksAlcohol },
              ].map(({ label, state, set }) => (
                <label key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <div
                    onClick={() => set(!state)}
                    style={{
                      width: 16, height: 16,
                      border: `1px solid ${state ? 'var(--gold)' : 'var(--border)'}`,
                      background: state ? 'var(--gold-dim)' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', transition: 'all 0.2s ease',
                    }}
                  >
                    {state && <span style={{ color: 'var(--gold)', fontSize: 10 }}>✓</span>}
                  </div>
                  <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)' }}>{label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-gold" onClick={submit} disabled={loading}>
            {loading ? 'Adding...' : 'Add Member'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Group Detail Drawer ─────────────────────────────────────────────────────
function GroupDetailDrawer({
  group,
  token,
  onClose,
  onMemberRemoved,
  onMemberAdded,
}: {
  group: Group;
  token: string | null;
  onClose: () => void;
  onMemberRemoved: () => void;
  onMemberAdded: () => void;
}) {
  const [showAddMember, setShowAddMember] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const removeMember = async (memberId: string) => {
    if (!token) return;
    setRemovingId(memberId);
    setError('');
    try {
      await groupService.removeGroupMember(token, group.id, memberId);
      onMemberRemoved();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <>
      <div style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 150,
        display: 'flex', justifyContent: 'flex-end',
      }} onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div style={{
          width: 420, height: '100%', background: 'var(--surface)',
          borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column',
          animation: 'slideInRight 0.25s ease',
        }}>
          <div className="section-header">
            <div>
              <div className="section-label">Group Details</div>
              <div className="section-title" style={{ fontSize: 18 }}><em>{group.name}</em></div>
            </div>
            <button className="modal-close" onClick={onClose}>✕</button>
          </div>

          {/* Meta */}
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 24 }}>
            <div>
              <div className="stat-cell-label" style={{ marginBottom: 4 }}>Currency</div>
              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 13, color: 'var(--gold)' }}>{group.currency}</div>
            </div>
            <div>
              <div className="stat-cell-label" style={{ marginBottom: 4 }}>Members</div>
              <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, fontWeight: 900, color: 'var(--text)' }}>{group.members.length}</div>
            </div>
          </div>

          {error && (
            <div style={{ margin: '12px 24px', color: 'var(--red)', fontFamily: 'DM Mono, monospace', fontSize: 11, padding: '10px 14px', border: '1px solid var(--red)' }}>
              {error}
            </div>
          )}

          <div style={{ flex: 1, overflowY: 'auto' }}>
            <div style={{ padding: '16px 24px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="section-label" style={{ marginBottom: 0 }}>Members</div>
              <button className="btn-ghost" style={{ padding: '6px 14px', fontSize: 10 }} onClick={() => setShowAddMember(true)}>
                + Add
              </button>
            </div>
            {group.members.map((m) => (
              <div key={m.id} style={{
                padding: '16px 24px', borderBottom: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'Instrument Sans, sans-serif', fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
                    {m.userId}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{
                      fontFamily: 'DM Mono, monospace', fontSize: 9, textTransform: 'uppercase',
                      letterSpacing: '0.1em', padding: '2px 8px',
                      border: `1px solid ${m.role === 'OWNER' ? 'var(--gold)' : 'var(--border)'}`,
                      color: m.role === 'OWNER' ? 'var(--gold)' : 'var(--muted)',
                    }}>{m.role}</span>
                    {m.isVegetarian && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'DM Mono, monospace', fontSize: 9, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} />
                        Veg
                      </span>
                    )}
                    {m.drinksAlcohol && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'DM Mono, monospace', fontSize: 9, color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--purple)', display: 'inline-block' }} />
                        Alcohol
                      </span>
                    )}
                  </div>
                </div>
                {m.role !== 'OWNER' && (
                  <button
                    className="btn-ghost"
                    style={{ padding: '4px 12px', fontSize: 9, color: 'var(--red)', borderColor: 'var(--red)' }}
                    disabled={removingId === m.id}
                    onClick={() => removeMember(m.id)}
                  >
                    {removingId === m.id ? '...' : 'Remove'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {showAddMember && (
        <AddMemberModal
          groupId={group.id}
          token={token}
          onClose={() => setShowAddMember(false)}
          onAdded={onMemberAdded}
        />
      )}

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(40px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </>
  );
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { userId, getToken, isLoaded } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupCurrency, setNewGroupCurrency] = useState('INR');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');
  const [barsLoaded, setBarsLoaded] = useState(false);
  const [visibleCards, setVisibleCards] = useState<number[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

  // Get token on auth load
  useEffect(() => {
    (async () => {
      if (!isLoaded || !userId) return;
      try {
        const t = await getToken();
        console.log("[Dashboard] Token obtained");
        setToken(t);
      } catch (e) {
        console.error('[Dashboard] Failed to get token:', e);
      }
    })();
  }, [isLoaded, userId, getToken]);

  const fetchGroups = useCallback(async () => {
    if (!userId || !token) return;
    setLoading(true);
    setError('');
    try {
      const data = await groupService.listGroups(token, userId);
      setGroups(data);
      data.forEach((_, i) => {
        setTimeout(() => setVisibleCards(prev => [...prev, i]), i * 150);
      });
      setTimeout(() => setBarsLoaded(true), 300);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [userId, token]);

  useEffect(() => { fetchGroups(); }, [fetchGroups]);

  const refreshSelectedGroup = async () => {
    if (!selectedGroup || !token) return;
    try {
      const updated = await groupService.getGroupDetails(token, selectedGroup.id);
      setSelectedGroup(updated);
      fetchGroups();
    } catch {}
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim() || !token) return;
    setCreateLoading(true);
    setCreateError('');
    try {
      await groupService.createGroup(token, {
        name: newGroupName.trim(),
        description: newGroupDesc.trim() || undefined,
        currency: newGroupCurrency,
      });
      setNewGroupName('');
      setNewGroupDesc('');
      setNewGroupCurrency('INR');
      setShowCreateModal(false);
      fetchGroups();
    } catch (e: any) {
      setCreateError(e.message);
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,900&family=DM+Mono:wght@300;400;500&family=Instrument+Sans:wght@400;500;600&display=swap');

        :root {
          --bg: #0e0e0e;
          --surface: #161616;
          --surface2: #1e1e1e;
          --border: #2a2a2a;
          --gold: #d4a847;
          --gold-light: #f0c96a;
          --gold-dim: rgba(212,168,71,0.15);
          --green: #4ade80;
          --red: #f87171;
          --purple: #a78bfa;
          --text: #f0ede8;
          --muted: #7a7570;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }
        .db-root { background: var(--bg); min-height: 100vh; font-family: 'Instrument Sans', sans-serif; color: var(--text); }
        .db-nav { border-bottom: 1px solid var(--border); padding: 0 48px; height: 64px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 100; background: var(--bg); }
        .db-nav-logo { font-family: 'Playfair Display', serif; font-weight: 900; font-size: 20px; letter-spacing: -1px; color: var(--text); }
        .db-nav-logo span { color: var(--gold); font-style: italic; }
        .db-nav-links { display: flex; align-items: center; gap: 32px; }
        .db-nav-link { font-family: 'DM Mono', monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 0.2em; color: var(--muted); text-decoration: none; transition: color 0.2s ease; cursor: pointer; background: none; border: none; }
        .db-nav-link:hover { color: var(--text); }
        .db-nav-link.active { color: var(--gold); }
        .db-nav-avatar { width: 32px; height: 32px; background: var(--gold-dim); border: 1px solid var(--gold); display: flex; align-items: center; justify-content: center; font-family: 'DM Mono', monospace; font-size: 11px; color: var(--gold); cursor: pointer; }
        .db-main { padding: 64px 48px; max-width: 1280px; margin: 0 auto; }
        .section-label { font-family: 'DM Mono', monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 0.2em; color: var(--gold); margin-bottom: 12px; }
        .db-hero { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 64px; padding-bottom: 64px; border-bottom: 1px solid var(--border); animation: fadeUp 0.6s ease both; }
        .db-hero-title { font-family: 'Playfair Display', serif; font-size: 56px; font-weight: 900; letter-spacing: -2px; line-height: 1.05; color: var(--text); }
        .db-hero-title em { font-style: italic; color: var(--gold); }
        .db-hero-subtitle { font-family: 'Instrument Sans', sans-serif; font-size: 14px; color: var(--muted); margin-top: 12px; font-weight: 400; }
        .ai-badge { display: inline-flex; align-items: center; gap: 8px; border: 1px solid var(--gold); padding: 6px 14px; font-family: 'DM Mono', monospace; font-size: 9px; text-transform: uppercase; letter-spacing: 0.2em; color: var(--gold); margin-bottom: 16px; }
        .ai-dot { width: 5px; height: 5px; background: var(--gold); border-radius: 50%; animation: pulse 1.5s ease infinite; }
        .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); border: 1px solid var(--border); margin-bottom: 64px; animation: fadeUp 0.6s ease 0.15s both; }
        .stat-cell { padding: 36px 32px; border-right: 1px solid var(--border); transition: background 0.2s ease; }
        .stat-cell:last-child { border-right: none; }
        .stat-cell:hover { background: var(--surface); }
        .stat-cell-label { font-family: 'DM Mono', monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 0.2em; color: var(--muted); margin-bottom: 16px; }
        .stat-cell-value { font-family: 'Playfair Display', serif; font-size: 40px; font-weight: 900; letter-spacing: -1.5px; line-height: 1; }
        .stat-cell-value.positive { color: var(--green); }
        .stat-cell-value.negative { color: var(--red); }
        .stat-cell-value.neutral { color: var(--text); }
        .stat-cell-currency { font-family: 'DM Mono', monospace; font-size: 12px; color: var(--muted); margin-top: 8px; text-transform: uppercase; letter-spacing: 0.1em; }
        .two-col { display: grid; grid-template-columns: 1fr 380px; gap: 0; border: 1px solid var(--border); margin-bottom: 64px; animation: fadeUp 0.6s ease 0.3s both; }
        .two-col-main { border-right: 1px solid var(--border); }
        .section-header { padding: 28px 32px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; }
        .section-title { font-family: 'Playfair Display', serif; font-size: 22px; font-weight: 900; letter-spacing: -0.5px; }
        .section-title em { font-style: italic; color: var(--gold); }
        .group-row { padding: 24px 32px; border-bottom: 1px solid var(--border); display: grid; grid-template-columns: 1fr auto auto; align-items: center; gap: 24px; opacity: 0; transform: translateX(-12px); transition: all 0.4s ease, background 0.2s ease; cursor: pointer; }
        .group-row.visible { opacity: 1; transform: translateX(0); }
        .group-row:hover { background: var(--surface); }
        .group-row:last-child { border-bottom: none; }
        .group-row-name { font-family: 'Instrument Sans', sans-serif; font-size: 15px; font-weight: 600; color: var(--text); margin-bottom: 4px; }
        .group-row-meta { font-family: 'DM Mono', monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--muted); }
        .group-row-amount { font-family: 'Playfair Display', serif; font-size: 18px; font-weight: 900; letter-spacing: -0.5px; }
        .group-row-amount-label { font-family: 'DM Mono', monospace; font-size: 9px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--muted); margin-top: 2px; }
        .split-bar-wrap { display: flex; height: 4px; margin-top: 10px; gap: 1px; overflow: hidden; }
        .split-bar-seg { height: 4px; transition: width 1s ease; }
        .empty-state { padding: 64px 32px; text-align: center; }
        .empty-state-icon { font-size: 32px; margin-bottom: 16px; opacity: 0.3; }
        .empty-state-text { font-family: 'DM Mono', monospace; font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; color: var(--muted); }
        .settlements-panel {}
        .settlement-row { padding: 20px 24px; border-bottom: 1px solid var(--border); }
        .settlement-row:last-child { border-bottom: none; }
        .settlement-names { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
        .settlement-name { font-family: 'Instrument Sans', sans-serif; font-size: 13px; font-weight: 600; color: var(--text); }
        .settlement-arrow { font-family: 'DM Mono', monospace; font-size: 9px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--muted); padding: 2px 8px; border: 1px solid var(--border); }
        .settlement-bar-track { height: 3px; background: var(--border); margin-bottom: 8px; overflow: hidden; }
        .settlement-bar-fill { height: 3px; transition: width 1s ease; }
        .settlement-amount { display: flex; justify-content: space-between; align-items: center; }
        .settlement-val { font-family: 'Playfair Display', serif; font-size: 16px; font-weight: 900; letter-spacing: -0.3px; }
        .settlement-settle-btn { font-family: 'DM Mono', monospace; font-size: 9px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--gold); background: none; border: 1px solid var(--gold); padding: 4px 12px; cursor: pointer; transition: all 0.2s ease; }
        .settlement-settle-btn:hover { background: var(--gold-dim); }
        .btn-gold { background: var(--gold); color: #0e0e0e; font-family: 'DM Mono', monospace; font-size: 11px; text-transform: uppercase; letter-spacing: 0.2em; border: none; padding: 14px 28px; cursor: pointer; font-weight: 500; transition: transform 0.2s ease, background 0.2s ease; }
        .btn-gold:hover { background: var(--gold-light); transform: translateY(-2px); }
        .btn-gold:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
        .btn-ghost { background: none; color: var(--muted); font-family: 'DM Mono', monospace; font-size: 11px; text-transform: uppercase; letter-spacing: 0.2em; border: 1px solid var(--border); padding: 14px 28px; cursor: pointer; transition: color 0.2s ease, border-color 0.2s ease; }
        .btn-ghost:hover { color: var(--text); border-color: var(--muted); }
        .feature-grid { display: grid; grid-template-columns: repeat(3, 1fr); border-left: 1px solid var(--border); border-top: 1px solid var(--border); margin-bottom: 64px; animation: fadeUp 0.6s ease 0.45s both; }
        .feature-card { border-right: 1px solid var(--border); border-bottom: 1px solid var(--border); padding: 36px 32px; position: relative; overflow: hidden; transition: background 0.2s ease; }
        .feature-card::before { content: ''; position: absolute; top: 0; left: 0; width: 0; height: 2px; background: var(--gold); transition: width 0.4s ease; }
        .feature-card:hover::before { width: 100%; }
        .feature-card:hover { background: var(--surface); }
        .feature-card-num { font-family: 'Playfair Display', serif; font-size: 48px; font-weight: 900; color: var(--border); letter-spacing: -2px; line-height: 1; margin-bottom: 20px; transition: color 0.3s ease; }
        .feature-card:hover .feature-card-num { color: var(--surface2); }
        .feature-card-title { font-family: 'Instrument Sans', sans-serif; font-size: 15px; font-weight: 600; color: var(--text); margin-bottom: 8px; }
        .feature-card-desc { font-family: 'Instrument Sans', sans-serif; font-size: 13px; color: var(--muted); line-height: 1.6; }
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 200; display: flex; align-items: center; justify-content: center; animation: fadeUp 0.2s ease; }
        .modal-box { background: var(--surface); border: 1px solid var(--border); width: 480px; padding: 0; }
        .modal-header { padding: 28px 32px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
        .modal-title { font-family: 'Playfair Display', serif; font-size: 22px; font-weight: 900; letter-spacing: -0.5px; }
        .modal-title em { font-style: italic; color: var(--gold); }
        .modal-close { background: none; border: none; color: var(--muted); font-size: 18px; cursor: pointer; padding: 4px; transition: color 0.2s ease; font-family: 'DM Mono', monospace; }
        .modal-close:hover { color: var(--text); }
        .modal-body { padding: 32px; }
        .form-field { margin-bottom: 24px; }
        .form-label { font-family: 'DM Mono', monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 0.2em; color: var(--muted); margin-bottom: 10px; display: block; }
        .form-input { width: 100%; background: var(--bg); border: 1px solid var(--border); color: var(--text); font-family: 'Instrument Sans', sans-serif; font-size: 15px; padding: 14px 16px; outline: none; transition: border-color 0.2s ease; }
        .form-input:focus { border-color: var(--gold); }
        .form-input::placeholder { color: var(--muted); }
        .modal-footer { padding: 24px 32px; border-top: 1px solid var(--border); display: flex; gap: 12px; justify-content: flex-end; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
      `}</style>

      <div className="db-root">
        {/* NAV */}
        <nav className="db-nav">
          <div className="db-nav-logo">Smart<span>Split</span></div>
          <div className="db-nav-links">
            <span className="db-nav-link active">Dashboard</span>
            <span className="db-nav-link">Groups</span>
            <span className="db-nav-link">History</span>
            <span className="db-nav-link">Settle Up</span>
          </div>
          <div className="db-nav-avatar">{userId?.slice(0, 2).toUpperCase() ?? 'ME'}</div>
        </nav>

        <main className="db-main">
          <div className="db-hero">
            <div>
              <div className="ai-badge"><span className="ai-dot" />AI-Powered Splitting</div>
              <h1 className="db-hero-title">Your <em>financial</em><br />overview</h1>
              <p className="db-hero-subtitle">All your shared expenses, intelligently organized.</p>
            </div>
            <button className="btn-gold" onClick={() => setShowCreateModal(true)}>+ New Group</button>
          </div>

          <div className="stats-grid">
            <div className="stat-cell">
              <div className="stat-cell-label">Total Groups</div>
              <div className="stat-cell-value neutral">{loading ? '—' : groups.length}</div>
              <div className="stat-cell-currency">Active · All time</div>
            </div>
            <div className="stat-cell">
              <div className="stat-cell-label">Total Members</div>
              <div className="stat-cell-value positive">{loading ? '—' : groups.reduce((a, g) => a + (g.memberCount ?? g.members.length), 0)}</div>
              <div className="stat-cell-currency" style={{ color: 'var(--green)' }}>Across all groups</div>
            </div>
            <div className="stat-cell">
              <div className="stat-cell-label">Currencies</div>
              <div className="stat-cell-value neutral" style={{ fontSize: 28 }}>{loading ? '—' : [...new Set(groups.map(g => g.currency))].join(' · ') || '—'}</div>
              <div className="stat-cell-currency">In use</div>
            </div>
          </div>

          <div className="two-col">
            <div className="two-col-main">
              <div className="section-header">
                <div>
                  <div className="section-label">Your Groups</div>
                  <div className="section-title">Active <em>splits</em></div>
                </div>
                <button className="btn-ghost" style={{ padding: '10px 20px' }} onClick={() => setShowCreateModal(true)}>+ Add Group</button>
              </div>

              {error && (
                <div style={{ padding: '24px 32px', color: 'var(--red)', fontFamily: 'DM Mono, monospace', fontSize: 11, borderBottom: '1px solid var(--border)' }}>
                  ⚠ {error} — <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => fetchGroups()}>Retry</span>
                </div>
              )}

              {loading && !error && [0, 1, 2].map(i => (
                <div key={i} style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ height: 14, width: '40%', background: 'var(--surface2)', marginBottom: 8, animation: 'pulse 1.5s ease infinite' }} />
                  <div style={{ height: 10, width: '20%', background: 'var(--surface2)', animation: 'pulse 1.5s ease infinite' }} />
                </div>
              ))}

              {!loading && !error && groups.length === 0 && (
                <div className="empty-state">
                  <div className="empty-state-icon">◈</div>
                  <div className="empty-state-text">No groups yet — create one to begin</div>
                </div>
              )}

              {!loading && groups.map((group, i) => (
                <div key={group.id} className={`group-row ${visibleCards.includes(i) ? 'visible' : ''}`} onClick={() => setSelectedGroup(group)}>
                  <div>
                    <div className="group-row-name">{group.name}</div>
                    <div className="group-row-meta">{group.memberCount ?? group.members.length} members · {group.currency}{group.description && ` · ${group.description}`}</div>
                    <div className="split-bar-wrap">
                      <div className="split-bar-seg" style={{ width: barsLoaded ? '45%' : '0%', background: 'var(--green)' }} />
                      <div className="split-bar-seg" style={{ width: barsLoaded ? '30%' : '0%', background: 'var(--red)' }} />
                      <div className="split-bar-seg" style={{ width: barsLoaded ? '15%' : '0%', background: 'var(--purple)' }} />
                      <div className="split-bar-seg" style={{ width: barsLoaded ? '10%' : '0%', background: 'var(--gold)' }} />
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="group-row-amount" style={{ color: 'var(--muted)', fontSize: 14 }}>{new Date(group.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                    <div className="group-row-amount-label">Created</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="group-row-amount" style={{ color: 'var(--gold)', fontSize: 14 }}>View →</div>
                    <div className="group-row-amount-label">Details</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="two-col-side">
              <div className="section-header">
                <div>
                  <div className="section-label">Quick Stats</div>
                  <div className="section-title"><em>Overview</em></div>
                </div>
              </div>
              <div className="settlements-panel">
                {groups.slice(0, 5).map((g) => (
                  <div key={g.id} className="settlement-row">
                    <div className="settlement-names">
                      <span className="settlement-name" style={{ fontSize: 12 }}>{g.name}</span>
                    </div>
                    <div className="settlement-bar-track">
                      <div className="settlement-bar-fill" style={{ width: barsLoaded ? `${Math.min(100, ((g.memberCount ?? g.members.length) / 10) * 100)}%` : '0%', background: 'var(--gold)' }} />
                    </div>
                    <div className="settlement-amount">
                      <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{g.memberCount ?? g.members.length} members</span>
                      <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{g.currency}</span>
                    </div>
                  </div>
                ))}
                {groups.length === 0 && !loading && (
                  <div className="empty-state" style={{ padding: 32 }}>
                    <div className="empty-state-text">No data yet</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="section-label">Platform Features</div>
          <div className="feature-grid">
            {[
              { num: '01', title: 'AI Receipt Scanning', desc: 'Upload any bill — SmartSplit reads, categorizes, and assigns each item automatically.' },
              { num: '02', title: 'Smart Categorization', desc: 'Veg, non-veg, alcohol, and shared items are auto-tagged with full transparency.' },
              { num: '03', title: 'Instant Settlement', desc: 'One-tap UPI settlements with real-time balance sync across all group members.' },
            ].map((f) => (
              <div key={f.num} className="feature-card">
                <div className="feature-card-num">{f.num}</div>
                <div className="feature-card-title">{f.title}</div>
                <div className="feature-card-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </main>
      </div>

      {showCreateModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowCreateModal(false)}>
          <div className="modal-box">
            <div className="modal-header">
              <div className="modal-title">New <em>Group</em></div>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              {createError && (
                <div style={{ color: 'var(--red)', fontFamily: 'DM Mono, monospace', fontSize: 11, marginBottom: 20, padding: '10px 14px', border: '1px solid var(--red)' }}>
                  {createError}
                </div>
              )}
              <div className="form-field">
                <label className="form-label">Group Name *</label>
                <input className="form-input" placeholder="e.g. Goa Trip 2024" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} />
              </div>
              <div className="form-field">
                <label className="form-label">Description</label>
                <input className="form-input" placeholder="Optional description" value={newGroupDesc} onChange={e => setNewGroupDesc(e.target.value)} />
              </div>
              <div className="form-field">
                <label className="form-label">Currency *</label>
                <select className="form-input" value={newGroupCurrency} onChange={e => setNewGroupCurrency(e.target.value)} style={{ appearance: 'none' }}>
                  {['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD'].map(c => (
                    <option key={c} value={c} style={{ background: 'var(--bg)' }}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-ghost" onClick={() => setShowCreateModal(false)}>Cancel</button>
              <button className="btn-gold" onClick={handleCreateGroup} disabled={createLoading}>
                {createLoading ? 'Creating...' : 'Create Group'}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedGroup && (
        <GroupDetailDrawer
          group={selectedGroup}
          token={token}
          onClose={() => setSelectedGroup(null)}
          onMemberRemoved={refreshSelectedGroup}
          onMemberAdded={refreshSelectedGroup}
        />
      )}
    </>
  );
}
