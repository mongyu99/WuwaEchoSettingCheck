package com.wuwaecho.backend.catalog;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.locks.ReentrantLock;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.dao.DataAccessException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import tools.jackson.databind.ObjectMapper;

/**
 * 게임 기준 데이터(catalog)를 Redis에 JSON 문자열 하나로 캐시합니다. 캐시 스탬피드(만료 순간 요청이 DB로
 * 몰리는 현상)를 피하려고:
 * <ul>
 *   <li>서버 시작 시 미리 채우고(preload), 만료 시간(TTL)을 두지 않습니다.</li>
 *   <li>데이터가 바뀌면 지우지 않고 새 값으로 덮어씁니다(refresh). 지웠다 채우는 사이의 빈 구간이 없습니다.</li>
 *   <li>Redis가 재시작돼 캐시가 비었을 때만, 요청 하나가 DB를 읽고 나머지는 그 결과를 기다립니다(락).</li>
 * </ul>
 * Redis에 접속할 수 없으면 DB에서 바로 읽어 응답합니다(캐시 없이도 사이트는 동작). DB까지 실패하면
 * 마지막 refresh() 때 저장해 둔 로컬 JSON 파일로 응답합니다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CatalogService implements ApplicationRunner {

    static final String CACHE_KEY = "catalog:v1";

    private static final String VISIBLE = " WHERE status <> 'HIDDEN' ORDER BY sort_order, id";

    private static final Map<String, String> QUERIES = Map.ofEntries(
            Map.entry("characters", "SELECT * FROM chara_info" + VISIBLE),
            Map.entry("weapons", "SELECT * FROM weapon_info" + VISIBLE),
            Map.entry("echoes", "SELECT * FROM echo_info" + VISIBLE),
            Map.entry("echoSets", "SELECT * FROM echo_set_info" + VISIBLE),
            Map.entry("innateBonuses", "SELECT * FROM chara_innate_bonus ORDER BY chara_id, sort_order"),
            Map.entry("validOptions", "SELECT * FROM chara_valid_option ORDER BY chara_id, sort_order"),
            Map.entry("recommendedWeapons", "SELECT * FROM chara_recommended_weapon ORDER BY chara_id, sort_order"),
            Map.entry("echoComboParts",
                    "SELECT * FROM chara_echo_combo_part ORDER BY chara_id, combo_no, sort_order"),
            Map.entry("weaponBonuses", "SELECT * FROM weapon_bonus ORDER BY weapon_id, sort_order"),
            Map.entry("echoSetEffects", "SELECT * FROM echo_set_effect ORDER BY set_id, piece_count"),
            Map.entry("echoBonuses", "SELECT * FROM echo_bonus ORDER BY echo_id, sort_order"),
            Map.entry("echoCharaBonuses", "SELECT * FROM echo_chara_bonus ORDER BY echo_id, chara_id, sort_order"),
            Map.entry("echoCharaDescriptions", "SELECT * FROM echo_chara_description ORDER BY echo_id, chara_id"),
            Map.entry("echoSetMainEchoes", "SELECT * FROM echo_set_main_echo ORDER BY set_id, sort_order"));

    private final JdbcClient jdbc;
    private final ObjectMapper objectMapper;
    private final StringRedisTemplate redis;
    private final ReentrantLock loadLock = new ReentrantLock();

    @Value("${app.catalog.preload:true}")
    private boolean preload;

    /** false면 Redis를 쓰지 않고 매 요청 DB에서 읽습니다(캐시 효과 비교 측정용). */
    @Value("${app.catalog.cache-enabled:true}")
    private boolean cacheEnabled;

    /**
     * Redis와 DB가 모두 죽었을 때 읽는 마지막 정상 데이터. 캐시를 갱신하는 refresh()(서버 시작, 관리자 수정)마다
     * 최신본으로 덮어씁니다.
     */
    @Value("${app.catalog.fallback-file:catalog-fallback.json}")
    private String fallbackFile = "catalog-fallback.json";

    @Override
    public void run(ApplicationArguments args) {
        if (preload && cacheEnabled) {
            refresh();
        }
    }

    /**
     * 캐시된 JSON을 돌려줍니다. 비어 있으면 한 요청만 DB를 읽어 채우고, 나머지는 기다렸다가 같은 값을 받습니다.
     * Redis가 죽으면 DB에서, DB까지 죽으면 마지막으로 저장해 둔 로컬 JSON 파일에서 읽습니다.
     */
    public String getJson() {
        if (!cacheEnabled) {
            return loadJsonOrFallback();
        }
        String cached;
        try {
            cached = readCache();
        } catch (RuntimeException e) {
            return loadJsonOrFallback();
        }
        if (cached != null) {
            return cached;
        }
        loadLock.lock();
        try {
            try {
                cached = readCache();
            } catch (RuntimeException e) {
                return loadJsonOrFallback();
            }
            if (cached != null) {
                return cached;
            }
            try {
                return refresh();
            } catch (DataAccessException e) {
                // 파일 데이터는 오래됐을 수 있어 Redis에 넣지 않습니다(TTL이 없어 계속 남음).
                return readFallbackFile(e);
            }
        } finally {
            loadLock.unlock();
        }
    }

    /**
     * DB에서 새로 읽어 캐시와 로컬 JSON 파일을 덮어씁니다. 관리자 페이지에서 데이터를 바꾼 직후 호출합니다.
     * DB 실패는 그대로 던집니다(관리자가 반영 실패를 알아야 함).
     */
    public String refresh() {
        String json = objectMapper.writeValueAsString(loadFromDb());
        try {
            redis.opsForValue().set(CACHE_KEY, json);
        } catch (RuntimeException e) {
            log.warn("catalog 캐시 저장 실패(Redis 연결 확인 필요): {}", e.getMessage());
        }
        saveFallbackFile(json);
        return json;
    }

    /** Redis를 거치지 않고 DB에서 읽습니다. DB도 실패하면 로컬 JSON 파일을 읽습니다. */
    private String loadJsonOrFallback() {
        try {
            return objectMapper.writeValueAsString(loadFromDb());
        } catch (DataAccessException e) {
            return readFallbackFile(e);
        }
    }

    /** 쓰다 만 파일이 읽히지 않도록 임시 파일에 쓴 뒤 한 번에 바꿔치기합니다. */
    private void saveFallbackFile(String json) {
        Path target = Path.of(fallbackFile);
        Path tmp = target.resolveSibling(target.getFileName() + ".tmp");
        try {
            Files.writeString(tmp, json);
            Files.move(tmp, target, StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE);
        } catch (IOException e) {
            log.warn("catalog 로컬 백업 파일 저장 실패: {}", e.getMessage());
        }
    }

    private String readFallbackFile(DataAccessException dbError) {
        log.warn("catalog DB 조회 실패, 로컬 백업 파일에서 읽습니다: {}", dbError.getMessage());
        try {
            return Files.readString(Path.of(fallbackFile));
        } catch (IOException e) {
            IllegalStateException failure =
                    new IllegalStateException("catalog를 DB와 로컬 백업 파일 모두에서 읽지 못했습니다", dbError);
            failure.addSuppressed(e);
            throw failure;
        }
    }

    private String readCache() {
        try {
            return redis.opsForValue().get(CACHE_KEY);
        } catch (RuntimeException e) {
            log.warn("catalog 캐시 조회 실패 : {}", e.getMessage());
            throw e;
        }
    }

    private Map<String, List<Map<String, Object>>> loadFromDb() {
        Map<String, List<Map<String, Object>>> result = new LinkedHashMap<>();
        QUERIES.forEach((key, sql) -> result.put(key, jdbc.sql(sql).query().listOfRows()));
        return result;
    }
}
