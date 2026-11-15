-- 에코 코스트(1/3/4)와 무기 등급(1~5성)입니다. 사이트·관리자 목록을 이 값으로 나눠 보여 줍니다.
-- 값은 관리자 페이지에서 넣습니다(비어 있으면 "미분류"로 보입니다).
ALTER TABLE echo_info ADD COLUMN cost SMALLINT CHECK (cost IN (1, 3, 4));
ALTER TABLE weapon_info ADD COLUMN rarity SMALLINT CHECK (rarity BETWEEN 1 AND 5);
