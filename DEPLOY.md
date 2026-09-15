# CODE5 배포 안내

CODE5는 Vercel(React) + Render(Express) + Neon(PostgreSQL) 구성으로 배포합니다.

## 1. GitHub

이 폴더를 GitHub 저장소로 푸시합니다. `.env` 파일과 실제 비밀번호·연결 문자열은 커밋하지 않습니다.

## 2. Neon 데이터베이스

1. Neon에서 PostgreSQL 프로젝트를 만들고 연결 문자열을 복사합니다.
2. SQL Editor 또는 `psql`에서 아래 순서로 실행합니다.

```sh
psql "$DATABASE_URL" -f server/src/db/schema.sql
psql "$DATABASE_URL" -f server/src/db/seed.sql
```

기존 스키마를 사용한다면 migrations도 순서대로 실행합니다.

```sh
psql "$DATABASE_URL" -f server/src/db/migrations/001_add_password_hash.sql
psql "$DATABASE_URL" -f server/src/db/migrations/002_recommendations_and_discussions.sql
psql "$DATABASE_URL" -f server/src/db/migrations/003_add_coding_level.sql
```

## 3. Render API

Render에서 GitHub 저장소를 연결하고 `render.yaml` Blueprint를 사용해 Web Service를 생성합니다.

- `DATABASE_URL`: Neon 연결 문자열
- `CLIENT_ORIGIN`: Vercel 배포 주소 (예: `https://codefive.vercel.app`)
- `JWT_SECRET`: Blueprint가 자동 생성합니다. 이미 운영 중이라면 변경하지 마세요.

배포 후 `/api/health`가 `{"ok":true}`를 반환하는지 확인합니다.

## 4. Vercel 웹

Vercel에서 같은 GitHub 저장소를 가져와 배포합니다. `vercel.json`이 빌드와 출력 경로를 지정합니다.

Production 환경 변수에 아래 값을 추가합니다.

```text
VITE_API_URL=https://your-render-service.onrender.com
```

저장 후 재배포합니다. 마지막으로 Render의 `CLIENT_ORIGIN`에 Vercel URL을 넣고 API와 로그인·게시판을 확인합니다.
