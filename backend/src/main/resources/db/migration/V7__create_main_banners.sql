-- 홈 메인 배너. 관리자 페이지에서 기간(starts_at ~ ends_at)을 정해 등록하고, 그 기간에만 홈에 노출됩니다.
CREATE TABLE main_banners (
    id VARCHAR(80) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    image_path VARCHAR(1024),
    url VARCHAR(2048),
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
    sort_order INT NOT NULL DEFAULT 0,
    CHECK (ends_at > starts_at)
);

CREATE INDEX idx_main_banners_period ON main_banners (starts_at, ends_at);
