-- 에코 스탯 라벨/서브옵션 단계값 화이트리스트입니다. 프론트의 config/mainStatBonusNames.js,
-- config/subStatOptions.js와 같은 값이어야 합니다.
CREATE TABLE stat_labels (
    kind VARCHAR(4) NOT NULL CHECK (kind IN ('MAIN', 'SUB')),
    label VARCHAR(50) NOT NULL,
    PRIMARY KEY (kind, label)
);

INSERT INTO stat_labels (kind, label) VALUES
    ('MAIN', '크리티컬'), ('MAIN', '크리티컬 피해'), ('MAIN', '공명 효율'),
    ('MAIN', '공명 스킬 피해 보너스'), ('MAIN', '일반 공격 피해 보너스'), ('MAIN', '강공격 피해 보너스'),
    ('MAIN', '공명 해방 피해 보너스'), ('MAIN', '물리 피해 보너스'), ('MAIN', '응결 피해 보너스'),
    ('MAIN', '용융 피해 보너스'), ('MAIN', '전도 피해 보너스'), ('MAIN', '기류 피해 보너스'),
    ('MAIN', '회절 피해 보너스'), ('MAIN', '인멸 피해 보너스'), ('MAIN', '치료 효과 보너스'),
    ('MAIN', '공격력'), ('MAIN', 'HP'), ('MAIN', '방어력'),
    ('SUB', '크리티컬%'), ('SUB', '크리티컬 피해%'), ('SUB', '공격력%'), ('SUB', '공명 효율%'),
    ('SUB', '공명 해방 피해 보너스%'), ('SUB', '강공격 피해 보너스%'), ('SUB', '공명 스킬 피해 보너스%'),
    ('SUB', '일반 공격 피해 보너스%'), ('SUB', '방어력%'), ('SUB', 'HP%'),
    ('SUB', '공격력'), ('SUB', 'HP'), ('SUB', '방어력');

-- 서브옵션이 가질 수 있는 수치(단계)입니다. 메인옵션 수치는 에코 레벨마다 달라서 검증하지 않습니다.
CREATE TABLE sub_stat_tiers (
    label VARCHAR(50) NOT NULL,
    tier SMALLINT NOT NULL CHECK (tier >= 1),
    value NUMERIC(8, 2) NOT NULL,
    kind VARCHAR(4) NOT NULL DEFAULT 'SUB' CHECK (kind = 'SUB'),
    PRIMARY KEY (label, tier),
    CONSTRAINT uq_sub_stat_tiers_label_value UNIQUE (label, value),
    CONSTRAINT fk_sub_stat_tiers_label FOREIGN KEY (kind, label) REFERENCES stat_labels (kind, label)
);

INSERT INTO sub_stat_tiers (label, tier, value)
SELECT t.label, v.ord, v.value
FROM (VALUES
    ('크리티컬%', ARRAY[6.3, 6.9, 7.5, 8.1, 8.7, 9.3, 9.9, 10.5]),
    ('크리티컬 피해%', ARRAY[12.6, 13.8, 15, 16.2, 17.4, 18.6, 19.8, 21]),
    ('공격력%', ARRAY[6.4, 7.1, 7.9, 8.6, 9.4, 10.1, 10.9, 11.6]),
    ('공명 효율%', ARRAY[6.8, 7.6, 8.4, 9.2, 10, 10.8, 11.6, 12.4]),
    ('공명 해방 피해 보너스%', ARRAY[6.4, 7.1, 7.9, 8.6, 9.4, 10.1, 10.9, 11.6]),
    ('강공격 피해 보너스%', ARRAY[6.4, 7.1, 7.9, 8.6, 9.4, 10.1, 10.9, 11.6]),
    ('공명 스킬 피해 보너스%', ARRAY[6.4, 7.1, 7.9, 8.6, 9.4, 10.1, 10.9, 11.6]),
    ('일반 공격 피해 보너스%', ARRAY[6.4, 7.1, 7.9, 8.6, 9.4, 10.1, 10.9, 11.6]),
    ('방어력%', ARRAY[8.1, 9, 10, 10.9, 11.8, 12.8, 13.8, 14.7]),
    ('HP%', ARRAY[6.4, 7.1, 7.9, 8.6, 9.4, 10.1, 10.9, 11.6]),
    ('공격력', ARRAY[30, 40, 50, 60, 70]),
    ('HP', ARRAY[320, 360, 390, 430, 470, 510, 540, 580]),
    ('방어력', ARRAY[40, 50, 60, 70, 80])
) AS t(label, vals)
CROSS JOIN LATERAL unnest(t.vals::NUMERIC(8, 2)[]) WITH ORDINALITY AS v(value, ord);

-- 빈 옵션은 ''가 아니라 NULL로 저장합니다(NULL이면 FK 검사를 건너뜀). 목록에 없는 기존 값도 비웁니다.
ALTER TABLE echo_stats ALTER COLUMN label DROP NOT NULL;

UPDATE echo_stats es
SET label = NULL, value = NULL
WHERE es.label = ''
   OR NOT EXISTS (SELECT 1 FROM stat_labels sl WHERE sl.kind = es.kind AND sl.label = es.label);

ALTER TABLE echo_stats
    ADD CONSTRAINT fk_echo_stats_label FOREIGN KEY (kind, label) REFERENCES stat_labels (kind, label);
