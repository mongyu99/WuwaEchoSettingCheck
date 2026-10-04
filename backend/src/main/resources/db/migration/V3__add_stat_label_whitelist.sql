-- 에코 스탯 라벨/서브옵션 단계값 화이트리스트 테이블입니다. 구조만 정의하고,
-- 데이터는 로컬 시드(backend/local-seed/, git 제외)로 따로 넣습니다.
CREATE TABLE stat_labels (
    kind VARCHAR(4) NOT NULL CHECK (kind IN ('MAIN', 'SUB')),
    label VARCHAR(50) NOT NULL,
    PRIMARY KEY (kind, label)
);

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

-- 빈 옵션은 ''가 아니라 NULL로 저장합니다(NULL이면 FK 검사를 건너뜀). 목록에 없는 기존 값도 비웁니다.
ALTER TABLE echo_stats ALTER COLUMN label DROP NOT NULL;

UPDATE echo_stats es
SET label = NULL, value = NULL
WHERE es.label = ''
   OR NOT EXISTS (SELECT 1 FROM stat_labels sl WHERE sl.kind = es.kind AND sl.label = es.label);

ALTER TABLE echo_stats
    ADD CONSTRAINT fk_echo_stats_label FOREIGN KEY (kind, label) REFERENCES stat_labels (kind, label);
