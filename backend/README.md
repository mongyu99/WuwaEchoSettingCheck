# wuwaEchoCheck backend

Spring Boot 백엔드입니다. 소셜 로그인(구글) 후 JWT를 발급하고, 프런트가 localStorage에
저장하던 `characterData` 전체를 클라우드(Postgres)에 저장/불러오기 합니다.

## 로컬 실행

1. Postgres 실행: `docker compose up -d`
2. 구글 OAuth 클라이언트 발급 ([Google Cloud Console](https://console.cloud.google.com/apis/credentials)):
   - 승인된 리디렉션 URI에 `http://localhost:8080/login/oauth2/code/google` 추가
3. 환경변수 설정 후 실행:

```bash
export GOOGLE_CLIENT_ID=...
export GOOGLE_CLIENT_SECRET=...
export JWT_SECRET=아무거나-32자-이상-랜덤-문자열
./gradlew bootRun
```

기본값(`application.yml`)은 로컬 개발 기준입니다:
- DB: `localhost:5432/wuwaecho` (docker-compose 기준 계정 wuwaecho/wuwaecho)
- 프런트 콜백 주소: `http://localhost:5173/auth/callback`
- 허용 CORS origin: `http://localhost:5173`

## API

| Method | Path | 설명 |
| --- | --- | --- |
| GET | `/oauth2/authorization/google` | 구글 로그인 시작 (프런트는 이 URL로 이동만 시키면 됨) |
| GET | `/api/me` | 로그인한 사용자 정보 |
| GET | `/api/state` | 저장된 `characterData` JSON 문자열 |
| PUT | `/api/state` | `{ "data": "<JSON 문자열>" }`로 저장 |

로그인 성공 시 `FRONTEND_REDIRECT_URI?token=<JWT>`로 리다이렉트됩니다. 이후 프런트는
모든 API 호출에 `Authorization: Bearer <JWT>` 헤더를 실어 보냅니다.

## 배포 전 참고

GitHub Pages는 정적 파일만 서빙하므로 이 백엔드는 별도 호스팅이 필요합니다
(Render, Railway, Fly.io 등). 배포 시 `FRONTEND_REDIRECT_URI`, `FRONTEND_ALLOWED_ORIGINS`,
`DB_URL`, `JWT_SECRET`, `GOOGLE_CLIENT_ID/SECRET`을 운영 값으로 바꿔주세요.
