package com.wuwaecho.backend.build;

import com.wuwaecho.backend.build.CharacterStatePayload.BaseStats;
import com.wuwaecho.backend.build.CharacterStatePayload.Echo;
import com.wuwaecho.backend.build.CharacterStatePayload.EchoPart;
import com.wuwaecho.backend.build.CharacterStatePayload.Stat;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.core.JacksonException;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

/**
 * 프론트의 characterData JSON과 엔티티 사이를 변환합니다. DB에 접근하지 않으므로 insert 전 단계만
 * 따로 단위 테스트할 수 있습니다.
 */
@Component
@RequiredArgsConstructor
public class CharacterStateMapper {

    private static final int MAX_ECHOES = 5;
    private static final int MAX_ID_LENGTH = 50;
    private static final Set<Integer> VALID_COSTS = Set.of(1, 3, 4);

    private final ObjectMapper objectMapper;
    private final StatCatalog statCatalog;

    public Map<String, CharacterStatePayload.Record> parse(String dataJson) {
        try {
            Map<String, Object> raw = objectMapper.readValue(dataJson, new TypeReference<Map<String, Object>>() {
            });
            Map<String, CharacterStatePayload.Record> result = new LinkedHashMap<>();
            raw.forEach((characterId, value) -> {
                requireIdLength(characterId);
                if (value == null) {
                    return;
                }
                // 예전 저장 형식은 캐릭터마다 에코 배열만 들고 있었습니다(App.jsx의 normalizeRecord와 동일한 호환).
                CharacterStatePayload.Record record = value instanceof List<?> legacyEchoes
                        ? new CharacterStatePayload.Record(
                                objectMapper.convertValue(legacyEchoes, new TypeReference<List<Echo>>() {
                                }),
                                null, null, null, null)
                        : objectMapper.convertValue(value, CharacterStatePayload.Record.class);
                result.put(characterId, record);
            });
            return result;
        } catch (JacksonException | IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "저장 데이터 형식이 올바르지 않아요.", e);
        }
    }

    /** build의 자식(에코·세트)은 비어 있다고 가정하고 record 내용으로 채웁니다. */
    public void applyRecord(CharacterBuild build, CharacterStatePayload.Record record) {
        build.setWeaponId(requireIdLength(record.weapon()));
        build.setMainEchoId(requireIdLength(record.mainEchoId()));

        build.setEchoSetsCustomized(record.echoParts() != null);
        if (record.echoParts() != null) {
            Set<String> seenSetIds = new LinkedHashSet<>();
            for (EchoPart part : record.echoParts()) {
                if (part == null || part.setId() == null || part.pieceCount() == null || part.pieceCount() <= 0) {
                    continue;
                }
                if (seenSetIds.add(requireIdLength(part.setId()))) {
                    build.getEchoSets().add(new EchoSetPart(part.setId(), part.pieceCount().shortValue()));
                }
            }
        }

        BaseStats baseStats = record.baseStats();
        if (baseStats != null) {
            build.setBaseCharAtk(parseDecimal(baseStats.charAtk()));
            build.setBaseWeaponAtk(parseDecimal(baseStats.weaponAtk()));
            build.setBaseHp(parseDecimal(baseStats.baseHp()));
            build.setBaseDef(parseDecimal(baseStats.baseDef()));
        }

        List<Echo> echoes = record.echoes() == null ? List.of() : record.echoes();
        if (echoes.size() > MAX_ECHOES) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "에코는 최대 " + MAX_ECHOES + "개까지 저장할 수 있어요.");
        }
        for (int i = 0; i < echoes.size(); i++) {
            Echo echo = echoes.get(i);
            Short cost = echo != null && echo.cost() != null && VALID_COSTS.contains(echo.cost())
                    ? echo.cost().shortValue()
                    : null;
            BuildEcho buildEcho = new BuildEcho((short) i, cost);
            if (echo != null) {
                addStats(buildEcho, EchoStat.Kind.MAIN, echo.mainStats());
                addStats(buildEcho, EchoStat.Kind.SUB, echo.subStats());
            }
            build.addEcho(buildEcho);
        }
    }

    public String toJson(List<CharacterBuild> builds) {
        Map<String, Object> characterData = new LinkedHashMap<>();
        for (CharacterBuild build : builds) {
            characterData.put(build.getCharacterId(), toRecordJson(build));
        }
        return objectMapper.writeValueAsString(characterData);
    }

    /**
     * 화이트리스트에 없는 라벨(OCR 오인식 등)은 라벨·수치를 모두 비우고, 서브옵션 단계값에 없는 수치는
     * 수치만 비웁니다. 저장 전체를 거부하지 않고 그 칸만 빈 옵션으로 남겨 사용자가 다시 고르게 합니다.
     * 자리(slot)는 유지해서 에코의 옵션 순서가 밀리지 않게 합니다.
     */
    private void addStats(BuildEcho echo, EchoStat.Kind kind, List<Stat> stats) {
        if (stats == null) {
            return;
        }
        for (int i = 0; i < stats.size(); i++) {
            Stat stat = stats.get(i);
            String rawLabel = stat == null || stat.label() == null ? "" : stat.label().trim();
            String label = statCatalog.isAllowedLabel(kind, rawLabel) ? rawLabel : null;

            String valueText = stat == null || stat.valueText() == null ? "" : stat.valueText().trim();
            boolean percent = valueText.endsWith("%");
            BigDecimal value = label == null
                    ? null
                    : parseDecimal(percent ? valueText.substring(0, valueText.length() - 1) : valueText);
            if (value != null && kind == EchoStat.Kind.SUB && !statCatalog.isAllowedSubValue(label, value)) {
                value = null;
            }

            boolean highlighted = stat != null && Boolean.TRUE.equals(stat.highlighted());
            echo.addStat(new EchoStat(kind, (short) i, label, value, value != null && percent, highlighted));
        }
    }

    private Map<String, Object> toRecordJson(CharacterBuild build) {
        List<Map<String, Object>> echoes = new ArrayList<>();
        for (BuildEcho echo : build.getEchoes()) {
            String echoKey = "cloud-" + (echo.getId() != null ? echo.getId() : "s" + echo.getSlot());
            Map<String, Object> echoJson = new LinkedHashMap<>();
            echoJson.put("id", echoKey);
            echoJson.put("previewUrl", null);
            echoJson.put("cost", echo.getCost() == null ? null : echo.getCost().intValue());
            echoJson.put("mainStats", statsJson(echo, EchoStat.Kind.MAIN, echoKey));
            echoJson.put("subStats", statsJson(echo, EchoStat.Kind.SUB, echoKey));
            echoJson.put("failed", false);
            echoes.add(echoJson);
        }

        Map<String, Object> baseStats = new LinkedHashMap<>();
        baseStats.put("charAtk", formatDecimal(build.getBaseCharAtk()));
        baseStats.put("weaponAtk", formatDecimal(build.getBaseWeaponAtk()));
        baseStats.put("baseHp", formatDecimal(build.getBaseHp()));
        baseStats.put("baseDef", formatDecimal(build.getBaseDef()));

        List<Map<String, Object>> echoParts = null;
        if (build.isEchoSetsCustomized()) {
            echoParts = build.getEchoSets().stream()
                    .map(part -> Map.<String, Object>of("setId", part.getSetId(), "pieceCount", (int) part.getPieceCount()))
                    .toList();
        }

        Map<String, Object> record = new LinkedHashMap<>();
        record.put("echoes", echoes);
        record.put("weapon", build.getWeaponId());
        record.put("echoParts", echoParts);
        record.put("mainEchoId", build.getMainEchoId());
        record.put("baseStats", baseStats);
        return record;
    }

    private List<Map<String, Object>> statsJson(BuildEcho echo, EchoStat.Kind kind, String echoKey) {
        List<Map<String, Object>> result = new ArrayList<>();
        for (EchoStat stat : echo.getStats()) {
            if (stat.getKind() != kind) {
                continue;
            }
            Map<String, Object> json = new LinkedHashMap<>();
            json.put("id", echoKey + "-" + kind.name().toLowerCase() + "-" + stat.getSlot());
            json.put("label", stat.getLabel() == null ? "" : stat.getLabel());
            String number = formatDecimal(stat.getValue());
            json.put("valueText", number.isEmpty() ? "" : number + (stat.isPercent() ? "%" : ""));
            if (kind == EchoStat.Kind.SUB) {
                json.put("highlighted", stat.isHighlighted());
            }
            result.add(json);
        }
        return result;
    }

    private static String requireIdLength(String id) {
        if (id != null && id.length() > MAX_ID_LENGTH) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "id가 너무 길어요: " + id.substring(0, 20));
        }
        return id;
    }

    private static BigDecimal parseDecimal(String text) {
        if (text == null || text.isBlank()) {
            return null;
        }
        try {
            BigDecimal value = new BigDecimal(text.trim()).setScale(2, RoundingMode.HALF_UP);
            // NUMERIC(8,2) 범위를 넘는 OCR 오인식 값은 버립니다.
            return value.abs().compareTo(new BigDecimal("999999.99")) > 0 ? null : value;
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private static String formatDecimal(BigDecimal value) {
        return value == null ? "" : value.stripTrailingZeros().toPlainString();
    }
}
