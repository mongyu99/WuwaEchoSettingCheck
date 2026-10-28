-- 이벤트를 관리자 페이지에서 등록하도록 바꿉니다. 예전 테이블은 운영·로컬 모두 비어 있어서 지우고,
-- 관리자 화면이 쓰는 형태(글자 ID + 노출 상태)로 새로 만듭니다.
DROP TABLE events;

CREATE TABLE events (
    -- 관리자 페이지가 등록 시각으로 자동으로 만듭니다(event_1761550000000).
    id VARCHAR(80) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    image VARCHAR(1024),
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    url VARCHAR(2048),
    status VARCHAR(10) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'HIDDEN', 'UPCOMING')),
    CHECK (ends_at > starts_at)
);

CREATE INDEX idx_events_starts_at ON events (starts_at);
