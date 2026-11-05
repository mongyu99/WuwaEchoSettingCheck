package com.wuwaecho.backend.catalog;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.RETURNS_DEEP_STUBS;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;
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
        StringRedisTemplate redis = mock(StringRedisTemplate.class);
        ValueOperations<String, String> valueOps = mock(ValueOperations.class);
        JdbcClient jdbc = mock(JdbcClient.class, RETURNS_DEEP_STUBS);
        ObjectMapper objectMapper = new ObjectMapper();

        when(redis.opsForValue()).thenReturn(valueOps);
        when(valueOps.get(anyString())).thenThrow(new RedisConnectionFailureException("redis down"));
        when(jdbc.sql(anyString()).query().listOfRows()).thenReturn(List.of(Map.of("id", 999)));

        CatalogService service = new CatalogService(jdbc, objectMapper, redis);
        ReflectionTestUtils.setField(service, "cacheEnabled", true);

        String json = service.getJson();

        assertThat(json).contains("\"id\":999");

        verify(valueOps, times(1)).get(CatalogService.CACHE_KEY);
        verify(valueOps, never()).set(any(), any());
    }

    @Test
    @DisplayName("백업해 둔 최신 JSON을, Redis와 DB가 모두 죽으면 돌려준다")
    @SuppressWarnings("unchecked")
    void checkRedisAndDbException(@TempDir Path dir) {
        StringRedisTemplate redis = mock(StringRedisTemplate.class);
        ValueOperations<String, String> valueOps = mock(ValueOperations.class);
        JdbcClient jdbc = mock(JdbcClient.class, RETURNS_DEEP_STUBS);
        when(redis.opsForValue()).thenReturn(valueOps);

        CatalogService service = new CatalogService(jdbc, new ObjectMapper(), redis);
        ReflectionTestUtils.setField(service, "cacheEnabled", true);
        ReflectionTestUtils.setField(service, "fallbackFile", dir.resolve("catalog-fallback.json").toString());

        when(valueOps.get(anyString())).thenReturn("[{\"id\":777}]");
        service.backupToFile();

        when(valueOps.get(anyString())).thenThrow(new RedisConnectionFailureException("redis down"));
        when(jdbc.sql(anyString()).query().listOfRows()).thenThrow(new CannotGetJdbcConnectionException("db down"));

        assertThat(service.getJson()).contains("\"id\":777");
    }

    @Test
    @DisplayName("Redis·DB가 죽고 백업 파일도 없으면 CatalogUnavailableException(→ 503 점검 중)을 던진다")
    @SuppressWarnings("unchecked")
    void checkAllUnavailable(@TempDir Path dir) {
        StringRedisTemplate redis = mock(StringRedisTemplate.class);
        ValueOperations<String, String> valueOps = mock(ValueOperations.class);
        JdbcClient jdbc = mock(JdbcClient.class, RETURNS_DEEP_STUBS);
        when(redis.opsForValue()).thenReturn(valueOps);
        when(valueOps.get(anyString())).thenThrow(new RedisConnectionFailureException("redis down"));
        when(jdbc.sql(anyString()).query().listOfRows()).thenThrow(new CannotGetJdbcConnectionException("db down"));

        CatalogService service = new CatalogService(jdbc, new ObjectMapper(), redis);
        ReflectionTestUtils.setField(service, "cacheEnabled", true);
        ReflectionTestUtils.setField(service, "fallbackFile", dir.resolve("none.json").toString());

        assertThatThrownBy(service::getJson).isInstanceOf(CatalogUnavailableException.class);
    }

    @Test
    @DisplayName("캐시가 있으면 DB를 읽지 않는다")
    @SuppressWarnings("unchecked")
    void cacheHitSkipsDb() {
        StringRedisTemplate redis = mock(StringRedisTemplate.class);
        ValueOperations<String, String> valueOps = mock(ValueOperations.class);
        JdbcClient jdbc = mock(JdbcClient.class);
        when(redis.opsForValue()).thenReturn(valueOps);
        when(valueOps.get(CatalogService.CACHE_KEY)).thenReturn("{\"cached\":true}");

        CatalogService service = new CatalogService(jdbc, new ObjectMapper(), redis);
        ReflectionTestUtils.setField(service, "cacheEnabled", true);

        assertThat(service.getJson()).isEqualTo("{\"cached\":true}");
        verifyNoInteractions(jdbc);
    }

    @Test
    @DisplayName("캐시가 비어 있으면 DB를 읽어 Redis에 저장한다")
    @SuppressWarnings("unchecked")
    void cacheMissLoadsAndStores(@TempDir Path dir) {
        StringRedisTemplate redis = mock(StringRedisTemplate.class);
        ValueOperations<String, String> valueOps = mock(ValueOperations.class);
        JdbcClient jdbc = mock(JdbcClient.class, RETURNS_DEEP_STUBS);
        when(redis.opsForValue()).thenReturn(valueOps);
        when(jdbc.sql(anyString()).query().listOfRows()).thenReturn(List.of(Map.of("id", 1)));

        CatalogService service = new CatalogService(jdbc, new ObjectMapper(), redis);
        ReflectionTestUtils.setField(service, "cacheEnabled", true);
        ReflectionTestUtils.setField(service, "fallbackFile", dir.resolve("catalog-fallback.json").toString());

        String json = service.getJson();

        assertThat(json).contains("\"id\":1");
        verify(valueOps).set(CatalogService.CACHE_KEY, json);
    }

    @Test
    @DisplayName("cache-enabled=false면 Redis를 호출하지 않는다")
    void cacheDisabledSkipsRedis() {
        StringRedisTemplate redis = mock(StringRedisTemplate.class);
        JdbcClient jdbc = mock(JdbcClient.class, RETURNS_DEEP_STUBS);
        when(jdbc.sql(anyString()).query().listOfRows()).thenReturn(List.of(Map.of("id", 1)));

        CatalogService service = new CatalogService(jdbc, new ObjectMapper(), redis);

        assertThat(service.getJson()).contains("\"id\":1");
        verifyNoInteractions(redis);
    }

    @Test
    @DisplayName("캐시가 빈 상태에서 동시 요청 50개가 들어와도 DB는 한 번만 읽는다")
    @SuppressWarnings("unchecked")
    void concurrentMissLoadsDbOnce(@TempDir Path dir) throws Exception {
        int oneLoadQueries = countQueriesOfOneLoad(dir.resolve("baseline.json"));

        AtomicReference<String> cache = new AtomicReference<>();
        AtomicInteger queries = new AtomicInteger();
        StringRedisTemplate redis = mock(StringRedisTemplate.class);
        ValueOperations<String, String> valueOps = mock(ValueOperations.class);
        JdbcClient jdbc = mock(JdbcClient.class, RETURNS_DEEP_STUBS);
        when(redis.opsForValue()).thenReturn(valueOps);
        when(valueOps.get(anyString())).thenAnswer(call -> cache.get());
        doAnswer(call -> {
            cache.set(call.getArgument(1));
            return null;
        }).when(valueOps).set(anyString(), anyString());
        when(jdbc.sql(anyString()).query().listOfRows()).thenAnswer(call -> {
            queries.incrementAndGet();
            Thread.sleep(5);
            return List.of(Map.of("id", 1));
        });

        CatalogService service = new CatalogService(jdbc, new ObjectMapper(), redis);
        ReflectionTestUtils.setField(service, "cacheEnabled", true);
        ReflectionTestUtils.setField(service, "fallbackFile", dir.resolve("catalog-fallback.json").toString());

        int requests = 50;
        ExecutorService pool = Executors.newFixedThreadPool(requests);
        CountDownLatch ready = new CountDownLatch(requests);
        CountDownLatch start = new CountDownLatch(1);
        List<Future<String>> results = new ArrayList<>();
        try {
            for (int i = 0; i < requests; i++) {
                results.add(pool.submit(() -> {
                    ready.countDown();
                    start.await();
                    return service.getJson();
                }));
            }
            assertThat(ready.await(5, TimeUnit.SECONDS)).isTrue();
            start.countDown();
            for (Future<String> result : results) {
                assertThat(result.get(10, TimeUnit.SECONDS)).contains("\"id\":1");
            }
        } finally {
            pool.shutdownNow();
        }

        verify(valueOps, times(1)).set(anyString(), anyString());
        assertThat(queries.get()).isEqualTo(oneLoadQueries);
    }

    @Test
    @DisplayName("캐시를 갱신해도 백업 파일은 바로 쓰지 않는다")
    @SuppressWarnings("unchecked")
    void refreshDoesNotWriteFile(@TempDir Path dir) {
        Path file = dir.resolve("catalog-fallback.json");
        StringRedisTemplate redis = mock(StringRedisTemplate.class);
        when(redis.opsForValue()).thenReturn(mock(ValueOperations.class));
        JdbcClient jdbc = mock(JdbcClient.class, RETURNS_DEEP_STUBS);
        when(jdbc.sql(anyString()).query().listOfRows()).thenReturn(List.of(Map.of("id", 1)));

        CatalogService service = new CatalogService(jdbc, new ObjectMapper(), redis);
        ReflectionTestUtils.setField(service, "fallbackFile", file.toString());
        service.refresh();

        assertThat(file).doesNotExist();
    }

    @Test
    @DisplayName("백업 파일이 캐시와 다르면 캐시 값으로 맞춘다")
    @SuppressWarnings("unchecked")
    void syncRewritesStaleFile(@TempDir Path dir) throws Exception {
        Path file = dir.resolve("catalog-fallback.json");
        Files.writeString(file, "{\"old\":true}");
        StringRedisTemplate redis = mock(StringRedisTemplate.class);
        ValueOperations<String, String> valueOps = mock(ValueOperations.class);
        JdbcClient jdbc = mock(JdbcClient.class);
        when(redis.opsForValue()).thenReturn(valueOps);
        when(valueOps.get(CatalogService.CACHE_KEY)).thenReturn("{\"new\":true}");

        CatalogService service = new CatalogService(jdbc, new ObjectMapper(), redis);
        ReflectionTestUtils.setField(service, "cacheEnabled", true);
        ReflectionTestUtils.setField(service, "fallbackFile", file.toString());

        service.backupToFile();

        assertThat(Files.readString(file)).isEqualTo("{\"new\":true}");
        verifyNoInteractions(jdbc);
    }

    @Test
    @DisplayName("캐시를 읽지 못하면 백업 파일을 건드리지 않는다")
    @SuppressWarnings("unchecked")
    void syncKeepsFileWhenRedisDown(@TempDir Path dir) throws Exception {
        Path file = dir.resolve("catalog-fallback.json");
        Files.writeString(file, "{\"old\":true}");
        StringRedisTemplate redis = mock(StringRedisTemplate.class);
        ValueOperations<String, String> valueOps = mock(ValueOperations.class);
        when(redis.opsForValue()).thenReturn(valueOps);
        when(valueOps.get(anyString())).thenThrow(new RedisConnectionFailureException("redis down"));

        CatalogService service = new CatalogService(mock(JdbcClient.class), new ObjectMapper(), redis);
        ReflectionTestUtils.setField(service, "cacheEnabled", true);
        ReflectionTestUtils.setField(service, "fallbackFile", file.toString());

        service.backupToFile();

        assertThat(Files.readString(file)).isEqualTo("{\"old\":true}");
    }

    /** 카탈로그를 한 번 읽을 때 나가는 쿼리 수입니다(테이블 수가 바뀌어도 테스트를 고치지 않도록 직접 잽니다). */
    @SuppressWarnings("unchecked")
    private int countQueriesOfOneLoad(Path file) {
        AtomicInteger queries = new AtomicInteger();
        StringRedisTemplate redis = mock(StringRedisTemplate.class);
        when(redis.opsForValue()).thenReturn(mock(ValueOperations.class));
        JdbcClient jdbc = mock(JdbcClient.class, RETURNS_DEEP_STUBS);
        when(jdbc.sql(anyString()).query().listOfRows()).thenAnswer(call -> {
            queries.incrementAndGet();
            return List.of(Map.of("id", 1));
        });
        CatalogService service = new CatalogService(jdbc, new ObjectMapper(), redis);
        ReflectionTestUtils.setField(service, "fallbackFile", file.toString());
        service.refresh();
        return queries.get();
    }
}
