import { useEffect, useState } from 'react';
import { BrowserRouter, Link, Route, Routes, useParams } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, BookOpen, CalendarDays, Check, ChevronLeft, ClipboardList, Clock3, Layers3, LogOut, RefreshCw, Search, ShieldCheck, Timer } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ActivityCard } from './ActivityCard';
import { api, dateLabel, status, type Activity, type Snapshot } from './model';

function SignIn() {
  const failed = new URLSearchParams(window.location.search).has('error');
  return <main className="login-layout">
    <section><span className="section-kicker">A LITTLE LESS DEADLINE CHAOS</span><h1 className="login-title">Your courses.<br />One clear view<span className="text-teal-600">.</span></h1><p className="max-w-lg text-lg leading-8 text-slate-500">Assignments and quizzes from SCeLE, brought together so you can focus on what’s next.</p><div className="mt-8 flex flex-wrap gap-5 text-sm text-slate-600"><span className="flex items-center gap-2"><Check size={17} /> Courses in one place</span><span className="flex items-center gap-2"><Check size={17} /> Deadlines in WIB</span></div></section>
    <section className="login-card"><div className="mb-7 inline-flex rounded-2xl bg-teal-50 p-4 text-teal-700"><ShieldCheck size={30} /></div><h2 className="text-2xl font-semibold">Welcome to Coursewatch</h2><p className="mt-3 leading-7 text-slate-500">Sign in with your Universitas Indonesia account to view the shared course tracker.</p>{failed && <p role="alert" className="notice mt-5">Sign-in could not be completed. Please try again.</p>}<a className="primary-button mt-8 w-full" href="/api/auth/login">Continue with UI SSO <ArrowRight size={18} /></a><p className="mt-5 text-center text-xs leading-6 text-slate-500">Your UI password is entered only on the university SSO page.</p></section>
  </main>;
}
function Dashboard() {
  const [data, setData] = useState<Snapshot | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState('upcoming');
  const [kind, setKind] = useState('all');
  const [query, setQuery] = useState('');
  const [course, setCourse] = useState('all');
  const [now, setNow] = useState(Date.now() / 1000);
  async function refresh() {
    setBusy(true); setError('');
    try { setData(await api<Snapshot>('/api/activities')); }
    catch (error) { setError((error as Error).message); }
    finally { setBusy(false); }
  }
  useEffect(() => { void refresh(); const timer = setInterval(() => setNow(Date.now() / 1000), 60_000); return () => clearInterval(timer); }, []);
  const items = data?.activities || [];
  const counts = { upcoming: items.filter(item => status(item, now) === 'upcoming').length, past: items.filter(item => status(item, now) === 'past').length, undated: items.filter(item => status(item, now) === 'undated').length };
  const courses = [...new Map(items.map(item => [item.courseId, item.courseName])).entries()];
  const visible = items.filter(item => (filter === 'all' || status(item, now) === filter) && (kind === 'all' || item.kind === kind) && (course === 'all' || String(item.courseId) === course) && `${item.name} ${item.courseName}`.toLowerCase().includes(query.toLowerCase())).sort((a, b) => filter === 'past' ? (b.dueAt || 0) - (a.dueAt || 0) : (a.dueAt || Infinity) - (b.dueAt || Infinity));
  return <main className="page-width py-10 md:py-14">
    <div className="flex flex-wrap items-end justify-between gap-5"><div><span className="section-kicker">YOUR ACADEMIC RADAR</span><h1 className="page-title">Keep your next deadline in sight.</h1><p className="mt-3 text-slate-500">A shared overview of assignments and quizzes. Less tab-hopping, more breathing room.</p></div><button className="secondary-button" onClick={refresh} disabled={busy}><RefreshCw size={16} className={busy ? 'animate-spin' : ''} />{busy ? 'Syncing…' : 'Refresh'}</button></div>
    <section className="stats-grid" aria-label="Activity summary">{[[Clock3, 'Upcoming', counts.upcoming, 'upcoming'], [Timer, 'Past due', counts.past, 'past'], [BookOpen, 'Courses', courses.length, 'all'], [CalendarDays, 'Without dates', counts.undated, 'undated']].map(([Icon, title, count, tab]) => { const Symbol = Icon as typeof Clock3; return <button key={String(title)} className="stat-card" onClick={() => setFilter(String(tab))}><span className="flex items-center justify-between text-sm text-slate-500">{String(title)}<Symbol size={18} /></span><span className="mt-4 block text-3xl font-semibold tracking-tight">{busy && !data ? '—' : String(count)}</span></button>; })}</section>
    {error && <p role="alert" className="notice mb-6">{error}</p>}
    {data?.incomplete && <p role="alert" className="notice mb-6">Some course information is temporarily unavailable. Please check SCeLE for the latest details.</p>}
    <div className="dashboard-grid"><section className="min-w-0"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-semibold">Your activity feed</h2><span className="text-xs text-slate-500">{visible.length} activities</span></div><div className="filter-tabs" aria-label="Deadline filter">{[['upcoming', 'Upcoming'], ['past', 'Past due'], ['undated', 'No date'], ['all', 'All']].map(([value, label]) => <button key={value} aria-pressed={filter === value} className={filter === value ? 'selected' : ''} onClick={() => setFilter(value)}>{label}</button>)}</div>
      <div className="search-row"><label className="search-box"><Search size={17} /><input aria-label="Search activities" placeholder="Search activities or courses…" value={query} onChange={event => setQuery(event.target.value)} /></label><select aria-label="Activity type" value={kind} onChange={event => setKind(event.target.value)}><option value="all">All types</option><option value="assignment">Assignments</option><option value="quiz">Quizzes</option></select><select aria-label="Course" value={course} onChange={event => setCourse(event.target.value)}><option value="all">All courses</option>{courses.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></div>
      <div className="flex flex-col gap-3" aria-live="polite">{busy && !data ? <div className="empty-state">Loading your activities…</div> : visible.length ? visible.map(item => <ActivityCard item={item} key={item.id} />) : <div className="empty-state"><div className="mx-auto mb-4 w-fit rounded-full bg-teal-50 p-4 text-teal-700"><ClipboardList size={26} /></div><h3 className="font-semibold text-slate-800">{error ? 'Feed unavailable' : 'No activities in this view'}</h3><p className="mt-2 text-sm">{error ? 'Try refreshing when the connection is available.' : 'Try another filter or check back later.'}</p></div>}</div>
    </section><aside className="space-y-5"><section className="side-card bg-teal-950! text-white"><Layers3 size={23} className="text-teal-300" /><h2 className="mt-4 font-semibold">A planner, not a gradebook.</h2><p className="mt-3 text-sm leading-6 text-teal-100/80">“Past due” means the date has passed. It does not tell you whether you submitted. Always confirm details in SCeLE.</p></section></aside></div>
  </main>;
}
function Details() {
  const { id } = useParams();
  const [item, setItem] = useState<Activity | null>(null);
  const [error, setError] = useState('');
  useEffect(() => { let active = true; setItem(null); setError(''); api<{ activity: Activity }>(`/api/activities/${encodeURIComponent(id || '')}`).then(data => { if (active) setItem(data.activity); }).catch(error => { if (active) setError(error.message); }); return () => { active = false; }; }, [id]);
  return <main className="page-width py-10"><Link to="/" className="mb-8 inline-flex items-center gap-2 text-sm text-slate-500"><ChevronLeft size={16} /> Back to activity feed</Link>{error ? <p role="alert" className="notice">{error}</p> : !item ? <p>Loading activity…</p> : <><div className="max-w-4xl"><span className="section-kicker">{item.courseName} · {item.kind}</span><h1 className="page-title">{item.name}</h1><p className="mt-3 text-sm text-slate-500">Check SCeLE to confirm the dates that apply to your class.</p></div><div className="detail-grid mt-8"><section className="side-card"><h2 className="mb-5 text-xl font-semibold">Activity details</h2><div className="whitespace-pre-wrap break-words leading-8 text-slate-600">{item.description || 'No description is available. View the activity in SCeLE for full instructions.'}</div></section><aside className="side-card"><h2 className="mb-5 font-semibold">Key dates</h2><dl className="space-y-5">{[['Opens', dateLabel(item.opensAt)], [item.kind === 'quiz' ? 'Closes' : 'Due', dateLabel(item.dueAt)], ['Cut-off', dateLabel(item.cutoffAt)], ['Time limit', item.timeLimit ? `${Math.round(item.timeLimit / 60)} minutes` : 'Not available']].map(([label, value]) => <div key={label}><dt className="text-xs text-slate-500">{label}</dt><dd className="mt-1 text-sm font-medium">{value}</dd></div>)}</dl><a className="primary-button mt-7 w-full" href={item.url} target="_blank" rel="noopener noreferrer">Open in SCeLE <ArrowUpRight size={17} /></a><p className="mt-4 text-xs leading-5 text-slate-500">Opens using your own SCeLE session. You still need access to this course. No quiz is started by this tracker.</p></aside></div></>}</main>;
}
function AdminPage() {
  const [data, setData] = useState<{ sources: { id: string; state: string }[]; configured: boolean; checkedAt: string | null } | null>(null);
  const [error, setError] = useState('');
  useEffect(() => { api<NonNullable<typeof data>>('/api/admin/status').then(setData).catch(error => setError(error.message)); }, []);
  return <main className="page-width py-10"><Link to="/">← Activity feed</Link><h1 className="page-title">Administration</h1><p className="mt-3 text-slate-500">Roles are managed by exact UI SSO username in the server’s users.json file.</p>{error && <p role="alert" className="notice mt-6">{error}</p>}<section className="side-card mt-6"><h2 className="font-semibold">Source diagnostics</h2>{!data ? <p>Loading…</p> : <><p className="my-3">{data.configured ? 'Accounts configured' : 'No accounts configured'}</p>{data.sources.map(source => <p key={source.id} className="my-2">{source.id} · {source.state}</p>)}<p className="mt-4 text-sm text-slate-500">Last checked: {data.checkedAt || 'Not yet'} · Cached for five minutes.</p></>}</section></main>;
}
function Shell() {
  const { user, loading, error, logout } = useAuth();
  return <div className="min-h-screen"><header className="site-header"><div className="page-width flex min-h-20 items-center justify-between gap-4"><Link to="/" className="brand"><span className="brand-icon"><Layers3 size={23} /></span>Coursewatch<span className="brand-tag">SCeLE</span></Link>{user ? <div className="flex items-center gap-4"><span className="hidden text-sm text-slate-500 sm:block">{user.fullname}</span>{user.role === 'admin' && <Link className="secondary-button" to="/admin">Admin</Link>}<button onClick={logout} className="secondary-button" aria-label="Sign out"><LogOut size={16} /><span className="hidden sm:inline">Sign out</span></button></div> : <span className="hidden text-xs text-slate-500 sm:block">Built for a clearer semester</span>}</div></header>{error && <p role="alert" className="notice page-width mt-6">{error}</p>}{loading ? <main className="page-width py-20">Checking your session…</main> : !user ? <SignIn /> : <Routes><Route path="/" element={<Dashboard />} /><Route path="/admin" element={user.role === 'admin' ? <AdminPage /> : <main className="page-width py-20">Administrator access required.</main>} /><Route path="/activities/:id" element={<Details />} /><Route path="*" element={<main className="page-width py-20"><h1>Page not found</h1><Link to="/">Return to the feed</Link></main>} /></Routes>}<footer className="page-width flex flex-wrap justify-between gap-3 border-t border-slate-200 py-6 text-xs text-slate-500"><span>Coursewatch · Independent student tool, not an official UI service.</span><span>All dates in Asia/Jakarta · WIB</span></footer></div>;
}
export default function App() { return <BrowserRouter><AuthProvider><Shell /></AuthProvider></BrowserRouter>; }
