import { FormEvent, useEffect, useState } from 'react';
import { ArrowRight, ArrowUpRight, BarChart3, CalendarDays, Check, ChevronRight, Code2, Edit3, Eye, Flame, LockKeyhole, LogOut, MessageCircle, Search, Settings, Target, Trophy, X } from 'lucide-react';
import { problems as initialProblems } from './data';
import type { ApiDiscussion, Problem } from './types';

type View = 'today' | 'record' | 'board' | 'profile';
type CodingLevel = 'beginner' | 'intermediate' | 'advanced';
type Session = { token: string; user: { id: string; email: string; username: string; coding_level?: CodingLevel } };
type LearningStats = { total: number; week: number; streak: number };
const sessionKey = 'codefive-session';
const apiUrl = (import.meta.env.VITE_API_URL ?? 'http://localhost:4000').replace(/\/$/, '');

function ConfettiBurst() {
  return <div className="confetti-burst" aria-hidden="true">{Array.from({ length: 42 }, (_, index) => <i className={`confetti-piece burst-${index % 7}`} key={index} style={{ left: `${22 + (index * 37) % 57}%`, animationDelay: `${(index % 9) * 24}ms` }}/>)}</div>;
}

function DailyHero() {
  return <section className="auth-landing daily-hero" aria-labelledby="daily-hero-title">
    <div className="landing-copy"><p className="landing-eyebrow"><i/> LESS SCROLL. MORE SOLVE.</p><h1 id="daily-hero-title"><span>고민은 짧게.</span><span>코딩은 <em>꾸준하게.</em></span></h1><p>무슨 문제 풀지, 여기서 끝.<br/>하루 다섯 문제로 코딩 근육을 깨우세요.</p><a className="daily-hero-cta" href="#today-lineup">오늘의 5문제 도전하기 <ArrowUpRight size={23}/></a><small>Lv. 1부터 Lv. 3까지 · 프로그래머스 문제 큐레이션</small></div>
    <div className="challenge-card" aria-label="오늘의 다섯 문제 챌린지"><p>YOUR DAILY CHALLENGE <ArrowUpRight size={21}/></p><span>5</span><b>문제</b><small>작은 반복이<br/>큰 실력이 되는 순간.</small><strong>{'{ }'}<br/>++</strong><em>READY, SET, CODE!</em></div>
    <p className="landing-marquee">ONE DAY, FIVE CHALLENGES. <i>✳</i> THINK. CODE. REPEAT. <i>✳</i> ONE DAY, FIVE CHALLENGES.</p>
  </section>;
}

