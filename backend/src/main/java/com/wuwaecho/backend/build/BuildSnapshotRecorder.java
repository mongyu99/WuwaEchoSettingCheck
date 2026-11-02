package com.wuwaecho.backend.build;

import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

/** 저장된 빌드를 버전별 통계용 기록(build_snapshots)으로 남깁니다. */
@Component
@RequiredArgsConstructor
public class BuildSnapshotRecorder {

    /** 시작한 배너가 하나도 없을 때 쓰는 값입니다. */
    static final String UNKNOWN_VERSION = "unknown";

    private final JdbcClient jdbc;
    private final ObjectMapper objectMapper;

    /** 다음 버전 배너가 시작되기 전까지는, 배너 기간이 끝났어도 가장 최근 시작한 배너의 제목을 버전으로 봅니다. */
    public String currentVersion() {
        return jdbc.sql("""
                        SELECT title FROM main_banners
                        WHERE status = 'ACTIVE' AND starts_at <= now()
                        ORDER BY starts_at DESC LIMIT 1
                        """)
                .query(String.class)
                .optional()
                .orElse(UNKNOWN_VERSION);
    }

    public void record(Long userId, CharacterBuild build, String version) {
        // 에코가 없는 빌드는 통계로 볼 내용이 없습니다.
        if (build.getEchoes().isEmpty()) {
            return;
        }
        List<Map<String, Object>> echoSets = build.getEchoSets().stream()
                .map(part -> Map.<String, Object>of("setId", part.getSetId(), "pieceCount", part.getPieceCount()))
                .toList();
        List<Map<String, Object>> echoes = build.getEchoes().stream().map(this::toMap).toList();

        jdbc.sql("""
                        INSERT INTO build_snapshots
                            (user_id, character_id, game_version, weapon_id, main_echo_id, echo_sets, echoes)
                        VALUES (?, ?, ?, ?, ?, CAST(? AS jsonb), CAST(? AS jsonb))
                        ON CONFLICT (user_id, character_id, game_version) DO UPDATE SET
                            weapon_id = EXCLUDED.weapon_id,
                            main_echo_id = EXCLUDED.main_echo_id,
                            echo_sets = EXCLUDED.echo_sets,
                            echoes = EXCLUDED.echoes,
                            saved_at = now()
                        """)
                .params(userId, build.getCharacterId(), version, build.getWeaponId(), build.getMainEchoId(),
                        objectMapper.writeValueAsString(echoSets), objectMapper.writeValueAsString(echoes))
                .update();
    }

    private Map<String, Object> toMap(BuildEcho echo) {
        List<Map<String, Object>> stats = echo.getStats().stream()
                .filter(stat -> stat.getLabel() != null)
                .map(stat -> {
                    Map<String, Object> row = new java.util.LinkedHashMap<>();
                    row.put("kind", stat.getKind().name());
                    row.put("label", stat.getLabel());
                    row.put("value", stat.getValue());
                    row.put("percent", stat.isPercent());
                    return row;
                })
                .toList();
        Map<String, Object> row = new java.util.LinkedHashMap<>();
        row.put("slot", echo.getSlot());
        row.put("cost", echo.getCost());
        row.put("stats", stats);
        return row;
    }
}
