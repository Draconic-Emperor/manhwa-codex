import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { Search, Home, BookOpen, Users, Lightbulb, Clock, Trophy, BookmarkIcon, HelpCircle, LogOut, LogIn, Plus, ChevronRight, Shuffle } from 'lucide-react';

// Constants
const RANKS = [
  { id: 'unparalleled', name: 'Unparalleled', emoji: 'SS', color: '#c084fc' },
  { id: 'apex', name: 'Apex', emoji: 'S', color: '#fbbf24' },
  { id: 'severe', name: 'Severe', emoji: 'A', color: '#ef4444' },
  { id: 'high', name: 'High', emoji: 'B', color: '#06b6d4' },
  { id: 'moderate', name: 'Moderate', emoji: 'C', color: '#10b981' },
  { id: 'unranked', name: 'Unranked', emoji: 'E', color: '#6b7280' },
];

const INSIGHT_TYPES = [
  { id: 'theory', name: 'Theory', icon: '💭' },
  { id: 'lore_fact', name: 'Lore Fact', icon: '❄️' },
  { id: 'analysis', name: 'Analysis', icon: '✨' },
  { id: 'question', name: 'Question', icon: '❓' },
];

// Utility functions
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function formatDate(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function csvToArray(str) {
  return (str || '').split(',').map((s) => s.trim()).filter(Boolean);
}

function linesToArray(str) {
  return (str || '').split('\n').map((s) => s.trim()).filter(Boolean);
}

const rankInfo = (id) => RANKS.find((r) => r.id === id) || RANKS[5];
const insightTypeInfo = (id) => INSIGHT_TYPES.find((t) => t.id === id) || INSIGHT_TYPES[0];

// UI Components
function RankBadge({ rank, size = 'md' }) {
  const info = rankInfo(rank);
  const sizeMap = { sm: '24px', md: '32px', lg: '48px' };
  return (
    <div style={{
      width: sizeMap[size],
      height: sizeMap[size],
      borderRadius: '50%',
      background: info.color,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 'bold',
      color: '#fff',
      fontSize: size === 'sm' ? '12px' : size === 'md' ? '14px' : '20px',
    }}>
      {info.emoji}
    </div>
  );
}

function StatusPill({ status }) {
  const colors = {
    ongoing: '#ef4444',
    completed: '#10b981',
    hiatus: '#f59e0b',
  };
  return (
    <span className="status-pill" style={{ background: colors[status] || '#6b7280' }}>
      {status?.toUpperCase()}
    </span>
  );
}

function InsightTypeTag({ type }) {
  const info = insightTypeInfo(type);
  return (
    <span className="insight-tag">
      <span>{info.icon}</span>
      <span>{info.name}</span>
    </span>
  );
}

function GenrePill({ children }) {
  return <span className="genre-pill">{children}</span>;
}

function IconBtn({ children, onClick, title, active }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`icon-btn ${active ? 'active' : ''}`}
    >
      {children}
    </button>
  );
}

function EmptyState({ icon: Icon, title, subtitle, action }) {
  return (
    <div className="empty-state">
      <Icon size={48} />
      <h3>{title}</h3>
      {subtitle && <p>{subtitle}</p>}
      {action && <button className="btn-primary">{action}</button>}
    </div>
  );
}

function Field({ label, children, hint }) {
  return (
    <div className="field">
      {label && <label>{label}</label>}
      {children}
      {hint && <small>{hint}</small>}
    </div>
  );
}