export default function App() {
  const [session, setSession] = useState<Session | null>(() => {
    try { const saved = localStorage.getItem(sessionKey); return saved ? JSON.parse(saved) as Session : null; } catch { return null; }
  });
  const [view, setView] = useState<View>('today');
  const [problems, setProblems] = useState<Problem[]>(initialProblems);
  const [query, setQuery] = useState('');
  const [toast, setToast] = useState('');
  const [celebrating, setCelebrating] = useState(false);
  const [stats, setStats] = useState<LearningStats>({ total: 0, week: 0, streak: 0 });
  const todayLabel = new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'long', day: 'numeric' }).format(new Date()).toUpperCase();
  const completed = problems.filter((p) => p.solved).length;
  const totalMinutes = problems.reduce((total, problem) => total + problem.expectedMinutes, 0);

  useEffect(() => {
    if (!session) return;
    fetch(`${apiUrl}/api/recommendations`, { headers: { Authorization: `Bearer ${session.token}` } })
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((rows: Array<Record<string, unknown>>) => rows.length && setProblems(rows.map((row) => ({
        id: Number(row.id), programmersId: Number(row.programmers_id), title: String(row.title), difficulty: `Lv. ${row.difficulty}` as Problem['difficulty'], category: String(row.category), accuracy: Number(row.accuracy), expectedMinutes: Number(row.expected_minutes), solved: Boolean(row.solved), slug: String(row.programmers_id),
      }))))
      .catch(() => undefined);
  }, [session]);

  useEffect(() => {
    if (!session) return;
    fetch(`${apiUrl}/api/me/stats`, { headers: { Authorization: `Bearer ${session.token}` } })
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then(setStats).catch(() => setStats({ total: 0, week: 0, streak: 0 }));
  }, [session]);

  if (!session) return <AuthScreen onAuthenticated={(nextSession) => {
    localStorage.setItem(sessionKey, JSON.stringify(nextSession));
    setSession(nextSession);
  }} />;

  function toggleSolved(id: number) {
    if (!session) return;
    const target = problems.find((problem) => problem.id === id);
    if (!target) return;
    fetch(`${apiUrl}/api/solutions/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` }, body: JSON.stringify({ solved: !target.solved }) }).catch(() => undefined);
    setProblems((current) => current.map((p) => p.id === id ? {...p, solved: !p.solved} : p));
    if (!target.solved && completed === 4) { setCelebrating(true); window.setTimeout(() => setCelebrating(false), 2200); }
    setToast('오늘의 풀이 기록을 업데이트했어요.');
    window.setTimeout(() => setToast(''), 2200);
  }

  return <div className="app-shell">
    <header className="topbar">
      <button className="brand" onClick={() => setView('today')} aria-label="오늘의 문제로 이동"><span className="brand-mark">C5</span><span>CODE<span>5</span></span></button>
      <nav aria-label="주요 메뉴">
        <button className={view === 'today' ? 'active' : ''} onClick={() => setView('today')}>오늘의 문제</button>
        <button className={view === 'record' ? 'active' : ''} onClick={() => setView('record')}>풀이 기록</button>
        <button className={view === 'board' ? 'active' : ''} onClick={() => setView('board')}>토론 광장</button>
      </nav>
      <div className="header-actions"><button className="icon-btn" aria-label="설정"><Settings size={19}/></button><button className="profile" title={session.user.email} onClick={() => setView('profile')}><span>{session.user.username.slice(0, 2).toUpperCase()}</span><b>{session.user.username}</b><ChevronRight size={16}/></button><button className="icon-btn" aria-label="로그아웃" onClick={() => { localStorage.removeItem(sessionKey); setSession(null); }}><LogOut size={18}/></button></div>
    </header>

    <main>
      {view === 'today' && <>
        <DailyHero/>
        <section className="daily-heading" id="today-lineup"><div><p className="eyebrow">TODAY’S LINEUP</p><h1>오늘의 도전 <span>05</span></h1></div><p><time>{todayLabel}</time><small>매일 00:00 KST 새 조합</small></p></section>
        <section className="daily-dashboard"><div><span>오늘의 목표</span><strong>5 <small>문제</small></strong></div><div><span>전체 권장 시간</span><strong>{totalMinutes} <small>분</small></strong></div><div className="dashboard-progress"><p><span>나의 진행률</span><b>{completed} / 5{completed === 5 ? ' · 오늘도 해냈어요!' : ''}</b></p><div><i style={{width:`${completed * 20}%`}}/></div></div></section>
        <p className="lineup-note">가볍게 시작해서, 마지막은 한 단계 더. 권장 시간은 풀이와 디버깅을 포함한 CODE5 자체 기준입니다.</p>
        <section className="problem-list">
          {problems.map((problem, index) => <article className={`problem-card ${problem.solved?'is-solved':''}`} key={problem.id}>
            <span className="problem-index">0{index+1}</span>
            <div className="problem-copy"><div className="tags"><span className={`level l${problem.difficulty.slice(-1)}`}>{problem.difficulty}</span><span>{problem.category}</span>{index === 0 && <span className="warmup">WARM UP</span>}</div><h3>{problem.title}</h3><p>정답률 {problem.accuracy}% · 프로그래머스</p></div>
            <div className="problem-time"><span>권장 시간</span><strong>{problem.expectedMinutes}<small>분</small></strong></div>
            <button className="check-btn" onClick={() => toggleSolved(problem.id)} aria-label={`${problem.title} ${problem.solved?'미완료':'완료'} 처리`}><span className="check-box">{problem.solved && <Check size={15}/>}</span></button>
            <div className="problem-actions"><button onClick={() => {setView('board'); setQuery(problem.title)}}><MessageCircle size={17}/><span>토론</span></button><a href={`https://school.programmers.co.kr/learn/courses/30/lessons/${problem.programmersId}`} target="_blank" rel="noreferrer" aria-label={`${problem.title} 프로그래머스에서 풀기`}>문제 풀기 <ArrowUpRight size={17}/></a></div>
          </article>)}
        </section>
        <p className="completion-note">완료 체크는 CODE5 안에서만 기록되며, 프로그래머스 제출 결과와 자동으로 연동되지는 않습니다.</p>
        <section className="test-routine" aria-label="코딩테스트 루틴">
          <div className="routine-title"><p className="eyebrow">BUILD YOUR ROUTINE</p><h2>완벽한 하루보다,<br/>계속하는 하루.</h2></div>
          <div className="routine-step"><b>01 / THINK</b><h3>먼저, 생각을 정리하기</h3><p>입력과 조건을 읽고 풀이 방향을 짧게 적어보세요.</p></div>
          <div className="routine-step"><b>02 / SOLVE</b><h3>시간 안에 부딪혀 보기</h3><p>권장 시간을 목표로 구현하고 경계값을 확인해요.</p></div>
          <div className="routine-step"><b>03 / REVIEW</b><h3>한 줄이라도 남기기</h3><p>막힌 지점과 새로 배운 패턴을 기록해요.</p></div>
        </section>
        {completed > 0 && <section className="solve-cheer" aria-live="polite"><span><Check size={21}/></span><div><p className="eyebrow">KEEP GOING</p><h2>{completed === 5 ? '오늘의 다섯 문제를 모두 해냈어요!' : `${completed}문제 해결! 흐름을 이어가 볼까요?`}</h2><p>{completed === 5 ? '작은 반복이 큰 실력이 되는 순간이에요. 정말 잘했어요.' : '한 문제씩 쌓이는 집중력이 내일의 자신감을 만듭니다.'}</p></div></section>}
      </>}

      {view === 'record' && <RecordView problems={problems} stats={stats} />}
      {view === 'board' && <BoardView initialQuery={query} setQuery={setQuery} session={session} problems={problems} />}
      {view === 'profile' && <ProfileView user={session.user} token={session.token} problems={problems} stats={stats} goToToday={() => setView('today')} onUserUpdated={(user) => { const nextSession = { ...session, user }; localStorage.setItem(sessionKey, JSON.stringify(nextSession)); setSession(nextSession); }} />}
    </main>
    {celebrating && <ConfettiBurst/>}
    {toast && <div className="toast"><Check size={17}/>{toast}</div>}
  </div>;
}

