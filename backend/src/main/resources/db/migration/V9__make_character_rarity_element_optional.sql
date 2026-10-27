-- 출시 전 캐릭터처럼 등급·속성을 아직 모를 때도 등록할 수 있게 필수값에서 뺍니다.
-- 값이 있을 때의 등급 범위 검사(1~5)는 그대로 유지됩니다(CHECK는 NULL을 통과시킴).
ALTER TABLE chara_info ALTER COLUMN rarity DROP NOT NULL;
ALTER TABLE chara_info ALTER COLUMN element DROP NOT NULL;
