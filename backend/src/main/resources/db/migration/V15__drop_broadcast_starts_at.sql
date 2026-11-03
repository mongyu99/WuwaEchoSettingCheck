-- 방송 소식은 등록하면 바로 노출하고 종료 일시까지만 보여줍니다. (시작 일시에 걸린 인덱스와 CHECK도 함께 사라집니다)
ALTER TABLE broadcasts DROP COLUMN starts_at;
CREATE INDEX idx_broadcasts_ends_at ON broadcasts (ends_at);
