package com.wuwaecho.backend.build;

import com.wuwaecho.backend.build.CharacterStatePayload.BaseStats;
import com.wuwaecho.backend.build.CharacterStatePayload.Echo;
import com.wuwaecho.backend.build.CharacterStatePayload.EchoPart;
import com.wuwaecho.backend.build.CharacterStatePayload.Stat;
import com.wuwaecho.backend.user.User;
import com.wuwaecho.backend.user.UserRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.core.JacksonException;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

/**
 * 프론트는 characterData 전체를 JSON 문자열 하나로 주고받고, DB에는 정규화된 테이블로 나눠 저장합니다.
 * 이 클래스가 그 둘 사이를 변환합니다.
 */
@Service
@RequiredArgsConstructor
public class CharacterStateService {

    private static final int MAX_ECHOES = 5;
    private static final int MAX_ID_LENGTH = 50;
    private static final int MAX_LABEL_LENGTH = 50;
    private static final Set<Integer> VALID_COSTS = Set.of(1, 3, 4);

    private final CharacterBuildRepository buildRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public String load(Long userId) {
        List<CharacterBuild> builds = buildRepository.findByUserIdOrderByCharacterIdAsc(userId);
        if (builds.isEmpty()) {
            return null;
        }
        Map<String, Object> characterData = new LinkedHashMap<>();
        for (CharacterBuild build : builds) {
            characterData.put(build.getCharacterId(), toRecordJson(build));
        }
        return objectMapper.writeValueAsString(characterData);
    }

    @Transactional
    public void save(Long userId, String dataJson) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        Map<String, CharacterStatePayload.Record> incoming = parse(dataJson);

        Map<String, CharacterBuild> existing = buildRepository.findByUserIdOrderByCharacterIdAsc(userId).stream()
                .collect(Collectors.toMap(CharacterBuild::getCharacterId, Function.identity()));

        // Hibernate는 flush 때 INSERT를 DELETE보다 먼저 실행해서, 같은 (build_id, slot)을 바로 다시 넣으면
        // 유니크 제약에 걸립니다. 그래서 기존 자식 행을 먼저 지우고 flush한 뒤에 새로 채웁니다.
        existing.forEach((characterId, build) -> {
            if (incoming.containsKey(characterId)) {
                build.getEchoes().clear();
                build.getEchoSets().clear();
            } else {
                buildRepository.delete(build);
            }
        });
        buildRepository.flush();

        OffsetDateTime now = OffsetDateTime.now();
        incoming.forEach((characterId, record) -> {
            CharacterBuild build = existing.get(characterId);
            if (build == null) {
                build = new CharacterBuild(user, characterId);
            }
            applyRecord(build, record);
            build.setUpdatedAt(now);
            buildRepository.save(build);
        });
    }

    private Map<String, CharacterStatePayload.Record> parse(String dataJson) {
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

    private void applyRecord(CharacterBuild build, CharacterStatePayload.Record record) {
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

    private void addStats(BuildEcho echo, EchoStat.Kind kind, List<Stat> stats) {
        if (stats == null) {
            return;
        }
        for (int i = 0; i < stats.size(); i++) {
            Stat stat = stats.get(i);
            String label = stat == null || stat.label() == null ? "" : truncate(stat.label(), MAX_LABEL_LENGTH);
            String valueText = stat == null || stat.valueText() == null ? "" : stat.valueText().trim();
            boolean percent = valueText.endsWith("%");
            BigDecimal value = parseDecimal(percent ? valueText.substring(0, valueText.length() - 1) : valueText);
            boolean highlighted = stat != null && Boolean.TRUE.equals(stat.highlighted());
            echo.addStat(new EchoStat(kind, (short) i, label, value, percent, highlighted));
        }
    }

    private Map<String, Object> toRecordJson(CharacterBuild build) {
        List<Map<String, Object>> echoes = new ArrayList<>();
        for (BuildEcho echo : build.getEchoes()) {
            String echoKey = "cloud-" + echo.getId();
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
            json.put("label", stat.getLabel());
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
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "id가 너무 길어요: " + truncate(id, 20));
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

    private static String truncate(String text, int maxLength) {
        return text.length() <= maxLength ? text : text.substring(0, maxLength);
    }
}
