-- 버전별 공식 이벤트 노트 이미지. 이벤트 캘린더 페이지 맨 위에 원본 크기 그대로 보여줍니다.
CREATE TABLE event_notes (
    -- 관리자 페이지가 등록 시각으로 자동으로 만듭니다(eventnote_1761550000000).
    id VARCHAR(80) PRIMARY KEY,
    version VARCHAR(20) NOT NULL,
    image VARCHAR(1024),
    status VARCHAR(10) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'HIDDEN', 'UPCOMING'))
);
