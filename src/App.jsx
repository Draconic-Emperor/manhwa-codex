import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase";
import {
  Search, Plus, X, ChevronLeft, Sparkles, BookOpen, ScrollText,
  Users, Clock, Shield, Dices, Pencil, Loader2, AlertCircle,
  MessageSquarePlus, Swords, Zap, Heart, Star
} from "lucide-react";

/* Logo Import */
const logo = '/manhwa codex-logo.png';

/* ----------------------------------------------------------------------
   DATA LAYER — three shared keys, each holding a JSON array.
   Shared (visible to everyone who opens this artifact) by design: this is
   a community codex, so contributions need to be visible to all visitors.
---------------------------------------------------------------------- */

async function loadManhwa() {
  const { data, error } = await supabase
    .from("manhwa")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return [];
  }

  return data;
}

async function loadCharacters() {
  const { data, error } = await supabase
    .from("characters")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return [];
  }

  return data;
}

async function loadInsights() {
  const { data, error } = await supabase
    .from("insights")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return [];
  }

  return data;
}

async function testSupabase() {
  console.log(import.meta.env.VITE_SUPABASE_URL)
  const { data, error } = await supabase
    .from("manhwa")
    .select("*");

  console.log("SUPABASE DATA:", data);
  console.log("SUPABASE ERROR:", error);
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function formatDate(ts) {
  if (!ts) return "unknown date";
  return new Date(ts).toLocaleDateString(undefined, {
    year: "numeric", month: "short", day: "numeric",
  });
}

function csvToArray(str) {
  return (str || "").split(",").map((s) => s.trim()).filter(Boolean);
}

function linesToArray(str) {
  return (str || "").split("\n").map((s) => s.trim()).filter(Boolean);
}

/* ----------------------------------------------------------------------
   STATIC VOCABULARY
---------------------------------------------------------------------- */

const RANKS = [
  { id: "SS", label: "SS — Unparalled", color: "#07024d" },
  { id: "S", label: "S — Apex", color: "#F2C14E" },
  { id: "A", label: "A — Severe", color: "#E1574C" },
  { id: "B", label: "B — High", color: "#9C7BFF" },
  { id: "C", label: "C — Moderate", color: "#5EEAD4" },
  { id: "D", label: "D — Low", color: "#8C97B5" },
  { id: "E", label: "E — Unranked", color: "#5C6680" },
];
const rankInfo = (id) => RANKS.find((r) => r.id === id) || RANKS[5];

const ROLES = ["Protagonist", "Antagonist", "Supporting", "Mentor", "Rival", "Anti-Hero"];
const STATUSES = ["Ongoing", "Completed", "Hiatus"];

const INSIGHT_TYPES = [
  { id: "theory", label: "Theory", color: "#9C7BFF" },
  { id: "lore", label: "Lore Fact", color: "#5EEAD4" },
  { id: "analysis", label: "Analysis", color: "#F2C14E" },
  { id: "question", label: "Open Question", color: "#8C97B5" },
];
const insightTypeInfo = (id) => INSIGHT_TYPES.find((t) => t.id === id) || INSIGHT_TYPES[0];

/* ----------------------------------------------------------------------
   PRIMITIVES
---------------------------------------------------------------------- */

function RankBadge({ rank, size = "md" }) {
  const info = rankInfo(rank);
  const dims = size === "sm" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm";
  return (
    <span
      className={`codex-mono inline-flex items-center justify-center ${dims} rounded-lg font-bold transition-all hover:scale-110`}
      style={{
        color: info.color,
        border: `2px solid ${info.color}`,
        background: `${info.color}20`,
        textShadow: `0 0 12px ${info.color}aa`,
        boxShadow: `0 0 12px ${info.color}44`,
      }}
      title={info.label}
    >
      {rank || "E"}
    </span>
  );
}

function StatusPill({ status }) {
  const map = { Ongoing: "#5EEAD4", Completed: "#8C97B5", Hiatus: "#F2C14E" };
  const color = map[status] || "#8C97B5";
  return (
    <span
      className="codex-mono text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-lg font-semibold transition-all hover:scale-105"
      style={{ color, border: `1.5px solid ${color}`, background: `${color}18` }}
    >
      {status || "Unknown"}
    </span>
  );
}

function InsightTypeTag({ type }) {
  const info = insightTypeInfo(type);
  return (
    <span
      className="codex-mono text-[10px] uppercase tracking-widest px-3 py-1 rounded-lg font-semibold transition-all hover:scale-105"
      style={{ color: info.color, border: `1px solid ${info.color}66`, background: `${info.color}18` }}
    >
      {info.label}
    </span>
  );
}

function GenrePill({ children }) {
  return (
    <span className="codex-mono text-[10px] uppercase tracking-wide px-3 py-1.5 rounded-lg font-medium transition-all hover:bg-purple-500/10"
      style={{ color: "var(--text-muted)", border: "1px solid rgba(140,151,181,0.4)", background: "rgba(140,151,181,0.05)" }}>
      {children}
    </span>
  );
}

function IconBtn({ children, onClick, title, active }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="codex-iconbtn flex items-center justify-center w-10 h-10 rounded-lg transition-all hover:scale-110 active:scale-95"
      style={active ? { color: "var(--purple)", borderColor: "rgba(94,234,212,0.7)" } : undefined}
    >
      {children}
    </button>
  );
}

