-- 홈 '픽업 일정' 배너. 픽업은 복각으로 예전 배너를 다시 쓰므로, 행을 새로 만들지 않고
-- 관리자 페이지에서 노출 상태(ACTIVE)와 기간(starts_at ~ ends_at)만 바꿔 다시 띄웁니다.
CREATE TABLE pickup_banners (
    id VARCHAR(80) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    image_path VARCHAR(1024),
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
    sort_order INT NOT NULL DEFAULT 0,
    CHECK (ends_at > starts_at)
);

CREATE INDEX idx_pickup_banners_period ON pickup_banners (starts_at, ends_at);

-- 지금 홈에 걸려 있는 픽업 배너(public/banners/)를 3.6 버전 기간으로 옮겨 둡니다.
INSERT INTO pickup_banners (id, title, image_path, starts_at, ends_at, status, sort_order) VALUES
    ('suoming_banner', '쇄명 픽업', 'banners/suoming_banner.webp',
        '2026-09-30 10:00:00+09', '2026-11-10 10:00:00+09', 'ACTIVE', 1),
    ('lynae_banner', '린네 픽업', 'banners/lynae_banner.webp',
        '2026-09-30 10:00:00+09', '2026-11-10 10:00:00+09', 'ACTIVE', 2),
    ('lucilla_banner', '루실라 픽업', 'banners/lucilla_banner.webp',
        '2026-09-30 10:00:00+09', '2026-11-10 10:00:00+09', 'ACTIVE', 3);
