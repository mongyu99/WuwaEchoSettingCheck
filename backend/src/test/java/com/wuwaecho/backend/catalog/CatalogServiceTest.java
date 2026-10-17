package com.wuwaecho.backend.catalog;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.RETURNS_DEEP_STUBS;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.nio.file.Path;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.data.redis.RedisConnectionFailureException;
import org.springframework.jdbc.CannotGetJdbcConnectionException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.test.util.ReflectionTestUtils;
import tools.jackson.databind.ObjectMapper;

class CatalogServiceTest {

    @Test
    @DisplayName("Redis가 죽으면 Redis를 한 번만 시도하고 DB 결과를 돌려준다")
    @SuppressWarnings("unchecked")
    void checkRedisException() {
        // ===== [1] 가짜 만들기 =====
        // CatalogService의 final 필드 타입을 그대로 가져옵니다: JdbcClient, ObjectMapper, StringRedisTemplate

        // 가짜 Redis 클라이언트
        StringRedisTemplate redis = mock(StringRedisTemplate.class);
        // redis.opsForValue()가 돌려주는 객체도 가짜로 (마우스를 올리면 타입이 ValueOperations<String, String>)
        ValueOperations<String, String> valueOps = mock(ValueOperations.class);
        // 가짜 DB. jdbc.sql().query().listOfRows() 사슬 호출이라 RETURNS_DEEP_STUBS로 중간 단계를 자동 생성
        JdbcClient jdbc = mock(JdbcClient.class, RETURNS_DEEP_STUBS);
        // JSON 변환은 진짜로 해야 결과를 확인할 수 있어서 mock이 아니라 new
        ObjectMapper objectMapper = new ObjectMapper();

        // ===== [2] 가짜에게 대본 주기 =====
        // "opsForValue()를 부르면 위에서 만든 가짜 valueOps를 줘"
        when(redis.opsForValue()).thenReturn(valueOps);
        // "get을 부르면 연결 실패 예외를 던져" → Redis가 죽은 상황
        when(valueOps.get(anyString())).thenThrow(new RedisConnectionFailureException("redis down"));
        // "어떤 SQL이 오든 행 하나 [{id: 999}]를 줘" → 눈에 띄는 값이라 결과에서 찾기 쉬움
        when(jdbc.sql(anyString()).query().listOfRows()).thenReturn(List.of(Map.of("id", 999)));

        // ===== [3] 진짜 CatalogService 만들기 =====
        // 생성자 인자 순서 = final 필드 선언 순서 (jdbc, objectMapper, redis)
        CatalogService service = new CatalogService(jdbc, objectMapper, redis);
        // new로 만들면 @Value가 안 들어가서 cacheEnabled가 false. 캐시 경로를 타도록 true로 켬
        ReflectionTestUtils.setField(service, "cacheEnabled", true);

        // ===== [4] 실행 =====
        String json = service.getJson();

        // ===== [5] 결과 확인: 예외가 밖으로 안 새고, DB 데이터가 나왔나 =====
        assertThat(json).contains("\"id\":999");

        // ===== [6] 호출 횟수 확인 (핵심) =====
        // Redis가 죽은 걸 알았으면 다시 시도하지 말아야 함 → get은 1번만
        verify(valueOps, times(1)).get(CatalogService.CACHE_KEY);
        // 죽은 Redis에 저장 시도도 하지 말아야 함
        verify(valueOps, never()).set(any(), any());
    }

    @Test
    @DisplayName("refresh() 때 저장한 최신 JSON을, Redis와 DB가 모두 죽으면 돌려준다")
    @SuppressWarnings("unchecked")
    void checkRedisAndDbException(@TempDir Path dir) {
        StringRedisTemplate redis = mock(StringRedisTemplate.class);
        ValueOperations<String, String> valueOps = mock(ValueOperations.class);
        JdbcClient jdbc = mock(JdbcClient.class, RETURNS_DEEP_STUBS);
        when(redis.opsForValue()).thenReturn(valueOps);

        CatalogService service = new CatalogService(jdbc, new ObjectMapper(), redis);
        ReflectionTestUtils.setField(service, "cacheEnabled", true);
        // 테스트가 끝나면 지워지는 임시 폴더에 백업 파일을 둠
        ReflectionTestUtils.setField(service, "fallbackFile", dir.resolve("catalog-fallback.json").toString());

        // 1) 정상일 때 갱신(관리자 수정 등) → 최신본 [{id: 777}]이 파일에 저장됨
        when(jdbc.sql(anyString()).query().listOfRows()).thenReturn(List.of(Map.of("id", 777)));
        service.refresh();

        // 2) 이제 Redis도 DB도 죽음
        when(valueOps.get(anyString())).thenThrow(new RedisConnectionFailureException("redis down"));
        when(jdbc.sql(anyString()).query().listOfRows()).thenThrow(new CannotGetJdbcConnectionException("db down"));

        // 3) 파일에 저장된 최신본이 나와야 함
        assertThat(service.getJson()).contains("\"id\":777");
    }
}