function ProfileView({ user, token, problems, stats, goToToday, onUserUpdated }: { user: Session['user']; token: string; problems: Problem[]; stats: LearningStats; goToToday: () => void; onUserUpdated: (user: Session['user']) => void }) {
  const completed = problems.filter((problem) => problem.solved);
  const initial = user.username.slice(0, 2).toUpperCase();
  const activity = [0, 0, 0, 0, 0, 0, stats.week];
  const days = ['월', '화', '수', '목', '금', '토', '일'];
  const currentMonth = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date()).toUpperCase();
  const [editing, setEditing] = useState(false);
  const [codingLevel, setCodingLevel] = useState<CodingLevel>(user.coding_level ?? 'intermediate');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const levelName: Record<CodingLevel, string> = { beginner: '초급', intermediate: '중급', advanced: '고급' };
  async function saveCodingLevel(event: FormEvent) { event.preventDefault(); setSaving(true); setError(''); try { const response = await fetch(`${apiUrl}/api/me/coding-level`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ codingLevel }) }); const result = await response.json() as { user?: Session['user']; message?: string }; if (!response.ok || !result.user) throw new Error(result.message ?? '수준을 저장하지 못했습니다.'); onUserUpdated(result.user); setEditing(false); } catch (requestError) { setError(requestError instanceof Error ? requestError.message : '수준을 저장하지 못했습니다.'); } finally { setSaving(false); } }

  return <section className="profile-page">
    <div className="profile-hero"><div className="profile-avatar">{initial}</div><div className="profile-name"><p className="eyebrow">MY CODE5</p><h1>{user.username}</h1><p>{user.email} · 현재 {levelName[user.coding_level ?? 'intermediate']}</p></div><button className="ghost profile-edit" onClick={() => { setCodingLevel(user.coding_level ?? 'intermediate'); setError(''); setEditing(true); }}><Edit3 size={16}/> 프로필 편집</button></div>
    <div className="profile-overview"><article><span className="metric-icon"><Flame size={20}/></span><div><p>연속 학습</p><strong>{stats.streak}<small>일</small></strong></div><span className="metric-trend">현재</span></article><article><span className="metric-icon"><Code2 size={20}/></span><div><p>이번 주 풀이</p><strong>{stats.week}<small>문제</small></strong></div><span className="metric-trend">누적 {stats.total}</span></article><article><span className="metric-icon"><Target size={20}/></span><div><p>이번 달 목표</p><strong>{stats.total}<small> / 50</small></strong></div><span className="metric-trend">{Math.round(stats.total / 50 * 100)}%</span></article></div>
    <div className="profile-grid"><div className="profile-card activity-card"><div className="card-heading"><div><span className="eyebrow">LAST 7 DAYS</span><h2>이번 주 학습 활동</h2></div><CalendarDays size={19}/></div><div className="activity-bars">{activity.map((count, index) => <div key={days[index]}><i style={{ height: `${Math.max(count, 1) * 17}px` }} className={index === 6 ? 'today-bar' : ''}/><b>{count}</b><span>{days[index]}</span></div>)}</div><p className="activity-note"><Flame size={15}/> 이번 주 <strong>{stats.week}문제</strong>를 풀었어요.</p></div><div className="profile-card goal-card"><span className="eyebrow">{currentMonth} GOAL</span><h2>월간 목표</h2><div className="goal-ring" style={{ background: `radial-gradient(closest-side,#1a1c19 80%,transparent 81% 100%),conic-gradient(var(--lime) ${Math.min(stats.total * 2, 100)}%,#343931 0)` }}><strong>{Math.min(stats.total * 2, 100)}<small>%</small></strong></div><p>{Math.max(50 - stats.total, 0)}문제만 더 풀면 이번 달 목표를 달성해요.</p><button className="primary" onClick={goToToday}>오늘의 문제 풀기 <ArrowRight size={16}/></button></div></div>
    <div className="profile-card recent-card"><div className="card-heading"><div><span className="eyebrow">RECENTLY SOLVED</span><h2>최근 풀이</h2></div><button className="ghost" onClick={goToToday}>전체 보기 <ChevronRight size={16}/></button></div>{completed.length ? completed.map((problem) => <div className="profile-solve" key={problem.id}><span><Check size={16}/></span><div><b>{problem.title}</b><small>{problem.difficulty} · {problem.category}</small></div><time>오늘</time></div>) : <div className="empty">완료한 문제를 기록하면 여기에 표시됩니다.</div>}</div>
    {editing && <div className="modal-backdrop" onClick={() => !saving && setEditing(false)}><form className="modal level-modal" onSubmit={saveCodingLevel} onClick={event => event.stopPropagation()}><span className="eyebrow">CODING LEVEL</span><h2>현재 코딩 수준</h2><p>선택한 수준은 다음 날부터 추천 문제 난이도 구성에 반영됩니다.</p><label><input type="radio" name="coding-level" checked={codingLevel === 'beginner'} onChange={() => setCodingLevel('beginner')}/><span><b>초급</b><small>Lv. 1 3개 · Lv. 2 2개</small></span></label><label><input type="radio" name="coding-level" checked={codingLevel === 'intermediate'} onChange={() => setCodingLevel('intermediate')}/><span><b>중급</b><small>Lv. 1 2개 · Lv. 2 중심 · 3일마다 Lv. 3</small></span></label><label><input type="radio" name="coding-level" checked={codingLevel === 'advanced'} onChange={() => setCodingLevel('advanced')}/><span><b>고급</b><small>Lv. 2 3개 · Lv. 3 2개</small></span></label>{error && <p className="auth-error">{error}</p>}<div><button type="button" className="ghost" onClick={() => setEditing(false)} disabled={saving}>취소</button><button className="primary" disabled={saving}>{saving ? '저장 중…' : '수준 저장'}</button></div></form></div>}
  </section>;
}