function EmptyState({ icon, title, subtitle, action }) {
  return (
    <div className="codex-frame flex flex-col items-center text-center gap-4 py-16 px-6 rounded-xl">
      <div style={{ color: "var(--text-muted)" }} className="opacity-80">{icon}</div>
      <p className="codex-display text-lg" style={{ color: "var(--text-primary)" }}>{title}</p>
      <p className="text-sm max-w-sm" style={{ color: "var(--text-muted)" }}>{subtitle}</p>
      {action}
    </div>
  );
}

function Field({ label, children, hint }) {
  return (
    <label className="block mb-4">
      <span className="codex-mono text-[11px] uppercase tracking-widest block mb-2 font-semibold" style={{ color: "var(--text-muted)" }}>
        {label}
      </span>
      {children}
      {hint && <span className="block text-xs mt-2" style={{ color: "var(--text-muted)" }}>{hint}</span>}
    </label>
  );
}

function inputClass() {
  return "codex-input w-full rounded-lg px-4 py-3 text-sm font-medium transition-all focus:ring-2";
}

function Modal({ title, onClose, children, wide }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 overflow-y-auto backdrop-blur-md"
      style={{ background: "rgba(4,6,11,0.88)" }}
      onClick={onClose}
    >
      <div
        className={`codex-frame w-full ${wide ? "max-w-2xl" : "max-w-lg"} my-6 rounded-2xl shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: "1px solid rgba(94,234,212,0.16)" }}>
          <h3 className="codex-mono text-xs uppercase tracking-widest font-bold" style={{ color: "var(--purple)" }}>{title}</h3>
          <button onClick={onClose} className="codex-iconbtn w-9 h-9 flex items-center justify-center rounded-lg hover:scale-110 transition-transform">
            <X size={16} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------
   CARDS
---------------------------------------------------------------------- */

function ManhwaCard({ manhwa, characterCount, onClick }) {
  return (
    <button onClick={onClick} className="codex-frame codex-card text-left rounded-xl p-5 flex flex-col gap-3 h-full shadow-lg hover:shadow-2xl transition-all">
      <div className="flex items-start justify-between gap-2">
        <h3 className="codex-display text-lg leading-tight" style={{ color: "var(--text-primary)" }}>{manhwa.title}</h3>
        <StatusPill status={manhwa.status} />
      </div>
      {manhwa.author && (
        <p className="codex-mono text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>by {manhwa.author}</p>
      )}
      <p className="codex-serif text-sm leading-relaxed line-clamp-3" style={{ color: "var(--text-muted)" }}>
        {manhwa.synopsis}
      </p>
      <div className="flex items-center justify-between mt-auto pt-3 border-t border-purple-500/10">
        <div className="flex gap-2 flex-wrap">
          {(manhwa.genres || []).slice(0, 3).map((g) => <GenrePill key={g}>{g}</GenrePill>)}
        </div>
        <span className="codex-mono text-[11px] flex items-center gap-1.5 shrink-0 ml-2 font-semibold" style={{ color: "var(--text-muted)" }}>
          <Users size={13} /> {characterCount}
        </span>
      </div>
    </button>
  );
}

function CharacterCard({ character, manhwaTitle, onClick }) {
  return (
    <button onClick={onClick} className="codex-frame codex-card text-left rounded-xl p-5 flex flex-col gap-2.5 h-full shadow-lg hover:shadow-2xl transition-all">
      <div className="flex items-start justify-between gap-2">
        <h3 className="codex-display text-base leading-tight" style={{ color: "var(--text-primary)" }}>{character.name}</h3>
        <RankBadge rank={character.rank} size="sm" />
      </div>
      {manhwaTitle && (
        <p className="codex-mono text-[10px] uppercase tracking-wide font-semibold" style={{ color: "var(--text-muted)" }}>{manhwaTitle}</p>
      )}
      <p className="codex-mono text-[11px] font-semibold" style={{ color: "var(--purple)" }}>{character.role}</p>
      <p className="codex-serif text-sm leading-relaxed line-clamp-2" style={{ color: "var(--text-muted)" }}>
        {character.description}
      </p>
    </button>
  );
}

/* ----------------------------------------------------------------------
   FORMS
---------------------------------------------------------------------- */

function ManhwaForm({ initial, onSubmit, onCancel, saving, error }) {
  const [title, setTitle] = useState(initial?.title || "");
  const [author, setAuthor] = useState(initial?.author || "");
  const [status, setStatus] = useState(initial?.status || "Ongoing");
  const [genres, setGenres] = useState((initial?.genres || []).join(", "));
  const [synopsis, setSynopsis] = useState(initial?.synopsis || "");

  const submit = (e) => {
    e.preventDefault();
    if (!title.trim() || !synopsis.trim()) return;
    onSubmit({ title: title.trim(), author: author.trim(), status, genres: csvToArray(genres), synopsis: synopsis.trim() });
  };

  return (
    <form onSubmit={submit}>
      <Field label="Series title">
        <input className={inputClass()} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Shadow of the Ashen Throne" required />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Author">
          <input className={inputClass()} value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="optional" />
        </Field>
        <Field label="Status">
          <select className={inputClass()} value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Genres" hint="comma separated, e.g. Regression, Tower, Romance">
        <input className={inputClass()} value={genres} onChange={(e) => setGenres(e.target.value)} placeholder="Fantasy, Action, Regression" />
      </Field>
      <Field label="Synopsis">
        <textarea className={inputClass()} rows={4} value={synopsis} onChange={(e) => setSynopsis(e.target.value)} placeholder="What is this series about?" required />
      </Field>
      {error && <p className="codex-mono text-xs mb-3 font-semibold" style={{ color: "#E1574C" }}>{error}</p>}
      <div className="flex justify-end gap-3 mt-3">
        <button type="button" onClick={onCancel} className="codex-btn-ghost px-5 py-2.5 rounded-lg text-sm font-semibold">Cancel</button>
        <button type="submit" disabled={saving} className="codex-btn-primary px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2">
          {saving && <Loader2 size={15} className="animate-spin" />} {initial ? "Save changes" : "Add series"}
        </button>
      </div>
    </form>
  );
}

function CharacterForm({ initial, manhwaList, defaultmanhwa_id, onSubmit, onCancel, saving, error }) {
  const [name, setName] = useState(initial?.name || "");
  const [aliases, setAliases] = useState((initial?.aliases || []).join(", "));
  const [manhwa_id, setmanhwa_id] = useState(initial?.manhwa_id || defaultmanhwa_id || (manhwaList[0]?.id || ""));
  const [role, setRole] = useState(initial?.role || ROLES[0]);
  const [rank, setRank] = useState(initial?.rank || "E");
  const [description, setDescription] = useState(initial?.description || "");
  const [abilities, setAbilities] = useState((initial?.abilities || []).join("\n"));

  const submit = (e) => {
    e.preventDefault();
    if (!name.trim() || !description.trim() || !manhwa_id) return;
    onSubmit({
      name: name.trim(), aliases: csvToArray(aliases), manhwa_id, role, rank,
      description: description.trim(), abilities: linesToArray(abilities),
    });
  };

  return (
    <form onSubmit={submit}>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Name">
          <input className={inputClass()} value={name} onChange={(e) => setName(e.target.value)} placeholder="Character name" required />
        </Field>
        <Field label="Series">
          <select className={inputClass()} value={manhwa_id} onChange={(e) => setmanhwa_id(e.target.value)} required>
            <option value="" disabled>Choose a series</option>
            {manhwaList.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Aliases / titles" hint="comma separated, e.g. The Ashen King, Shadow Monarch">
        <input className={inputClass()} value={aliases} onChange={(e) => setAliases(e.target.value)} />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Role">
          <select className={inputClass()} value={role} onChange={(e) => setRole(e.target.value)}>
            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </Field>
        <Field label="Threat rank">
          <select className={inputClass()} value={rank} onChange={(e) => setRank(e.target.value)}>
            {RANKS.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Description">
        <textarea className={inputClass()} rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Who are they? Background, personality, arc..." required />
      </Field>
      <Field label="Abilities / powers" hint="one per line">
        <textarea className={inputClass()} rows={3} value={abilities} onChange={(e) => setAbilities(e.target.value)} placeholder={"Shadow extraction\nArmy of the dead"} />
      </Field>
      {error && <p className="codex-mono text-xs mb-3 font-semibold" style={{ color: "#E1574C" }}>{error}</p>}
      <div className="flex justify-end gap-3 mt-3">
        <button type="button" onClick={onCancel} className="codex-btn-ghost px-5 py-2.5 rounded-lg text-sm font-semibold">Cancel</button>
        <button type="submit" disabled={saving} className="codex-btn-primary px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2">
          {saving && <Loader2 size={15} className="animate-spin" />} {initial ? "Save changes" : "Add character"}
        </button>
      </div>
    </form>
  );
}

function InsightForm({ onSubmit, saving }) {
  const [text, setText] = useState("");
  const [author, setAuthor] = useState("");
  const [type, setType] = useState("theory");

  const submit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSubmit({ text: text.trim(), author: author.trim() || "Anonymous Scholar", type });
    setText("");
  };

  return (
    <form onSubmit={submit} className="codex-frame rounded-xl p-5">
      <div className="grid grid-cols-2 gap-4 mb-4">
        <Field label="Signed as" hint="not saved between visits">
          <input className={inputClass()} value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Anonymous Scholar" />
        </Field>
        <Field label="Type">
          <select className={inputClass()} value={type} onChange={(e) => setType(e.target.value)}>
            {INSIGHT_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </Field>
      </div>
      <textarea
        className={inputClass()} rows={3} value={text} onChange={(e) => setText(e.target.value)}
        placeholder="Share a theory, a piece of lore, an analysis of their arc, a question for other readers..."
        required
      />
      <div className="flex justify-end mt-4">
        <button type="submit" disabled={saving} className="codex-btn-primary px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2">
          {saving ? <Loader2 size={15} className="animate-spin" /> : <MessageSquarePlus size={15} />} Log finding
        </button>
      </div>
    </form>
  );
}

/* ----------------------------------------------------------------------
   MAIN APP
---------------------------------------------------------------------- */

export default function ManhwaCodex() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [manhwaList, setManhwaList] = useState([]);
  const [characterList, setCharacterList] = useState([]);
  const [insightsList, setInsightsList] = useState([]);

  const [view, setView] = useState({ name: "home" });
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState("");

  const loadAll = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [manhwa, characters, insights] = await Promise.all([
        loadManhwa(),
        loadCharacters(),
        loadInsights(),
      ]);

      console.log("MANHWA:", manhwa);
      console.log("CHARACTERS:", characters);
      console.log("INSIGHTS:", insights);

      setManhwaList(manhwa);
      setCharacterList(characters);
      setInsightsList(insights);
    } catch (e) {
      setLoadError("The codex failed to open. Try reloading the page.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
    testSupabase();
  }, [loadAll]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const getManhwa = (id) => manhwaList.find((m) => m.id === id);
  const getCharacter = (id) => characterList.find((c) => c.id === id);
  const charactersOf = (manhwa_id) => characterList.filter((c) => c.manhwa_id === manhwa_id);
  const insightsOf = (character_id) =>
    insightsList
      .filter((i) => i.character_id === character_id)
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime()
      );

  async function signUp() {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      return;
    }

    alert("Account created. Check your email.");
  }

  async function signIn() {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  async function handleSaveManhwa(formData, editId) {
    setSaving(true);
    setActionError("");

    try {
      if (editId) {
        const { data, error } = await supabase
          .from("manhwa")
          .update(formData)
          .eq("id", editId)
          .select();

        if (error) throw error;

        setManhwaList(prev =>
          prev.map(m => m.id === editId ? data[0] : m)
        );
      } else {
        const { data, error } = await supabase
          .from("manhwa")
          .insert([formData])
          .select();

        if (error) throw error;

        setManhwaList(prev => [...data, ...prev]);
      }

      setModal(null);
    } catch (e) {
      console.error(e);
      setActionError("Could not save the series.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveCharacter(formData, editId) {
    setSaving(true);
    setActionError("");

    try {
      if (editId) {
        const { data, error } = await supabase
          .from("characters")
          .update(formData)
          .eq("id", editId)
          .select();

        if (error) throw error;

        setCharacterList((prev) =>
          prev.map((c) => (c.id === editId ? data[0] : c))
        );
      } else {
        const { data, error } = await supabase
          .from("characters")
          .insert([formData])
          .select();

        if (error) throw error;

        setCharacterList((prev) => [...data, ...prev]);
      }

      setModal(null);
    } catch (e) {
      console.error(e);
      setActionError("Could not save the character.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddInsight(characterId, payload) {
    setSaving(true);
    setActionError("");

    try {
      const { data, error } = await supabase
        .from("insights")
        .insert([
          {
            character_id: characterId,
            ...payload,
          },
        ])
        .select();

      if (error) throw error;

      setInsightsList((prev) => [...data, ...prev]);
    } catch (e) {
      console.error(e);
      setActionError("Could not log the finding.");
    } finally {
      setSaving(false);
    }
  }

  function goRandom() {
    if (characterList.length === 0) return;
    const pick = characterList[Math.floor(Math.random() * characterList.length)];
    setView({ name: "character", id: pick.id });
  }

  const q = search.trim().toLowerCase();
  const filteredManhwa = manhwaList.filter((m) => {
    if (!q) return true;
    return (
      m.title.toLowerCase().includes(q) ||
      (m.author || "").toLowerCase().includes(q) ||
      (m.genres || []).some((g) => g.toLowerCase().includes(q))
    );
  });
  const matchingCharacters = q
    ? characterList.filter((c) =>
        c.name.toLowerCase().includes(q) || (c.aliases || []).some((a) => a.toLowerCase().includes(q))
      )
    : [];

  const recentInsights = [...insightsList]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime()
    )
    .slice(0, 5);

  /* ---------------- render ---------------- */

  return (
    <div className="codex-root min-h-full w-full" style={{ background: "var(--bg-void)", color: "var(--text-primary)" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@600;700;900&family=Source+Serif+4:opsz,wght@8..60,400;8..60,600&family=JetBrains+Mono:wght@400;500;700&display=swap');

        .codex-root {
          --bg-void: #070712;
          --bg-panel: #0f1020;

          --purple: #a855f7;
          --purple-glow: #c084fc;

          --text-primary: #ffffff;
          --text-muted: #9ca3af;
          font-family: 'Source Serif 4', serif;
        }
        .codex-display { font-family: 'Orbitron', sans-serif; letter-spacing: 0.02em; font-weight: 700; }
        .codex-mono { font-family: 'JetBrains Mono', monospace; }
        .codex-serif { font-family: 'Source Serif 4', serif; }

        .codex-frame {
          position: relative;
          background: linear-gradient(135deg, rgba(168,85,247,0.08), rgba(59,130,246,0.05));
          border: 1.5px solid rgba(168,85,247,0.35);
          box-shadow: 0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1);
        }
        .codex-frame::before, .codex-frame::after {
          content: ''; position: absolute; width: 14px; height: 14px;
          border: 2.5px solid var(--purple); opacity: 0.6; pointer-events: none;
        }
        .codex-frame::before { top: -2px; left: -2px; border-right: none; border-bottom: none; }
        .codex-frame::after { bottom: -2px; right: -2px; border-left: none; border-top: none; }

        .codex-card {
          transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), 
                      border-color 0.25s ease,
                      box-shadow 0.25s ease,
                      background 0.25s ease;
          cursor: pointer;
          position: relative;
          overflow: hidden;
        }
        .codex-card::after {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
          transition: left 0.5s ease;
        }
        .codex-card:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow:
            0 0 20px rgba(168,85,247,.6),
            0 0 40px rgba(168,85,247,.3),
            0 15px 35px rgba(0,0,0,0.4);
          border-color: rgba(168,85,247,0.8);
          background: linear-gradient(135deg, rgba(168,85,247,0.12), rgba(59,130,246,0.08));
        }
        .codex-card:hover::after {
          left: 100%;
        }

        .codex-input {
          background: rgba(255,255,255,0.05);
          border: 1.5px solid rgba(140,151,181,0.35);
          color: var(--text-primary);
          font-family: 'Source Serif 4', serif;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);
        }
        .codex-input:focus {
          outline: none;
          border-color: var(--purple);
          box-shadow: 0 0 0 3px rgba(168,85,247,0.2), inset 0 2px 4px rgba(0,0,0,0.2);
          background: rgba(255,255,255,0.08);
        }
        .codex-input::placeholder { color: rgba(140,151,181,0.5); }

        .codex-btn-primary {
          background: linear-gradient(135deg, rgba(168,85,247,0.2), rgba(168,85,247,0.1));
          border: 1.5px solid var(--purple);
          color: #ffffff;
          font-family: 'JetBrains Mono', monospace;
          transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
          box-shadow: 0 4px 15px rgba(168,85,247,0.2);
        }
        .codex-btn-primary:hover {
          background: linear-gradient(135deg, rgba(168,85,247,0.35), rgba(168,85,247,0.25));
          box-shadow: 0 6px 25px rgba(168,85,247,0.4);
          transform: translateY(-2px);
        }
        .codex-btn-primary:active {
          transform: translateY(0);
        }
        .codex-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

        .codex-btn-ghost {
          background: rgba(255,255,255,0.04);
          border: 1.5px solid rgba(140,151,181,0.3);
          color: var(--text-muted);
          font-family: 'JetBrains Mono', monospace;
          transition: all 0.25s ease;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .codex-btn-ghost:hover {
          border-color: var(--purple);
          color: var(--text-primary);
          background: rgba(168,85,247,0.1);
          box-shadow: 0 4px 12px rgba(168,85,247,0.15);
          transform: translateY(-1px);
        }

        .codex-iconbtn {
          border: 1.5px solid rgba(140,151,181,0.25);
          color: var(--text-muted);
          background: rgba(255,255,255,0.02);
          transition: all 0.25s ease;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .codex-iconbtn:hover {
          border-color: var(--purple);
          color: var(--purple);
          background: rgba(168,85,247,0.1);
          box-shadow: 0 4px 15px rgba(168,85,247,0.25);
        }

        .codex-hero {
          background-image: repeating-linear-gradient(0deg, rgba(168,85,247,0.03) 0px, rgba(168,85,247,0.03) 1px, transparent 1px, transparent 3px);
          position: relative;
          overflow: hidden;
        }
        .codex-hero::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(168,85,247,0.1), transparent);
          animation: heroGlow 8s ease-in-out infinite;
        }
        
        @keyframes heroGlow { 
          0%, 100% { transform: translate(0, 0); opacity: 0.5; } 
          50% { transform: translate(20px, 20px); opacity: 0.8; }
        }
        @keyframes codexPulse { 
          0%,100% { box-shadow: 0 0 0px rgba(168,85,247,0); } 
          50% { box-shadow: 0 0 30px rgba(168,85,247,0.25); } 
        }
        @media (prefers-reduced-motion: no-preference) { 
          .codex-pulse { animation: codexPulse 4s ease-in-out infinite; } 
        }

        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .line-clamp-3 { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
      `}</style>

      {/* HEADER */}
      <header className="sticky top-0 z-40 backdrop-blur-lg" style={{ background: "rgba(10,13,22,0.95)", borderBottom: "1.5px solid rgba(168,85,247,0.2)", boxShadow: "0 8px 32px rgba(0,0,0,0.3)" }}>
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-wrap items-center gap-4">
          <button onClick={() => setView({ name: "home" })} className="flex items-center gap-2 mr-2 hover:opacity-80 transition-opacity group">
            <img
              src={logo}
              alt="Manhwa Codex"
              className="w-11 h-11 object-contain group-hover:scale-110 transition-transform"
            />
            <div className="flex flex-col">
              <span className="codex-display text-lg font-bold tracking-wide">
                CODEX
              </span>
              <span
                className="codex-mono text-[10px] font-semibold"
                style={{ color: "var(--text-muted)" }}
              >
                MANHWA CODEX
              </span>
            </div>
            <span className="codex-mono text-[10px] hidden sm:inline font-semibold" style={{ color: "var(--text-muted)" }}>OF THE WEBTOON REALMS</span>
          </button>

          <div className="relative flex-1 min-w-[160px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search series, characters, aliases..."
              className="codex-input w-full rounded-lg pl-9 pr-4 py-2.5 text-sm font-medium"
            />
          </div>

          <IconBtn title="Random character" onClick={goRandom}><Dices size={16} /></IconBtn>
          {user ? (
            <>
              <span
                className="codex-mono text-[10px] font-semibold px-3 py-1.5 rounded-lg" style={{ color: "var(--purple)", background: "rgba(168,85,247,0.1)" }}
              >
                {user.email}
              </span>
              <button
                onClick={signOut}
                className="codex-btn-ghost px-4 py-2 rounded-lg text-xs font-semibold"
              >
                Logout
              </button>
            </>
          ) : (
            <button
              onClick={() => setModal({ type: "auth" })}
              className="codex-btn-primary px-4 py-2 rounded-lg text-xs font-semibold"
            >
              Login
            </button>
          )}
          <button onClick={() => { setActionError(""); setModal({ type: "addManhwa" }); }} className="codex-btn-primary px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 whitespace-nowrap">
            <Plus size={14} /> Series
          </button>
          <button
            onClick={() => { setActionError(""); setModal({ type: "addCharacter" }); }}
            disabled={manhwaList.length === 0}
            className="codex-btn-ghost px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 whitespace-nowrap disabled:opacity-40"
          >
            <Plus size={14} /> Character
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10">
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4" style={{ color: "var(--text-muted)" }}>
            <Loader2 size={24} className="animate-spin" />
            <span className="codex-mono text-xs uppercase tracking-widest font-semibold">Opening the codex...</span>
          </div>
        )}

        {!loading && loadError && (
          <div className="codex-frame rounded-xl p-6 flex items-center gap-3" style={{ color: "#E1574C" }}>
            <AlertCircle size={20} /> <span className="codex-mono text-sm font-semibold">{loadError}</span>
          </div>
        )}

        {!loading && !loadError && view.name === "home" && (
          <HomeView
            manhwaList={filteredManhwa}
            charactersOf={charactersOf}
            characterCount={characterList.length}
            insightCount={insightsList.length}
            recentInsights={recentInsights}
            getManhwa={getManhwa}
            getCharacter={getCharacter}
            searchActive={!!q}
            matchingCharacters={matchingCharacters}
            onOpenManhwa={(id) => setView({ name: "manhwa", id })}
            onOpenCharacter={(id) => setView({ name: "character", id })}
            onAddManhwa={() => { setActionError(""); setModal({ type: "addManhwa" }); }}
          />
        )}

        {!loading && !loadError && view.name === "manhwa" && getManhwa(view.id) && (
          <ManhwaDetailView
            manhwa={getManhwa(view.id)}
            characters={charactersOf(view.id)}
            onBack={() => setView({ name: "home" })}
            onOpenCharacter={(id) => setView({ name: "character", id })}
            onEdit={() => { setActionError(""); setModal({ type: "editManhwa", data: getManhwa(view.id) }); }}
            onAddCharacter={() => { setActionError(""); setModal({ type: "addCharacter", manhwa_id: view.id }); }}
          />
        )}

        {!loading && !loadError && view.name === "character" && getCharacter(view.id) && (
          <CharacterDetailView
            character={getCharacter(view.id)}
            manhwa={getManhwa(getCharacter(view.id).manhwa_id)}
            insights={insightsOf(view.id)}
            saving={saving}
            onBack={(manhwa_id) => setView(manhwa_id ? { name: "manhwa", id: manhwa_id } : { name: "home" })}
            onEdit={() => { setActionError(""); setModal({ type: "editCharacter", data: getCharacter(view.id) }); }}
            onAddInsight={(payload) => handleAddInsight(view.id, payload)}
          />
        )}

        {!loading && !loadError && ((view.name === "manhwa" && !getManhwa(view.id)) || (view.name === "character" && !getCharacter(view.id))) && (
          <EmptyState
            icon={<AlertCircle size={32} />}
            title="This entry isn't in the codex"
            subtitle="It may have been renamed or removed."
            action={<button onClick={() => setView({ name: "home" })} className="codex-btn-ghost px-5 py-2.5 rounded-lg text-sm font-semibold mt-2">Back to the archive</button>}
          />
        )}
      </main>

      <footer className="max-w-6xl mx-auto px-4 pb-12 pt-6">
        <p className="codex-mono text-[11px] text-center font-semibold" style={{ color: "var(--text-muted)" }}>
          A shared codex — every series, character, and finding here is visible to anyone who opens this page.
        </p>
        <p className="codex-mono text-[11px] text-center mt-2" style={{ color: "var(--text-muted)" }}>
          © 2026 Manhwa Codex · Built with passion
        </p>
      </footer>

      {modal?.type === "addManhwa" && (
        <Modal title="// LOG A NEW SERIES" onClose={() => setModal(null)}>
          <ManhwaForm saving={saving} error={actionError} onCancel={() => setModal(null)} onSubmit={(data) => handleSaveManhwa(data, null)} />
        </Modal>
      )}
      {modal?.type === "editManhwa" && (
        <Modal title="// EDIT SERIES ENTRY" onClose={() => setModal(null)}>
          <ManhwaForm initial={modal.data} saving={saving} error={actionError} onCancel={() => setModal(null)} onSubmit={(data) => handleSaveManhwa(data, modal.data.id)} />
        </Modal>
      )}
      {modal?.type === "addCharacter" && (
        <Modal title="// LOG A NEW CHARACTER" onClose={() => setModal(null)} wide>
          <CharacterForm manhwaList={manhwaList} defaultmanhwa_id={modal.manhwa_id} saving={saving} error={actionError} onCancel={() => setModal(null)} onSubmit={(data) => handleSaveCharacter(data, null)} />
        </Modal>
      )}
      {modal?.type === "editCharacter" && (
        <Modal title="// EDIT CHARACTER ENTRY" onClose={() => setModal(null)} wide>
          <CharacterForm initial={modal.data} manhwaList={manhwaList} saving={saving} error={actionError} onCancel={() => setModal(null)} onSubmit={(data) => handleSaveCharacter(data, modal.data.id)} />
        </Modal>
      )}
      {modal?.type === "auth" && (
        <Modal
          title="// SCHOLAR IDENTIFICATION"
          onClose={() => setModal(null)}
        >
          <div className="flex flex-col gap-5">
            <Field label="Email">
              <input
                className={inputClass()}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
            <Field label="Password">
              <input
                className={inputClass()}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>
            <div className="flex gap-3 justify-end">
              <button
                onClick={signUp}
                className="codex-btn-ghost px-5 py-2.5 rounded-lg font-semibold"
              >
                Sign Up
              </button>
              <button
                onClick={signIn}
                className="codex-btn-primary px-5 py-2.5 rounded-lg font-semibold"
              >
                Login
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ----------------------------------------------------------------------
   HOME VIEW
---------------------------------------------------------------------- */

function HomeView({
  manhwaList, charactersOf, characterCount, insightCount, recentInsights,
  getManhwa, getCharacter, searchActive, matchingCharacters,
  onOpenManhwa, onOpenCharacter, onAddManhwa,
}) {
  return (
    <div className="flex flex-col gap-12">
      <section className="codex-frame codex-hero codex-pulse rounded-2xl p-8 sm:p-10">
        <p className="codex-mono text-[11px] uppercase tracking-widest mb-3 font-bold" style={{ color: "var(--purple)" }}>// STATUS WINDOW</p>
        <h1 className="codex-display text-3xl sm:text-4xl font-bold mb-4"> MANHWA CODEX </h1>
        <p className="codex-serif text-base sm:text-lg max-w-3xl mb-8" style={{ color: "var(--text-muted)", lineHeight: "1.7" }}>
          A living archive of manhwa series and the characters in them. Discover, track and explore
          the greatest manhwa ever created.
        </p>
        <div className="flex flex-wrap gap-6">
          <StatBlock label="Series logged" value={manhwaList.length} icon={<BookOpen size={20} />} />
          <StatBlock label="Characters logged" value={characterCount} icon={<Users size={20} />} />
          <StatBlock label="Findings recorded" value={insightCount} icon={<Sparkles size={20} />} />
        </div>
      </section>

      {searchActive && matchingCharacters.length > 0 && (
        <section>
          <SectionHeader icon={<Users size={15} />} title="Matching characters" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {matchingCharacters.map((c) => (
              <CharacterCard key={c.id} character={c} manhwaTitle={getManhwa(c.manhwa_id)?.title} onClick={() => onOpenCharacter(c.id)} />
            ))}
          </div>
        </section>
      )}

      <section>
        <SectionHeader icon={<BookOpen size={15} />} title="Series archive" />
        {manhwaList.length === 0 ? (
          <EmptyState
            icon={<ScrollText size={32} />}
            title={searchActive ? "No series match that search" : "No series logged yet"}
            subtitle={searchActive ? "Try a different title, author, or genre." : "Be the first to add one to the codex."}
            action={!searchActive && <button onClick={onAddManhwa} className="codex-btn-primary px-5 py-2.5 rounded-lg text-sm font-semibold mt-2">+ Add the first series</button>}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {manhwaList.map((m) => (
              <ManhwaCard key={m.id} manhwa={m} characterCount={charactersOf(m.id).length} onClick={() => onOpenManhwa(m.id)} />
            ))}
          </div>
        )}
      </section>

      {recentInsights.length > 0 && (
        <section>
          <SectionHeader icon={<Clock size={15} />} title="Recent findings" />
          <div className="codex-frame rounded-xl divide-y" style={{ borderColor: "rgba(94,234,212,0.1)" }}>
            {recentInsights.map((ins) => {
              const ch = getCharacter(ins.character_id);
              if (!ch) return null;
              return (
                <button
                  key={ins.id}
                  onClick={() => onOpenCharacter(ch.id)}
                  className="w-full text-left p-5 flex flex-col gap-2 hover:bg-white/[0.04] transition-colors"
                  style={{ borderColor: "rgba(94,234,212,0.1)" }}
                >
                  <div className="flex items-center gap-3 flex-wrap">
                    <InsightTypeTag type={ins.type} />
                    <span className="codex-mono text-[11px] font-semibold" style={{ color: "var(--text-muted)" }}>
                      on <span style={{ color: "var(--text-primary)" }}>{ch.name}</span> · {ins.author} · {formatDate(ins.created_at)}
                    </span>
                  </div>
                  <p className="codex-serif text-sm line-clamp-2" style={{ color: "var(--text-muted)" }}>{ins.text}</p>
                </button>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

function StatBlock({ label, value, icon }) {
  return (
    <div className="codex-frame rounded-xl p-5 flex items-center gap-4 min-w-max">
      <div style={{ color: "var(--purple)" }} className="opacity-80">{icon}</div>
      <div>
        <p className="codex-display text-2xl font-bold" style={{ color: "var(--purple)" }}>{value}</p>
        <p className="codex-mono text-[10px] uppercase tracking-widest font-semibold" style={{ color: "var(--text-muted)" }}>{label}</p>
      </div>
    </div>
  );
}

function SectionHeader({ icon, title, action }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-3" style={{ color: "var(--purple)" }}>
        {icon}
        <h2 className="codex-mono text-xs uppercase tracking-widest font-bold">{title}</h2>
      </div>
      {action}
    </div>
  );
}

/* ----------------------------------------------------------------------
   MANHWA DETAIL
---------------------------------------------------------------------- */

function ManhwaDetailView({ manhwa, characters, onBack, onOpenCharacter, onEdit, onAddCharacter }) {
  return (
    <div className="flex flex-col gap-10">
      <button onClick={onBack} className="codex-mono text-xs font-semibold flex items-center gap-2 self-start hover:gap-3 transition-all" style={{ color: "var(--text-muted)" }}>
        <ChevronLeft size={15} /> Back to archive
      </button>

      <section className="codex-frame rounded-2xl p-7">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
          <h1 className="codex-display text-3xl font-bold">{manhwa.title}</h1>
          <div className="flex items-center gap-3">
            <StatusPill status={manhwa.status} />
            <IconBtn title="Edit series" onClick={onEdit}><Pencil size={15} /></IconBtn>
          </div>
        </div>
        {manhwa.author && <p className="codex-mono text-xs font-semibold mb-4" style={{ color: "var(--text-muted)" }}>by {manhwa.author}</p>}
        <div className="flex gap-2 flex-wrap mb-5">
          {(manhwa.genres || []).map((g) => <GenrePill key={g}>{g}</GenrePill>)}
        </div>
        <p className="codex-serif text-base leading-relaxed" style={{ color: "var(--text-muted)" }}>{manhwa.synopsis}</p>
      </section>

      <section>
        <SectionHeader
          icon={<Swords size={15} />}
          title={`Characters (${characters.length})`}
          action={<button onClick={onAddCharacter} className="codex-btn-primary px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2"><Plus size={13} /> Add character</button>}
        />
        {characters.length === 0 ? (
          <EmptyState
            icon={<Users size={32} />}
            title="No characters logged for this series yet"
            subtitle="Add the protagonist, a rival, anyone worth tracking."
            action={<button onClick={onAddCharacter} className="codex-btn-primary px-5 py-2.5 rounded-lg text-sm font-semibold mt-2">+ Add the first character</button>}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {characters.map((c) => (
              <CharacterCard key={c.id} character={c} onClick={() => onOpenCharacter(c.id)} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

/* ----------------------------------------------------------------------
   CHARACTER DETAIL
---------------------------------------------------------------------- */

function CharacterDetailView({ character, manhwa, insights, saving, onBack, onEdit, onAddInsight }) {
  return (
    <div className="flex flex-col gap-10">
      <button onClick={() => onBack(manhwa?.id)} className="codex-mono text-xs font-semibold flex items-center gap-2 self-start hover:gap-3 transition-all" style={{ color: "var(--text-muted)" }}>
        <ChevronLeft size={15} /> {manhwa ? `Back to ${manhwa.title}` : "Back to archive"}
      </button>

      <section className="codex-frame rounded-2xl p-7">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
          <div className="flex items-center gap-4">
            <RankBadge rank={character.rank} />
            <div className="text-left">
              <h1 className="codex-display text-3xl font-bold leading-tight">{character.name}</h1>
              {character.aliases?.length > 0 && (
                <p className="codex-mono text-[11px] mt-1 font-semibold" style={{ color: "var(--text-muted)" }}>
                  aka {character.aliases.join(", ")}
                </p>
              )}
            </div>
          </div>
          <IconBtn title="Edit character" onClick={onEdit}><Pencil size={15} /></IconBtn>
        </div>
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          <span className="codex-mono text-xs px-3 py-1.5 rounded-lg font-semibold" style={{ color: "var(--purple)", border: "1px solid rgba(94,234,212,0.3)", background: "rgba(168,85,247,0.1)" }}>{character.role}</span>
          {manhwa && <span className="codex-mono text-[11px] font-semibold" style={{ color: "var(--text-muted)" }}>{manhwa.title}</span>}
        </div>
        <p className="codex-serif text-base leading-relaxed mb-6" style={{ color: "var(--text-muted)" }}>{character.description}</p>

        {character.abilities?.length > 0 && (
          <div>
            <p className="codex-mono text-[11px] uppercase tracking-widest mb-3 flex items-center gap-2 font-bold" style={{ color: "var(--purple)" }}>
              <Shield size={13} /> Abilities
            </p>
            <div className="flex flex-wrap gap-3">
              {character.abilities.map((a, idx) => (
                <span key={idx} className="codex-serif text-sm px-4 py-2 rounded-lg font-semibold transition-all hover:scale-105" style={{ background: "rgba(242,193,78,0.1)", border: "1px solid rgba(242,193,78,0.3)", color: "#F2C14E" }}>
                  {a}
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      <section>
        <SectionHeader icon={<ScrollText size={15} />} title={`Community insights (${insights.length})`} />
        <div className="flex flex-col gap-5">
          <InsightForm saving={saving} onSubmit={onAddInsight} />
          {insights.length === 0 ? (
            <p className="codex-mono text-xs px-3 font-semibold" style={{ color: "var(--text-muted)" }}>No findings logged yet. Share the first theory above.</p>
          ) : (
            insights.map((ins) => (
              <div key={ins.id} className="codex-frame rounded-xl p-5">
                <div className="flex items-center gap-3 flex-wrap mb-3">
                  <InsightTypeTag type={ins.type} />
                  <span className="codex-mono text-[11px] font-semibold" style={{ color: "var(--text-muted)" }}>
                    {ins.author} · {formatDate(ins.created_at)}
                  </span>
                </div>
                <p className="codex-serif text-base leading-relaxed" style={{ color: "var(--text-primary)" }}>{ins.text}</p>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
