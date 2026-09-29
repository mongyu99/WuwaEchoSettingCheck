package com.wuwaecho.backend.build;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;

/** 프론트의 characterData[characterId] 한 건의 모양입니다. previewUrl·raw 같은 화면 전용 필드는 무시합니다. */
final class CharacterStatePayload {

    private CharacterStatePayload() {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record Record(
            List<Echo> echoes,
            String weapon,
            List<EchoPart> echoParts,
            String mainEchoId,
            BaseStats baseStats) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record Echo(Integer cost, List<Stat> mainStats, List<Stat> subStats) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record Stat(String label, String valueText, Boolean highlighted) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record EchoPart(String setId, Integer pieceCount) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record BaseStats(String charAtk, String weaponAtk, String baseHp, String baseDef) {
    }
}