function AuthIntro() {
  return <section className="auth-intro"><button className="brand" aria-label="CODE5 홈"><span className="brand-mark">C5</span><span>CODE<span>5</span></span></button><div><p className="eyebrow">BUILD YOUR DAILY ROUTINE</p><h1><span>매일 다섯 문제,</span><em>나만의 기록으로.</em></h1><p>풀이 기록과 토론을 한 계정에서 이어가세요.</p></div><div className="auth-quote"><span>“</span><p>작은 알고리즘 하나를 풀어낸 오늘이<br/>내일의 자신감을 만듭니다.</p></div></section>;
}

function AuthScreen({ onAuthenticated }: { onAuthenticated: (session: Session) => void }) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [codingLevel, setCodingLevel] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(''); setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/auth/${mode === 'login' ? 'login' : 'signup'}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mode === 'login' ? { email, password } : { email, username, password, codingLevel }),
      });
      const result = await response.json() as Session & { message?: string };
      if (!response.ok) throw new Error(result.message ?? '로그인에 실패했습니다.');
      onAuthenticated(result);
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : '서버에 연결할 수 없습니다.'); }
    finally { setLoading(false); }
  }

  return <main className="auth-shell"><AuthIntro/><section className="auth-panel"><form onSubmit={submit}><div className="auth-head"><span className="auth-icon"><LockKeyhole size={21}/></span><h2>{mode === 'login' ? '다시 만나서 반가워요' : 'CODE5 시작하기'}</h2><p>{mode === 'login' ? '계정으로 로그인해 오늘의 문제를 확인하세요.' : '나만의 풀이 루틴을 지금 만들어 보세요.'}</p></div>{mode === 'signup' && <><label>닉네임<input required minLength={2} maxLength={30} value={username} onChange={e => setUsername(e.target.value)} placeholder="예: duon_kim"/></label><label>코딩 수준<select required value={codingLevel} onChange={e => setCodingLevel(e.target.value)}><option value="">현재 수준을 선택하세요</option><option value="beginner">초급 · 레벨 1 중심</option><option value="intermediate">중급 · 레벨 1~3 균형</option><option value="advanced">고급 · 레벨 2~3 중심</option></select></label></>}<label>이메일<input required type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"/></label><label>비밀번호<input required minLength={8} type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="8자 이상 입력"/></label>{error && <p className="auth-error" role="alert">{error}</p>}<button className="auth-submit" disabled={loading}>{loading ? '처리 중…' : mode === 'login' ? '로그인하기' : '회원가입하기'}<ArrowRight size={18}/></button><p className="auth-switch">{mode === 'login' ? '처음이신가요?' : '이미 계정이 있나요?'} <button type="button" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}>{mode === 'login' ? '회원가입' : '로그인'}</button></p></form></section></main>;
}