function Modal({ title, onClose, children, wide }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal ${wide ? 'wide' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

function ManhwaCard({ manhwa, characterCount, onClick }) {
  const rank = rankInfo(manhwa.rank);
  return (
    <div className="card manhwa-card" onClick={onClick}>
      <div className="card-header" style={{ backgroundColor: rank.color }}>
        <RankBadge rank={manhwa.rank} size="lg" />
      </div>
      <div className="card-body">
        <h3>{manhwa.title}</h3>
        <p className="text-sm">{manhwa.author}</p>
        {manhwa.status && <StatusPill status={manhwa.status} />}
        <div className="card-footer">
          <small>{characterCount} characters</small>
        </div>
      </div>
    </div>
  );
}

function CharacterCard({ character, manhwaTitle, onClick }) {
  return (
    <div className="card character-card" onClick={onClick}>
      <div className="card-header" style={{ backgroundColor: rankInfo(character.rank).color }}>
        <RankBadge rank={character.rank} size="lg" />
      </div>
      <div className="card-body">
        <h3>{character.name}</h3>
        <p className="text-sm">{manhwaTitle}</p>
        {character.role && <p className="text-xs">{character.role}</p>}
      </div>
    </div>
  );
}

function ManhwaForm({ initial, onSubmit, onCancel, saving, error }) {
  const [data, setData] = useState(initial || {
    title: '',
    author: '',
    description: '',
    genres: '',
    status: 'ongoing',
    rank: 'moderate',
  });

  const submit = (e) => {
    e.preventDefault();
    onSubmit(data);
  };

  return (
    <form onSubmit={submit} className="form">
      {error && <div className="error-msg">{error}</div>}
      <Field label="Title">
        <input
          type="text"
          className="codex-input w-full"
          value={data.title}
          onChange={(e) => setData({ ...data, title: e.target.value })}
          required
        />
      </Field>
      <Field label="Author">
        <input
          type="text"
          className="codex-input w-full"
          value={data.author}
          onChange={(e) => setData({ ...data, author: e.target.value })}
        />
      </Field>
      <Field label="Description">
        <textarea
          className="codex-input w-full"
          rows="4"
          value={data.description}
          onChange={(e) => setData({ ...data, description: e.target.value })}
        />
      </Field>
      <Field label="Genres" hint="comma-separated">
        <input
          type="text"
          className="codex-input w-full"
          value={data.genres}
          onChange={(e) => setData({ ...data, genres: e.target.value })}
          placeholder="Action, Fantasy, Adventure"
        />
      </Field>
      <Field label="Status">
        <select className="codex-input w-full" value={data.status} onChange={(e) => setData({ ...data, status: e.target.value })}>
          <option value="ongoing">Ongoing</option>
          <option value="completed">Completed</option>
          <option value="hiatus">Hiatus</option>
        </select>
      </Field>
      <Field label="Rank">
        <select className="codex-input w-full" value={data.rank} onChange={(e) => setData({ ...data, rank: e.target.value })}>
          {RANKS.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
      </Field>
      <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
      </div>
    </form>
  );
}

function CharacterForm({ initial, manhwaList, defaultmanhwa_id, onSubmit, onCancel, saving, error }) {
  const [data, setData] = useState(initial || {
    name: '',
    role: '',
    description: '',
    manhwa_id: defaultmanhwa_id || '',
    rank: 'moderate',
  });

  const submit = (e) => {
    e.preventDefault();
    onSubmit(data);
  };

  return (
    <form onSubmit={submit} className="form">
      {error && <div className="error-msg">{error}</div>}
      <Field label="Manhwa">
        <select
          className="codex-input w-full"
          value={data.manhwa_id}
          onChange={(e) => setData({ ...data, manhwa_id: e.target.value })}
          required
        >
          <option value="">Select a manhwa</option>
          {manhwaList.map((m) => (
            <option key={m.id} value={m.id}>{m.title}</option>
          ))}
        </select>
      </Field>
      <Field label="Name">
        <input
          type="text"
          className="codex-input w-full"
          value={data.name}
          onChange={(e) => setData({ ...data, name: e.target.value })}
          required
        />
      </Field>
      <Field label="Role">
        <input
          type="text"
          className="codex-input w-full"
          value={data.role}
          onChange={(e) => setData({ ...data, role: e.target.value })}
        />
      </Field>
      <Field label="Description">
        <textarea
          className="codex-input w-full"
          rows="4"
          value={data.description}
          onChange={(e) => setData({ ...data, description: e.target.value })}
        />
      </Field>
      <Field label="Rank">
        <select className="codex-input w-full" value={data.rank} onChange={(e) => setData({ ...data, rank: e.target.value })}>
          {RANKS.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
      </Field>
      <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
      </div>
    </form>
  );
}

function InsightForm({ onSubmit, saving }) {
  const [data, setData] = useState({
    type: 'theory',
    content: '',
  });

  const submit = (e) => {
    e.preventDefault();
    onSubmit(data);
    setData({ type: 'theory', content: '' });
  };

  return (
    <form onSubmit={submit} className="form">
      <Field label="Type">
        <select className="codex-input w-full" value={data.type} onChange={(e) => setData({ ...data, type: e.target.value })}>
          {INSIGHT_TYPES.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </Field>
      <Field label="Content">
        <textarea
          className="codex-input w-full"
          rows="4"
          value={data.content}
          onChange={(e) => setData({ ...data, content: e.target.value })}
          placeholder="Share your insight..."
          required
        />
      </Field>
      <div className="form-actions">
        <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Share'}</button>
      </div>
    </form>
  );
}

// Main Views
function StatBlock({ label, value }) {
  return (
    <div className="stat-block">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function SectionHeader({ icon: Icon, title, action }) {
  return (
    <div className="section-header">
      <div className="header-left">
        <Icon size={24} />
        <h2>{title}</h2>
      </div>
      {action && <a href="#" className="view-all">{action} <ChevronRight size={16} /></a>}
    </div>
  );
}

function HomeView({ manhwaCount, characterCount, insightCount, onViewManhwa, onAddManhwa, onRandomCharacter }) {
  return (
    <div className="view-container">
      <div className="hero-banner">
        <div className="hero-content">
          <h1>CODEX</h1>
          <p>OF THE WEBTOON REALMS</p>
          <p className="hero-subtitle">A living archive of manhwa series, characters, and the knowledge to uncover hidden truths.</p>
          <div className="hero-stats">
            <StatBlock label="SERIES RECORDED" value={manhwaCount} />
            <StatBlock label="CHARACTERS CATALOGUED" value={characterCount} />
            <StatBlock label="INSIGHTS PRESERVED" value={insightCount} />
          </div>
        </div>
      </div>

      <div className="action-bar">
        <button className="action-btn" onClick={onAddManhwa}>
          <Plus size={20} /> ADD SERIES
        </button>
        <button className="action-btn">
          <Users size={20} /> ADD CHARACTER
        </button>
        <button className="action-btn">
          <Lightbulb size={20} /> SHARE INSIGHT
        </button>
      </div>

      <SectionHeader icon={BookOpen} title="FEATURED SERIES" action="VIEW ALL" />
      <div className="cards-grid">
        {/* Featured manhwa cards will go here */}
      </div>

      <SectionHeader icon={Users} title="POPULAR CHARACTERS" action="VIEW ALL" />
      <div className="cards-grid">
        {/* Popular character cards will go here */}
      </div>

      <SectionHeader icon={Lightbulb} title="RECENT INSIGHTS" action="VIEW ALL" />
      <div className="insights-list">
        {/* Insights will go here */}
      </div>
    </div>
  );
}

function ManhwaDetailView({ manhwa, characters, onBack, onOpenCharacter, onEdit, onAddCharacter }) {
  return (
    <div className="view-container">
      <button className="btn-back" onClick={onBack}>← Back</button>
      <div className="detail-header">
        <RankBadge rank={manhwa.rank} size="lg" />
        <div className="detail-info">
          <h1>{manhwa.title}</h1>
          <p>{manhwa.author}</p>
          {manhwa.status && <StatusPill status={manhwa.status} />}
        </div>
        <button className="btn-secondary" onClick={onEdit}>Edit</button>
      </div>

      {manhwa.description && <p className="detail-description">{manhwa.description}</p>}

      {manhwa.genres && (
        <div className="genres">
          {csvToArray(manhwa.genres).map((g) => (
            <GenrePill key={g}>{g}</GenrePill>
          ))}
        </div>
      )}

      <SectionHeader icon={Users} title={`CHARACTERS (${characters.length})`} />
      {characters.length > 0 ? (
        <div className="cards-grid">
          {characters.map((c) => (
            <CharacterCard
              key={c.id}
              character={c}
              manhwaTitle={manhwa.title}
              onClick={() => onOpenCharacter(c.id)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Users}
          title="No characters yet"
          subtitle="Add characters to this series"
          action="Add Character"
        />
      )}
      <button className="btn-primary" onClick={onAddCharacter}>+ Add Character</button>
    </div>
  );
}

function CharacterDetailView({ character, manhwa, insights, saving, onBack, onEdit, onAddInsight }) {
  return (
    <div className="view-container">
      <button className="btn-back" onClick={onBack}>← Back</button>
      <div className="detail-header">
        <RankBadge rank={character.rank} size="lg" />
        <div className="detail-info">
          <h1>{character.name}</h1>
          <p>{manhwa?.title}</p>
          {character.role && <p className="text-sm">{character.role}</p>}
        </div>
        <button className="btn-secondary" onClick={onEdit}>Edit</button>
      </div>

      {character.description && <p className="detail-description">{character.description}</p>}

      <SectionHeader icon={Lightbulb} title={`INSIGHTS (${insights.length})`} />
      <div className="insights-list">
        {insights.map((i) => (
          <div key={i.id} className="insight-item">
            <InsightTypeTag type={i.type} />
            <p>{i.content}</p>
            <small>{formatDate(i.created_at)}</small>
          </div>
        ))}
      </div>

      <div className="insight-form-container">
        <h3>Share an Insight</h3>
        <InsightForm onSubmit={onAddInsight} saving={saving} />
      </div>
    </div>
  );
}

// Main App
export default function ManhwaCodex() {
  const [user, setUser] = useState(null);
  const [manhwaList, setManhwaList] = useState([]);
  const [characterList, setCharacterList] = useState([]);
  const [insightList, setInsightList] = useState([]);
  const [view, setView] = useState('home');
  const [selectedManhwaId, setSelectedManhwaId] = useState(null);
  const [selectedCharacterId, setSelectedCharacterId] = useState(null);
  const [showManhwaForm, setShowManhwaForm] = useState(false);
  const [showCharacterForm, setShowCharacterForm] = useState(false);
  const [editingManhwa, setEditingManhwa] = useState(null);
  const [editingCharacter, setEditingCharacter] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Data loading
  async function loadManhwa() {
    try {
      const { data, error: err } = await supabase.from('manhwa').select('*');
      if (err) throw err;
      setManhwaList(data || []);
    } catch (err) {
      console.error('Error loading manhwa:', err);
    }
  }

  async function loadCharacters() {
    try {
      const { data, error: err } = await supabase.from('characters').select('*');
      if (err) throw err;
      setCharacterList(data || []);
    } catch (err) {
      console.error('Error loading characters:', err);
    }
  }

  async function loadInsights() {
    try {
      const { data, error: err } = await supabase.from('insights').select('*').order('created_at', { ascending: false });
      if (err) throw err;
      setInsightList(data || []);
    } catch (err) {
      console.error('Error loading insights:', err);
    }
  }

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      setUser(authUser);
    };
    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user || null);
    });

    loadManhwa();
    loadCharacters();
    loadInsights();

    return () => authListener?.subscription?.unsubscribe();
  }, []);

  // Auth handlers
  async function signUp() {
    const email = prompt('Email:');
    const password = prompt('Password:');
    if (!email || !password) return;

    try {
      const { error: err } = await supabase.auth.signUp({ email, password });
      if (err) throw err;
      alert('Sign up successful! Check your email.');
    } catch (err) {
      alert('Error: ' + err.message);
    }
  }

  async function signIn() {
    const email = prompt('Email:');
    const password = prompt('Password:');
    if (!email || !password) return;

    try {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) throw err;
    } catch (err) {
      alert('Error: ' + err.message);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  // Data handlers
  async function handleSaveManhwa(formData, editId) {
    setSaving(true);
    setError('');
    try {
      if (editId) {
        const { error: err } = await supabase.from('manhwa').update(formData).eq('id', editId);
        if (err) throw err;
        setManhwaList(manhwaList.map((m) => m.id === editId ? { ...m, ...formData } : m));
      } else {
        const { data, error: err } = await supabase.from('manhwa').insert([{ ...formData, id: generateId() }]).select();
        if (err) throw err;
        setManhwaList([...manhwaList, ...(data || [])]);
      }
      setShowManhwaForm(false);
      setEditingManhwa(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveCharacter(formData, editId) {
    setSaving(true);
    setError('');
    try {
      if (editId) {
        const { error: err } = await supabase.from('characters').update(formData).eq('id', editId);
        if (err) throw err;
        setCharacterList(characterList.map((c) => c.id === editId ? { ...c, ...formData } : c));
      } else {
        const { data, error: err } = await supabase.from('characters').insert([{ ...formData, id: generateId() }]).select();
        if (err) throw err;
        setCharacterList([...characterList, ...(data || [])]);
      }
      setShowCharacterForm(false);
      setEditingCharacter(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleAddInsight(characterId, payload) {
    setSaving(true);
    try {
      const { data, error: err } = await supabase.from('insights').insert([{
        id: generateId(),
        character_id: characterId,
        ...payload,
      }]).select();
      if (err) throw err;
      setInsightList([...(data || []), ...insightList]);
    } catch (err) {
      console.error('Error adding insight:', err);
    } finally {
      setSaving(false);
    }
  }

  function goRandom() {
    if (characterList.length > 0) {
      const random = characterList[Math.floor(Math.random() * characterList.length)];
      setSelectedCharacterId(random.id);
      setView('character');
    }
  }

  // Helpers
  const getManhwa = (id) => manhwaList.find((m) => m.id === id);
  const getCharacter = (id) => characterList.find((c) => c.id === id);
  const charactersOf = (manhwa_id) => characterList.filter((c) => c.manhwa_id === manhwa_id);
  const insightsOf = (character_id) => insightList.filter((i) => i.character_id === character_id);

  // Render
  const selectedManhwa = getManhwa(selectedManhwaId);
  const selectedCharacter = getCharacter(selectedCharacterId);

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="logo">
          <h2>CODEX</h2>
          <p>OF THE WEBTOON REALMS</p>
        </div>

        <nav className="nav-menu">
          <button className={`nav-item ${view === 'home' ? 'active' : ''}`} onClick={() => setView('home')}>
            <Home size={20} /> HOME
          </button>
          <button className="nav-item">
            <BookOpen size={20} /> SERIES
          </button>
          <button className="nav-item">
            <Users size={20} /> CHARACTERS
          </button>
          <button className="nav-item">
            <Lightbulb size={20} /> INSIGHTS
          </button>
          <button className="nav-item">
            <Clock size={20} /> TIMELINE <span className="badge">soon</span>
          </button>
          <button className="nav-item">
            <Trophy size={20} /> RANKINGS <span className="badge">soon</span>
          </button>
          <button className="nav-item">
            <BookmarkIcon size={20} /> COLLECTIONS <span className="badge">soon</span>
          </button>
          <button className="nav-item">
            <HelpCircle size={20} /> ABOUT CODEX
          </button>
        </nav>

        <div className="sidebar-footer">
          <button className="icon-btn" onClick={goRandom} title="Random Character">
            <Shuffle size={20} />
          </button>
          {user ? (
            <>
              <div className="user-info">
                <small>{user.email}</small>
              </div>
              <button className="icon-btn" onClick={signOut} title="Sign Out">
                <LogOut size={20} />
              </button>
            </>
          ) : (
            <>
              <button className="icon-btn" onClick={signIn} title="Sign In">
                <LogIn size={20} />
              </button>
              <button className="icon-btn" onClick={signUp} title="Sign Up">
                <Plus size={20} />
              </button>
            </>
          )}
        </div>
      </aside>

      <main className="main-content">
        {view === 'home' && (
          <HomeView
            manhwaCount={manhwaList.length}
            characterCount={characterList.length}
            insightCount={insightList.length}
            onViewManhwa={() => setView('series')}
            onAddManhwa={() => setShowManhwaForm(true)}
            onRandomCharacter={goRandom}
          />
        )}

        {view === 'manhwa' && selectedManhwa && (
          <ManhwaDetailView
            manhwa={selectedManhwa}
            characters={charactersOf(selectedManhwaId)}
            onBack={() => setView('home')}
            onOpenCharacter={(id) => {
              setSelectedCharacterId(id);
              setView('character');
            }}
            onEdit={() => setEditingManhwa(selectedManhwa)}
            onAddCharacter={() => setShowCharacterForm(true)}
          />
        )}

        {view === 'character' && selectedCharacter && (
          <CharacterDetailView
            character={selectedCharacter}
            manhwa={getManhwa(selectedCharacter.manhwa_id)}
            insights={insightsOf(selectedCharacterId)}
            saving={saving}
            onBack={() => setView('home')}
            onEdit={() => setEditingCharacter(selectedCharacter)}
            onAddInsight={(payload) => handleAddInsight(selectedCharacterId, payload)}
          />
        )}
      </main>

      {showManhwaForm && (
        <Modal title={editingManhwa ? 'Edit Manhwa' : 'Add New Manhwa'} onClose={() => { setShowManhwaForm(false); setEditingManhwa(null); }}>
          <ManhwaForm
            initial={editingManhwa}
            onSubmit={(data) => handleSaveManhwa(data, editingManhwa?.id)}
            onCancel={() => { setShowManhwaForm(false); setEditingManhwa(null); }}
            saving={saving}
            error={error}
          />
        </Modal>
      )}

      {showCharacterForm && (
        <Modal title={editingCharacter ? 'Edit Character' : 'Add New Character'} onClose={() => { setShowCharacterForm(false); setEditingCharacter(null); }}>
          <CharacterForm
            initial={editingCharacter}
            manhwaList={manhwaList}
            defaultmanhwa_id={selectedManhwaId}
            onSubmit={(data) => handleSaveCharacter(data, editingCharacter?.id)}
            onCancel={() => { setShowCharacterForm(false); setEditingCharacter(null); }}
            saving={saving}
            error={error}
          />
        </Modal>
      )}
    </div>
  );
}