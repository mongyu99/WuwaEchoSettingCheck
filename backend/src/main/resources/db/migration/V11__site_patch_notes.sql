-- 패치노트를 '사이트 자체 업데이트 기록'으로 바꿉니다. 예전 테이블(제목 + 외부 링크)은 운영·로컬 모두
-- 비어 있어서 지우고, 버전 + 본문을 관리자 페이지에서 쓰는 게시물 테이블로 새로 만듭니다.
DROP TABLE patch_notes;

CREATE TABLE patch_notes (
    -- 관리자 페이지가 등록 시각으로 자동으로 만듭니다(note_1761550000000).
    id VARCHAR(80) PRIMARY KEY,
    -- 화면에는 'V' + 버전(V1.0.0)으로 보여줍니다.
    version VARCHAR(20) NOT NULL UNIQUE CHECK (version ~ '^[0-9]+(\.[0-9]+){1,3}$'),
    published_date DATE NOT NULL,
    content TEXT NOT NULL,
    status VARCHAR(10) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'HIDDEN', 'UPCOMING'))
);

CREATE INDEX idx_patch_notes_published ON patch_notes (published_date DESC, id DESC);

-- 첫 게시물. 오픈 전이라 HIDDEN으로 넣어 두고, 오픈할 때 관리자 페이지에서 ACTIVE로 바꿉니다.
INSERT INTO patch_notes (id, version, published_date, content, status) VALUES (
    'note_1_0_0',
    '1.0.0',
    '2026-10-31',
    '명체크 베타 오픈!

- 캐릭터 빌드 체크: 에코 스크린샷을 올리면 스탯을 읽어 빌드 점수를 계산해요.
- 홈: 메인 배너와 버전 남은 시간, 픽업 일정, 진행 중인 이벤트를 한눈에 볼 수 있어요.
- 이벤트 캘린더: 진행 중인 이벤트 기간을 달력으로 확인할 수 있어요.
- PC 화면에 맞춰 만들었어요. 모바일 화면은 순차적으로 지원할 예정이에요.',
    'HIDDEN'
);
