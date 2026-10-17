# 테스트 TODO

## 1. CatalogService (최우선)
단위 테스트. StringRedisTemplate, JdbcClient를 mock으로.
- [ ] 캐시 hit → DB 안 읽음
- [ ] 캐시 miss → DB 읽고 Redis에 set
- [ ] Redis 예외(get/set) → DB 결과로 정상 응답
- [ ] cache-enabled=false → Redis 호출 없음
- [ ] (나중) 동시 요청 시 DB 1회만 읽는지 (락)

## 2. OAuth2LoginSuccessHandler
단위 테스트. UserRepository, JwtService, OAuth2AuthenticationToken mock + MockHttpServletResponse.
- [ ] 신규 사용자 → save 호출
- [ ] 기존 사용자 → save 없이 recordLogin(email, nickname)
- [ ] 리다이렉트 URL에 token= 포함

## 3. AdminController 이미지 업로드
admin 프로필 MockMvc. publicDir는 @TempDir로.
- [ ] id에 ../ 등 → 400
- [ ] 5MB 초과 → 400
- [ ] webp 아님 → 400
- [ ] 없는 kind → 거절

## 나중에
- [ ] PatchNoteController 페이지 경계값 (0, 음수, 마지막 다음)
