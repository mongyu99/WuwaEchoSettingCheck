-- 게임 기준 데이터 테이블(캐릭터 / 무기 / 메인 에코 / 에코 세트)입니다. 구조만 정의하고,
-- 데이터는 저장소에 넣지 않고 로컬 시드(backend/local-seed/, git 제외)로 따로 넣습니다.
-- status: ACTIVE(공개) / HIDDEN(숨김) / UPCOMING(출시 예정), sort_order: 화면 노출 순서

CREATE TABLE chara_info (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    rarity SMALLINT NOT NULL CHECK (rarity BETWEEN 1 AND 5),
    element VARCHAR(10) NOT NULL,
    weapon_type VARCHAR(10),
    image_path VARCHAR(255),
    base_hp NUMERIC(10, 2),
    base_atk NUMERIC(10, 2),
    base_def NUMERIC(10, 2),
    base_energy_regen NUMERIC(6, 2),
    base_crit_rate NUMERIC(6, 2),
    base_crit_dmg NUMERIC(6, 2),
    status VARCHAR(10) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'HIDDEN', 'UPCOMING')),
    sort_order INT NOT NULL
);

CREATE TABLE weapon_info (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(10) NOT NULL,
    icon_path VARCHAR(255),
    atk NUMERIC(8, 2) NOT NULL,
    sub_stat VARCHAR(50),
    sub_stat_value NUMERIC(8, 2),
    passive_name VARCHAR(100),
    description TEXT,
    status VARCHAR(10) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'HIDDEN', 'UPCOMING')),
    sort_order INT NOT NULL
);

CREATE TABLE echo_info (
    id VARCHAR(80) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    icon_path VARCHAR(255),
    description TEXT,
    passive_description TEXT,
    status VARCHAR(10) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'HIDDEN', 'UPCOMING')),
    sort_order INT NOT NULL
);

CREATE TABLE echo_set_info (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    icon_path VARCHAR(255),
    status VARCHAR(10) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'HIDDEN', 'UPCOMING')),
    sort_order INT NOT NULL
);
