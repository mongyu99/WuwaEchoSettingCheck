-- 홈 방송 소식. 관리자 페이지에서 기간과 링크를 정해 등록하고, 그 기간에만 노출됩니다.
CREATE TABLE broadcasts (
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

CREATE INDEX idx_broadcasts_period ON broadcasts (starts_at, ends_at);

INSERT INTO broadcasts (id, title, image_path, starts_at, ends_at, status, sort_order) VALUES
    ('broadcast_3_8_preview', '3.8 버전 프리뷰 특별 방송', 'main/3.8-preview.jpg',
        '2026-11-01 00:00:00+09', '2026-11-07 00:00:00+09', 'ACTIVE', 1);
