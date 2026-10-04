package com.wuwaecho.backend.admin;

import java.util.List;
import java.util.Map;

/** 관리자 화면에서 편집할 수 있는 테이블과 컬럼 목록. SQL에는 이 목록에 있는 이름만 들어갑니다. */
final class AdminCatalog {

    enum Type { TEXT, INT, NUMBER, STATUS }

    record Column(String name, String label, Type type, boolean required) {
    }

    /** imageColumn: 이미지 경로를 담는 컬럼, imageFolder: 프론트 public/ 아래 저장 폴더. */
    record Table(String name, String label, List<Column> columns, String imageColumn, String imageFolder) {
    }

    private static Column text(String name, String label, boolean required) {
        return new Column(name, label, Type.TEXT, required);
    }

    private static Column num(String name, String label) {
        return new Column(name, label, Type.NUMBER, false);
    }

    private static final Column ID = text("id", "ID (영문, 변경 불가)", true);
    private static final Column STATUS = new Column("status", "노출 상태", Type.STATUS, true);
    private static final Column SORT = new Column("sort_order", "정렬 순서", Type.INT, true);

    static final Map<String, Table> TABLES = Map.of(
            "characters", new Table("chara_info", "캐릭터", List.of(
                    ID, text("name", "이름", true), new Column("rarity", "등급", Type.INT, true),
                    text("element", "속성", true), text("weapon_type", "무기 종류", false),
                    text("image_path", "이미지 경로", false),
                    num("base_hp", "기초 HP"), num("base_atk", "기초 공격력"), num("base_def", "기초 방어력"),
                    num("base_energy_regen", "공명 효율"), num("base_crit_rate", "크리티컬"),
                    num("base_crit_dmg", "크리티컬 피해"), STATUS, SORT), "image_path", "characters"),
            "weapons", new Table("weapon_info", "무기", List.of(
                    ID, text("name", "이름", true), text("type", "종류", true), text("icon_path", "아이콘 경로", false),
                    new Column("atk", "공격력", Type.NUMBER, true), text("sub_stat", "부옵션", false),
                    num("sub_stat_value", "부옵션 수치"), text("passive_name", "패시브 이름", false),
                    text("description", "설명", false), STATUS, SORT), "icon_path", "weapons"),
            "echoes", new Table("echo_info", "메인 에코", List.of(
                    ID, text("name", "이름", true), text("icon_path", "아이콘 경로", false),
                    text("description", "설명", false), text("passive_description", "패시브 설명", false),
                    STATUS, SORT), "icon_path", "main-echoes"),
            "echo-sets", new Table("echo_set_info", "에코 세트", List.of(
                    ID, text("name", "이름", true), text("icon_path", "아이콘 경로", false), STATUS, SORT),
                    "icon_path", "echo-sets"));

    private AdminCatalog() {
    }
}
