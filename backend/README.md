# wuwaEchoCheck backend

Spring Boot 백엔드입니다. 소셜 로그인(구글) 후 JWT를 발급하고, 프런트가 localStorage에
저장하던 `characterData` 전체를 클라우드(Postgres)에 저장/불러오기 합니다.

## API
| Method | Path | 설명 |
| --- | --- | --- |
| GET | `/oauth2/authorization/google` | 구글 로그인 시작 (프런트는 이 URL로 이동만 시키면 됨) |
| GET | `/api/me` | 로그인한 사용자 정보 |
| GET | `/api/state` | 저장된 `characterData` JSON 문자열 |
| PUT | `/api/state` | `{ "data": "<JSON 문자열>" }`로 저장 |
| GET | `/api/patch-notes?query=&page=0&size=10` | 패치노트 목록 (제목 검색 + 페이지네이션, 인증 불필요) |
| GET | `/api/events` | 진행 중/예정 이벤트 목록 (인증 불필요) |

로그인 성공 시 `FRONTEND_REDIRECT_URI?token=<JWT>`로 리다이렉트됩니다. 이후 프런트는
모든 API 호출에 `Authorization: Bearer <JWT>` 헤더를 실어 보냅니다.

## 배포 전 참고

GitHub Pages는 정적 파일만 서빙하므로 이 백엔드는 별도 호스팅이 필요합니다
(Render, Railway, Fly.io 등). 배포 시 `FRONTEND_REDIRECT_URI`, `FRONTEND_ALLOWED_ORIGINS`,
`DB_URL`, `JWT_SECRET`, `GOOGLE_CLIENT_ID/SECRET`을 운영 값으로 바꿔주세요.
