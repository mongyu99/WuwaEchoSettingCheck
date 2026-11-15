-- 이벤트를 인게임 이벤트와 커뮤니티 참여형 이벤트(SNS·공모전 등)로 나눕니다. 커뮤니티 이벤트는 홈의 별도 배너 줄에만 보여줍니다.
ALTER TABLE events
    ADD COLUMN category VARCHAR(10) NOT NULL DEFAULT 'INGAME' CHECK (category IN ('INGAME', 'COMMUNITY'));
