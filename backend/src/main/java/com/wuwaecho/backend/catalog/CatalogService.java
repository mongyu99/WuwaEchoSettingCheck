package com.wuwaecho.backend.catalog;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.locks.ReentrantLock;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
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
 * Redis에 접속할 수 없으면 DB에서 바로 읽어 응답합니다(캐시 없이도 사이트는 동작).
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

    @Override
    public void run(ApplicationArguments args) {
        if (preload && cacheEnabled) {
            refresh();
        }
    }

    /** 캐시된 JSON을 돌려줍니다. 비어 있으면 한 요청만 DB를 읽어 채우고, 나머지는 기다렸다가 같은 값을 받습니다. */
    public String getJson() {
        if (!cacheEnabled) {
            return objectMapper.writeValueAsString(loadFromDb());
        }
        String cached = readCache();
        if (cached != null) {
            return cached;
        }
        loadLock.lock();
        try {
            cached = readCache();
            return cached != null ? cached : refresh();
        } finally {
            loadLock.unlock();
        }
    }

    /** DB에서 새로 읽어 캐시를 덮어씁니다. 관리자 페이지에서 데이터를 바꾼 직후 호출합니다. */
    public String refresh() {
        String json = objectMapper.writeValueAsString(loadFromDb());
        try {
            redis.opsForValue().set(CACHE_KEY, json);
        } catch (RuntimeException e) {
            log.warn("catalog 캐시 저장 실패(Redis 연결 확인 필요): {}", e.getMessage());
        }
        return json;
    }

    private String readCache() {
        try {
            return redis.opsForValue().get(CACHE_KEY);
        } catch (RuntimeException e) {
            log.warn("catalog 캐시 조회 실패, DB에서 직접 읽습니다: {}", e.getMessage());
            return null;
        }
    }

    private Map<String, List<Map<String, Object>>> loadFromDb() {
        Map<String, List<Map<String, Object>>> result = new LinkedHashMap<>();
        QUERIES.forEach((key, sql) -> result.put(key, jdbc.sql(sql).query().listOfRows()));
        return result;
    }
}
