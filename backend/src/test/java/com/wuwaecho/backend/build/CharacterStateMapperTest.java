package com.wuwaecho.backend.build;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.wuwaecho.backend.user.User;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.json.JsonMapper;

/** DB 없이 insert 직전 단계(JSON → 엔티티)와 조회 결과 변환(엔티티 → JSON)만 검사합니다. */
class CharacterStateMapperTest {

    private static final StatCatalog CATALOG = new StatCatalog(
            Map.of(
                    EchoStat.Kind.MAIN, Set.of("크리티컬", "공격력", "HP"),
                    EchoStat.Kind.SUB, Set.of("크리티컬%", "공격력%", "공격력", "HP")),
            Map.of(
                    "크리티컬%", Set.of(new BigDecimal("6.3"), new BigDecimal("10.5")),
                    "공격력%", Set.of(new BigDecimal("6.4"), new BigDecimal("10.9"), new BigDecimal("11.6")),
                    "공격력", Set.of(new BigDecimal("30"), new BigDecimal("50")),
                    "HP", Set.of(new BigDecimal("430"))));

    private final CharacterStateMapper mapper = new CharacterStateMapper(JsonMapper.builder().build(), CATALOG);

    @Test
    void buildFieldsAreMapped() {
        CharacterBuild build = convert("""
                {"echoes": [], "weapon": "verdant-summit", "mainEchoId": "feilian",
                 "echoParts": [{"setId": "sierra-gale", "pieceCount": 5}],
                 "baseStats": {"charAtk": "412.5", "weaponAtk": "", "baseHp": "10375", "baseDef": "abc"}}
                """);

        assertThat(build.getWeaponId()).isEqualTo("verdant-summit");
        assertThat(build.getMainEchoId()).isEqualTo("feilian");
        assertThat(build.isEchoSetsCustomized()).isTrue();
        assertThat(build.getEchoSets()).extracting(EchoSetPart::getSetId, EchoSetPart::getPieceCount)
                .containsExactly(org.assertj.core.groups.Tuple.tuple("sierra-gale", (short) 5));
        assertThat(build.getBaseCharAtk()).isEqualByComparingTo("412.5");
        assertThat(build.getBaseWeaponAtk()).as("빈 문자열 → null").isNull();
        assertThat(build.getBaseHp()).isEqualByComparingTo("10375");
        assertThat(build.getBaseDef()).as("숫자가 아니면 null").isNull();
    }

    @Test
    void echoesAndStatsAreMappedInOrder() {
        CharacterBuild build = convert("""
                {"echoes": [
                  {"cost": 4,
                   "mainStats": [{"label": "크리티컬", "valueText": "22%"}],
                   "subStats": [
                     {"label": "공격력%", "valueText": "10.9%", "highlighted": true},
                     {"label": "공격력", "valueText": "50"},
                     {"label": "", "valueText": ""}
                   ]},
                  {"cost": 1}
                ]}
                """);

        assertThat(build.getEchoes()).extracting(BuildEcho::getSlot, BuildEcho::getCost)
                .containsExactly(org.assertj.core.groups.Tuple.tuple((short) 0, (short) 4),
                        org.assertj.core.groups.Tuple.tuple((short) 1, (short) 1));
        assertThat(describe(build.getEchoes().getFirst())).containsExactly(
                "MAIN0 크리티컬 22 pct=true hl=false",
                "SUB0 공격력% 10.9 pct=true hl=true",
                "SUB1 공격력 50 pct=false hl=false",
                "SUB2 null null pct=false hl=false");
    }

    @Test
    void labelsOutsideWhitelistAreClearedButSlotIsKept() {
        CharacterBuild build = convert("""
                {"echoes": [{
                  "mainStats": [{"label": "크리티컬%", "valueText": "22%"}, {"label": "공격력", "valueText": "150"}],
                  "subStats": [
                    {"label": "공겨력%", "valueText": "10.9%"},
                    {"label": "물리 피해 보너스", "valueText": "10%"},
                    {"label": "HP", "valueText": "430"}
                  ]}]}
                """);

        assertThat(describe(build.getEchoes().getFirst())).containsExactly(
                "MAIN0 null null pct=false hl=false",
                "MAIN1 공격력 150 pct=false hl=false",
                "SUB0 null null pct=false hl=false",
                "SUB1 null null pct=false hl=false",
                "SUB2 HP 430 pct=false hl=false");
    }