function RecordView({ problems, stats }: { problems: Problem[]; stats: LearningStats }) {
  const completed = problems.filter(p=>p.solved);
  const monthLabel = new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long' }).format(new Date());
  return <section className="subpage"><p className="eyebrow">MY PROGRESS</p><h1>풀이 기록</h1><p className="subcopy">작은 완료가 쌓여 나만의 실력이 됩니다.</p>
    <div className="stats-grid"><div><BarChart3/><span>이번 주</span><strong>{stats.week}<small> 문제</small></strong></div><div><Flame/><span>연속 학습</span><strong>{stats.streak}<small> 일</small></strong></div><div><Trophy/><span>전체 완료</span><strong>{stats.total}<small> 문제</small></strong></div></div>
    <div className="record-panel"><div className="record-head"><h2>최근 풀이</h2><span>{monthLabel}</span></div>{completed.length ? completed.map(p=><div className="record-row" key={p.id}><span className="record-check"><Check size={16}/></span><div><b>{p.title}</b><small>{p.difficulty} · {p.category}</small></div><time>오늘</time></div>) : <div className="empty">아직 완료한 문제가 없어요.</div>}</div>
  </section>
}

function BoardView({ initialQuery, setQuery, session, problems }: { initialQuery: string; setQuery: (value: string) => void; session: Session; problems: Problem[] }) {
  const [query, setLocalQuery] = useState(initialQuery);
  const [sort, setSort] = useState<'latest' | 'views'>('latest');
  const [posts, setPosts] = useState<ApiDiscussion[]>([]);
  const [compose, setCompose] = useState(false);
  const [selected, setSelected] = useState<(ApiDiscussion & { comments: Array<{ id: number; content: string; created_at: string; username: string }> }) | null>(null);
  const [problemId, setProblemId] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const loadPosts = () => fetch(`${apiUrl}/api/discussions?sort=${sort === 'views' ? 'views' : 'latest'}`).then((response) => response.json()).then(setPosts).catch(() => setPosts([]));
  useEffect(() => { loadPosts(); }, [sort]);
  const filtered = posts.filter((post) => `${post.title} ${post.problem_title}`.toLowerCase().includes(query.toLowerCase()));
  const relativeTime = (iso: string) => new Intl.DateTimeFormat('ko-KR', { month: 'numeric', day: 'numeric' }).format(new Date(iso));
  async function submitPost(event: FormEvent) { event.preventDefault(); setError(''); const response = await fetch(`${apiUrl}/api/discussions`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` }, body: JSON.stringify({ problemId: Number(problemId), title, content }) }); const result = await response.json(); if (!response.ok) return setError(result.message ?? '게시하지 못했습니다.'); setCompose(false); setTitle(''); setContent(''); setProblemId(''); loadPosts(); }
  async function openPost(id: number) { const response = await fetch(`${apiUrl}/api/discussions/${id}`); if (response.ok) setSelected(await response.json()); }
  async function submitComment(event: FormEvent) { event.preventDefault(); if (!selected || !comment.trim()) return; const response = await fetch(`${apiUrl}/api/discussions/${selected.id}/comments`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` }, body: JSON.stringify({ content: comment }) }); if (response.ok) { setComment(''); openPost(selected.id); loadPosts(); } }
  return <section className="subpage"><div className="board-title"><div><p className="eyebrow">SOLVE TOGETHER</p><h1>토론 광장</h1><p className="subcopy">풀이의 실마리를 나누고 더 나은 해법을 찾아보세요.</p></div><button className="primary" onClick={() => setCompose(true)}>새 글 작성</button></div>
    <div className="board-tools"><label><Search size={18}/><input value={query} onChange={e => { setLocalQuery(e.target.value); setQuery(e.target.value); }} placeholder="문제명이나 토론 검색"/></label><div><button className={sort === 'latest' ? 'selected' : ''} onClick={() => setSort('latest')}>최신순</button><button className={sort === 'views' ? 'selected' : ''} onClick={() => setSort('views')}>조회수 많은 순</button></div></div>
    <div className="discussion-list">{filtered.map(post => <article key={post.id} className="post-row" onClick={() => openPost(post.id)}><span className="avatar">{post.username.slice(0, 2).toUpperCase()}</span><div><span className="discussion-problem">{post.problem_title}</span><h3>{post.title}</h3><p>{post.username} · {relativeTime(post.created_at)}</p></div><span className="post-meta"><span><Eye size={15}/>{post.views}</span><span><MessageCircle size={15}/>{post.comment_count}</span></span></article>)}{!filtered.length&&<div className="empty">아직 게시글이 없습니다. 첫 번째 질문을 남겨보세요.</div>}</div>
    {compose && <div className="modal-backdrop" onClick={() => setCompose(false)}><form className="modal" onSubmit={submitPost} onClick={e => e.stopPropagation()}><span className="eyebrow">NEW DISCUSSION</span><h2>풀이 질문 남기기</h2><label>문제<select required value={problemId} onChange={e => setProblemId(e.target.value)}><option value="">문제를 선택하세요</option>{problems.map(problem => <option key={problem.id} value={problem.id}>{problem.title}</option>)}</select></label><label>제목<input required value={title} onChange={e => setTitle(e.target.value)} placeholder="궁금한 내용을 한 줄로 적어주세요"/></label><label>내용<textarea required rows={5} value={content} onChange={e => setContent(e.target.value)} placeholder="접근 방법과 막힌 지점을 자세히 알려주세요"/></label>{error && <p className="auth-error">{error}</p>}<div><button type="button" className="ghost" onClick={() => setCompose(false)}>취소</button><button className="primary">게시하기</button></div></form></div>}
    {selected && <div className="modal-backdrop" onClick={() => setSelected(null)}><article className="modal detail-modal" onClick={e => e.stopPropagation()}><button className="close-btn" onClick={() => setSelected(null)} aria-label="상세 보기 닫기"><X size={18}/></button><span className="discussion-problem">{selected.problem_title}</span><h2>{selected.title}</h2><p className="detail-meta">{selected.username} · {relativeTime(selected.created_at)} · 조회 {selected.views}</p><div className="detail-content">{selected.content}</div><div className="comment-area"><h3>댓글 {selected.comments.length}</h3>{selected.comments.map(item => <div className="comment" key={item.id}><b>{item.username}</b><p>{item.content}</p></div>)}<form onSubmit={submitComment}><input value={comment} onChange={e => setComment(e.target.value)} placeholder="댓글을 남겨보세요"/><button className="primary">등록</button></form></div></article></div>}
  </section>;
}
