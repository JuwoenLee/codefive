import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { db } from './db.js';
import { createToken, hashPassword, passwordMatches, requireAuth, type AuthUser } from './auth.js';

const app = express();
const allowedOrigins = (process.env.CLIENT_ORIGIN ?? '').split(',').map((origin) => origin.trim()).filter(Boolean);
app.use(cors({ origin: (origin, callback) => {
  if (!origin || allowedOrigins.includes(origin) || /^http:\/\/localhost:\d+$/.test(origin)) return callback(null, true);
  callback(new Error('허용되지 않은 출처입니다.'));
}}));
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.post('/api/auth/signup', async (req, res, next) => {
  try {
    const { email, username, password, codingLevel } = req.body as Partial<AuthUser & { password: string; codingLevel: 'beginner' | 'intermediate' | 'advanced' }>;
    if (!email || !username || !password || password.length < 8) return res.status(400).json({ message: '이메일, 닉네임, 8자 이상의 비밀번호를 입력해 주세요.' });
    if (!['beginner', 'intermediate', 'advanced'].includes(codingLevel ?? '')) return res.status(400).json({ message: '현재 코딩 수준을 선택해 주세요.' });
    const passwordHash = await hashPassword(password);
    const { rows } = await db.query<AuthUser>(`INSERT INTO users(email, username, coding_level, password_hash) VALUES($1, $2, $3, $4) RETURNING id, email, username, coding_level`, [email.toLowerCase(), username, codingLevel, passwordHash]);
    const user = rows[0];
    res.status(201).json({ token: createToken(user), user });
  } catch (error: unknown) {
    if ((error as { code?: string }).code === '23505') return res.status(409).json({ message: '이미 사용 중인 이메일 또는 닉네임입니다.' });
    next(error);
  }
});

app.post('/api/auth/login', async (req, res, next) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) return res.status(400).json({ message: '이메일과 비밀번호를 입력해 주세요.' });
    const { rows } = await db.query<AuthUser & { password_hash: string }>(`SELECT id, email, username, coding_level, password_hash FROM users WHERE email = $1`, [email.toLowerCase()]);
    const user = rows[0];
    if (!user || !(await passwordMatches(password, user.password_hash))) return res.status(401).json({ message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    const { password_hash: _passwordHash, ...publicUser } = user;
    res.json({ token: createToken(publicUser), user: publicUser });
  } catch (error) { next(error); }
});

app.get('/api/auth/me', requireAuth, (_req, res) => res.json({ user: res.locals.user as AuthUser }));

app.patch('/api/me/coding-level', requireAuth, async (req, res, next) => {
  try {
    const codingLevel = req.body?.codingLevel as string | undefined;
    if (!['beginner', 'intermediate', 'advanced'].includes(codingLevel ?? '')) return res.status(400).json({ message: '유효한 코딩 수준을 선택해 주세요.' });
    const userId = (res.locals.user as AuthUser).id;
    await db.query(`DELETE FROM daily_recommendations WHERE user_id = $1 AND recommended_date = CURRENT_DATE`, [userId]);
    const { rows } = await db.query<AuthUser>(`UPDATE users SET coding_level = $1 WHERE id = $2 RETURNING id, email, username, coding_level`, [codingLevel, userId]);
    res.json({ user: rows[0] });
  } catch (error) { next(error); }
});

app.get('/api/me/stats', requireAuth, async (_req, res, next) => {
  try {
    const userId = (res.locals.user as AuthUser).id;
    const { rows } = await db.query<{ total: string; week: string; solved_dates: string[] }>(`SELECT
      COUNT(*)::text AS total,
      COUNT(*) FILTER (WHERE solved_at >= date_trunc('week', CURRENT_DATE))::text AS week,
      COALESCE(ARRAY_AGG(DISTINCT solved_at::date::text ORDER BY solved_at::date DESC), ARRAY[]::text[]) AS solved_dates
      FROM user_solutions WHERE user_id = $1`, [userId]);
    const record = rows[0];
    const dates = new Set(record.solved_dates);
    let streak = 0;
    const cursor = new Date();
    while (dates.has(cursor.toISOString().slice(0, 10))) { streak += 1; cursor.setDate(cursor.getDate() - 1); }
    res.json({ total: Number(record.total), week: Number(record.week), streak });
  } catch (error) { next(error); }
});