    @Test
    void subValuesNotInTierTableAreCleared() {
        CharacterBuild build = convert("""
                {"echoes": [{"subStats": [
                  {"label": "공격력%", "valueText": "99%"},
                  {"label": "공격력", "valueText": "10.9%"},
                  {"label": "크리티컬%", "valueText": "10.50%"},
                  {"label": "공격력", "valueText": "5O"}
                ]}]}
                """);

        assertThat(describe(build.getEchoes().getFirst())).containsExactly(
                "SUB0 공격력% null pct=false hl=false",
                "SUB1 공격력 null pct=false hl=false",
                "SUB2 크리티컬% 10.5 pct=true hl=false",
                "SUB3 공격력 null pct=false hl=false");
    }

    @Test
    void invalidCostIsCleared() {
        CharacterBuild build = convert("{\"echoes\": [{\"cost\": 7}]}");

        assertThat(build.getEchoes().getFirst().getCost()).isNull();
    }

    @Test
    void echoPartsNullAndEmptyStayDistinct() {
        assertThat(convert("{\"echoParts\": null}").isEchoSetsCustomized()).as("null = 추천 조합 기본값").isFalse();

        CharacterBuild cleared = convert("{\"echoParts\": []}");
        assertThat(cleared.isEchoSetsCustomized()).as("[] = 사용자가 전부 지움").isTrue();
        assertThat(cleared.getEchoSets()).isEmpty();
    }

    @Test
    void duplicateSetIdsAreStoredOnce() {
        CharacterBuild build = convert("""
                {"echoParts": [{"setId": "a", "pieceCount": 2}, {"setId": "a", "pieceCount": 3}, {"setId": "b", "pieceCount": 0}]}
                """);

        assertThat(build.getEchoSets()).extracting(EchoSetPart::getSetId).containsExactly("a");
    }

    @Test
    void legacyArrayFormatIsAccepted() {
        var records = mapper.parse("{\"jiyan\": [{\"cost\": 1, \"subStats\": [{\"label\": \"HP\", \"valueText\": \"430\"}]}]}");

        assertThat(records.get("jiyan").echoes()).hasSize(1);
        assertThat(records.get("jiyan").echoParts()).isNull();
    }

    @Test
    void screenOnlyFieldsAreIgnored() {
        CharacterBuild build = convert("""
                {"echoes": [{"id": "img-1", "previewUrl": "data:image/png;base64,AAAA", "failed": true,
                  "subStats": [{"id": "s1", "label": "HP", "valueText": "430", "raw": "HP 430"}]}]}
                """);

        assertThat(describe(build.getEchoes().getFirst())).containsExactly("SUB0 HP 430 pct=false hl=false");
    }

    @Test
    void malformedJsonIsBadRequest() {
        assertBadRequest(() -> mapper.parse("{not json"));
    }

    @Test
    void tooLongIdIsBadRequest() {
        assertBadRequest(() -> mapper.parse("{\"" + "x".repeat(51) + "\": {}}"));
        assertBadRequest(() -> convert("{\"weapon\": \"" + "x".repeat(51) + "\"}"));
    }

    @Test
    void moreThanFiveEchoesIsBadRequest() {
        assertBadRequest(() -> convert("{\"echoes\": [{}, {}, {}, {}, {}, {}]}"));
    }

    @Test
    void entityConvertsBackToFrontendJson() {
        CharacterBuild build = convert("""
                {"echoes": [{"cost": 4, "subStats": [
                  {"label": "공격력%", "valueText": "10.9%", "highlighted": true},
                  {"label": "", "valueText": ""}
                ]}],
                 "weapon": "w1", "echoParts": null,
                 "baseStats": {"charAtk": "412.50", "weaponAtk": "", "baseHp": "", "baseDef": ""}}
                """);

        String json = mapper.toJson(List.of(build));

        assertThat(json)
                .contains("\"jiyan\"", "\"weapon\":\"w1\"", "\"echoParts\":null", "\"cost\":4",
                        "\"label\":\"공격력%\",\"valueText\":\"10.9%\",\"highlighted\":true",
                        "\"label\":\"\",\"valueText\":\"\"", "\"charAtk\":\"412.5\"", "\"previewUrl\":null");
    }

    private CharacterBuild convert(String recordJson) {
        CharacterBuild build = new CharacterBuild(User.register("google", "sub", null, null), "jiyan");
        mapper.applyRecord(build, mapper.parse("{\"jiyan\": " + recordJson + "}").get("jiyan"));
        return build;
    }

    private static List<String> describe(BuildEcho echo) {
        return echo.getStats().stream()
                .map(s -> s.getKind() + "" + s.getSlot() + " " + s.getLabel() + " "
                        + (s.getValue() == null ? null : s.getValue().stripTrailingZeros().toPlainString())
                        + " pct=" + s.isPercent() + " hl=" + s.isHighlighted())
                .toList();
    }

    private static void assertBadRequest(Runnable action) {
        assertThatThrownBy(action::run)
                .isInstanceOfSatisfying(ResponseStatusException.class,
                        e -> assertThat(e.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST));
    }
}
