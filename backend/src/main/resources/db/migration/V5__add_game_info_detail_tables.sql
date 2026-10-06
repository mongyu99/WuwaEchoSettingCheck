-- 게임 기준 데이터의 목록형 정보(보너스·유효 옵션·추천·세트 효과 등)입니다. 1개 = 1행.
-- 구조만 정의하고, 데이터는 로컬 시드로 넣습니다.

ALTER TABLE weapon_info ADD COLUMN note TEXT;

-- 캐릭터 고유 보너스 (예: 크리티컬 +8%)
CREATE TABLE chara_innate_bonus (
    chara_id VARCHAR(50) NOT NULL REFERENCES chara_info (id) ON DELETE CASCADE,
    sort_order SMALLINT NOT NULL,
    category VARCHAR(50) NOT NULL,
    value NUMERIC(8, 2) NOT NULL,
    PRIMARY KEY (chara_id, sort_order)
);

-- 점수 계산에 쓰는 캐릭터별 유효 서브옵션
CREATE TABLE chara_valid_option (
    chara_id VARCHAR(50) NOT NULL REFERENCES chara_info (id) ON DELETE CASCADE,
    label VARCHAR(50) NOT NULL,
    kind VARCHAR(4) NOT NULL DEFAULT 'SUB' CHECK (kind = 'SUB'),
    sort_order SMALLINT NOT NULL,
    PRIMARY KEY (chara_id, label),
    FOREIGN KEY (kind, label) REFERENCES stat_labels (kind, label)
);

CREATE TABLE chara_recommended_weapon (
    chara_id VARCHAR(50) NOT NULL REFERENCES chara_info (id) ON DELETE CASCADE,
    weapon_id VARCHAR(50) NOT NULL REFERENCES weapon_info (id) ON DELETE CASCADE,
    sort_order SMALLINT NOT NULL,
    PRIMARY KEY (chara_id, weapon_id)
);

-- 캐릭터 추천 에코 세트 조합. 조합 하나 = combo_no 하나, 조합 안의 세트 = part 행
CREATE TABLE chara_echo_combo_part (
    chara_id VARCHAR(50) NOT NULL REFERENCES chara_info (id) ON DELETE CASCADE,
    combo_no SMALLINT NOT NULL,
    sort_order SMALLINT NOT NULL,
    set_id VARCHAR(50) NOT NULL REFERENCES echo_set_info (id) ON DELETE CASCADE,
    piece_count SMALLINT NOT NULL CHECK (piece_count > 0),
    PRIMARY KEY (chara_id, combo_no, sort_order)
);

CREATE TABLE weapon_bonus (
    weapon_id VARCHAR(50) NOT NULL REFERENCES weapon_info (id) ON DELETE CASCADE,
    sort_order SMALLINT NOT NULL,
    category VARCHAR(50) NOT NULL,
    value NUMERIC(8, 2) NOT NULL,
    PRIMARY KEY (weapon_id, sort_order)
);

-- 에코 세트 효과. 계산에 반영하지 않는 조건부 효과는 category/value가 NULL(설명만 표시)
CREATE TABLE echo_set_effect (
    set_id VARCHAR(50) NOT NULL REFERENCES echo_set_info (id) ON DELETE CASCADE,
    piece_count SMALLINT NOT NULL CHECK (piece_count > 0),
    category VARCHAR(50),
    value NUMERIC(8, 2),
    description TEXT,
    PRIMARY KEY (set_id, piece_count)
);

-- 메인 에코 장착 보너스 (누구나 받음)
CREATE TABLE echo_bonus (
    echo_id VARCHAR(80) NOT NULL REFERENCES echo_info (id) ON DELETE CASCADE,
    sort_order SMALLINT NOT NULL,
    category VARCHAR(50) NOT NULL,
    value NUMERIC(8, 2) NOT NULL,
    PRIMARY KEY (echo_id, sort_order)
);

-- 특정 캐릭터가 장착했을 때만 추가로 붙는 보너스
CREATE TABLE echo_chara_bonus (
    echo_id VARCHAR(80) NOT NULL REFERENCES echo_info (id) ON DELETE CASCADE,
    chara_id VARCHAR(50) NOT NULL REFERENCES chara_info (id) ON DELETE CASCADE,
    sort_order SMALLINT NOT NULL,
    category VARCHAR(50) NOT NULL,
    value NUMERIC(8, 2) NOT NULL,
    PRIMARY KEY (echo_id, chara_id, sort_order)
);

-- 특정 캐릭터가 장착하면 에코 스킬 설명 자체가 바뀌는 경우
CREATE TABLE echo_chara_description (
    echo_id VARCHAR(80) NOT NULL REFERENCES echo_info (id) ON DELETE CASCADE,
    chara_id VARCHAR(50) NOT NULL REFERENCES chara_info (id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    PRIMARY KEY (echo_id, chara_id)
);

-- 에코 세트를 고르면 함께 쓰는 메인 에코 후보
CREATE TABLE echo_set_main_echo (
    set_id VARCHAR(50) NOT NULL REFERENCES echo_set_info (id) ON DELETE CASCADE,
    echo_id VARCHAR(80) NOT NULL REFERENCES echo_info (id) ON DELETE CASCADE,
    sort_order SMALLINT NOT NULL,
    PRIMARY KEY (set_id, echo_id)
);
