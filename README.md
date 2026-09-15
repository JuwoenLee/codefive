# CODE5

하루에 프로그래머스 문제 5개를 추천하고, 계정별 풀이 기록과 문제 토론을 관리하는 풀스택 서비스입니다.

## 실행

1. PostgreSQL에서 `server/src/db/schema.sql`을 실행합니다. 이미 스키마를 생성했다면 `server/src/db/migrations/001_add_password_hash.sql`, `002_recommendations_and_discussions.sql`, `003_add_coding_level.sql`을 순서대로 실행합니다.
2. `.env.example`을 `.env`로 복사하고 `DATABASE_URL`, `JWT_SECRET`을 설정합니다.
3. `npm install`
4. `npm run dev`

프론트엔드: http://localhost:5173 / API: http://localhost:4000

브라우저에서 `client/index.html`을 직접 열지 말고, 위 개발 서버 URL로 접속하세요. 이 프로젝트는 Vite가 TypeScript와 React 코드를 브라우저용으로 변환해 제공해야 합니다.

DB가 연결되지 않아도 프론트엔드는 데모 데이터로 동작합니다.