app.get('/api/recommendations', requireAuth, async (_req, res, next) => {
  try {
    const userId = (res.locals.user as AuthUser).id;
    const { rows: userRows } = await db.query<{ coding_level: 'beginner' | 'intermediate' | 'advanced' }>(`SELECT coding_level FROM users WHERE id = $1`, [userId]);
    const codingLevel = userRows[0]?.coding_level ?? 'intermediate';
    const yearStart = new Date(new Date().getFullYear(), 0, 1);
    const isAdvancedDay = Math.floor((Date.now() - yearStart.getTime()) / 86_400_000 + 1) % 3 === 0;
    const levelOneCount = codingLevel === 'beginner' ? 3 : codingLevel === 'advanced' ? 0 : 2;
    const levelTwoCount = codingLevel === 'beginner' ? 2 : codingLevel === 'advanced' ? 3 : isAdvancedDay ? 2 : 3;
    const levelThreeCount = codingLevel === 'advanced' ? 2 : codingLevel === 'intermediate' && isAdvancedDay ? 1 : 0;
    await db.query(`INSERT INTO daily_recommendations (user_id, problem_id, recommended_date, position)
      SELECT $1, candidates.id, CURRENT_DATE, ROW_NUMBER() OVER (ORDER BY candidates.bucket, md5(candidates.id::text || CURRENT_DATE::text))::smallint
      FROM (
        SELECT * FROM (SELECT p.id, 1 AS bucket FROM problems p WHERE p.difficulty = 1 AND NOT EXISTS (SELECT 1 FROM daily_recommendations r WHERE r.user_id = $1 AND r.recommended_date = CURRENT_DATE - 1 AND r.problem_id = p.id) ORDER BY md5(p.id::text || CURRENT_DATE::text) LIMIT $2) level_one
        UNION ALL
        SELECT * FROM (SELECT p.id, 2 AS bucket FROM problems p WHERE p.difficulty = 2 AND NOT EXISTS (SELECT 1 FROM daily_recommendations r WHERE r.user_id = $1 AND r.recommended_date = CURRENT_DATE - 1 AND r.problem_id = p.id) ORDER BY md5(p.id::text || CURRENT_DATE::text) LIMIT $3) level_two
        UNION ALL
        SELECT * FROM (SELECT p.id, 3 AS bucket FROM problems p WHERE p.difficulty = 3 AND NOT EXISTS (SELECT 1 FROM daily_recommendations r WHERE r.user_id = $1 AND r.recommended_date = CURRENT_DATE - 1 AND r.problem_id = p.id) ORDER BY md5(p.id::text || CURRENT_DATE::text) LIMIT $4) level_three
      ) candidates
      WHERE NOT EXISTS (SELECT 1 FROM daily_recommendations r WHERE r.user_id = $1 AND r.recommended_date = CURRENT_DATE)`, [userId, levelOneCount, levelTwoCount, levelThreeCount]);
    const { rows } = await db.query(`SELECT p.*, (s.problem_id IS NOT NULL) AS solved
      FROM daily_recommendations r JOIN problems p ON p.id = r.problem_id
      LEFT JOIN user_solutions s ON s.problem_id = p.id AND s.user_id = $1
      WHERE r.user_id = $1 AND r.recommended_date = CURRENT_DATE ORDER BY r.position`, [userId]);
    res.json(rows);
  } catch (error) { next(error); }
});

app.put('/api/solutions/:problemId', requireAuth, async (req, res, next) => {
  try {
    const userId = (res.locals.user as AuthUser).id;
    const { problemId } = req.params;
    if (req.body.solved) await db.query(`INSERT INTO user_solutions(user_id, problem_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`, [userId, problemId]);
    else await db.query(`DELETE FROM user_solutions WHERE user_id=$1 AND problem_id=$2`, [userId, problemId]);
    res.status(204).end();
  } catch (error) { next(error); }
});

app.get('/api/discussions', async (req, res, next) => {
  try {
    const order = req.query.sort === 'views' ? 'd.views DESC, d.created_at DESC' : 'd.created_at DESC';
    const { rows } = await db.query(`SELECT d.id, d.title, d.content, d.views, d.created_at, d.problem_id, u.username, p.title AS problem_title,
      (SELECT COUNT(*)::int FROM comments c WHERE c.discussion_id = d.id) AS comment_count
      FROM discussions d JOIN users u ON u.id=d.user_id JOIN problems p ON p.id=d.problem_id ORDER BY ${order}`);
    res.json(rows);
  }
  catch (error) { next(error); }
});

app.get('/api/discussions/:id', async (req, res, next) => {
  try {
    const { rows } = await db.query(`UPDATE discussions SET views = views + 1 WHERE id = $1
      RETURNING id, title, content, views, created_at, problem_id`, [req.params.id]);
    if (!rows[0]) return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
    const { rows: detail } = await db.query(`SELECT d.*, u.username, p.title AS problem_title FROM discussions d JOIN users u ON u.id=d.user_id JOIN problems p ON p.id=d.problem_id WHERE d.id=$1`, [req.params.id]);
    const { rows: comments } = await db.query(`SELECT c.id, c.content, c.created_at, u.username FROM comments c JOIN users u ON u.id=c.user_id WHERE c.discussion_id=$1 ORDER BY c.created_at ASC`, [req.params.id]);
    res.json({ ...detail[0], comments });
  } catch (error) { next(error); }
});

app.post('/api/discussions', requireAuth, async (req, res, next) => {
  try { const { problemId, title, content } = req.body; const userId = (res.locals.user as AuthUser).id; if (!problemId || !title?.trim() || !content?.trim()) return res.status(400).json({ message: '문제, 제목, 내용을 모두 입력해 주세요.' }); const { rows } = await db.query(`INSERT INTO discussions(user_id,problem_id,title,content) VALUES($1,$2,$3,$4) RETURNING *`,[userId,problemId,title.trim(),content.trim()]); res.status(201).json(rows[0]); }
  catch (error) { next(error); }
});

app.post('/api/discussions/:id/comments', requireAuth, async (req, res, next) => {
  try { const content = String(req.body.content ?? '').trim(); if (!content) return res.status(400).json({ message: '댓글 내용을 입력해 주세요.' }); const userId = (res.locals.user as AuthUser).id; const { rows } = await db.query(`INSERT INTO comments(discussion_id,user_id,content) VALUES($1,$2,$3) RETURNING id, content, created_at`, [req.params.id, userId, content]); res.status(201).json(rows[0]); }
  catch (error) { next(error); }
});

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(error);
  if ((error as { code?: string }).code === 'ECONNREFUSED') {
    return res.status(503).json({ message: 'PostgreSQL에 연결할 수 없습니다. 데이터베이스를 시작하고 DATABASE_URL을 확인해 주세요.' });
  }
  res.status(500).json({ message: '요청을 처리하지 못했습니다.' });
});
app.listen(Number(process.env.PORT ?? 4000), () => console.log('CODE5 API: http://localhost:4000'));
