-- 게임 기준 데이터 ID를 "소문자 + 공백은 _" 규칙으로 통일합니다(관리자 페이지 입력 규칙과 같음).
-- 규칙: lower(regexp_replace(trim(id), '\s+', '_', 'g'))

-- 1) 게임 테이블을 가리키는 외래 키에 ON UPDATE CASCADE를 붙여, 부모 ID를 바꾸면 자식 행도 같이 바뀌게 합니다.
DO $$
DECLARE
    fk RECORD;
BEGIN
    FOR fk IN
        SELECT conrelid::regclass AS child, conname, pg_get_constraintdef(oid) AS def
        FROM pg_constraint
        WHERE contype = 'f'
          AND confrelid::regclass::text IN ('chara_info', 'weapon_info', 'echo_info', 'echo_set_info')
          AND pg_get_constraintdef(oid) NOT LIKE '%ON UPDATE CASCADE%'
    LOOP
        EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I', fk.child, fk.conname);
        EXECUTE format('ALTER TABLE %s ADD CONSTRAINT %I %s ON UPDATE CASCADE', fk.child, fk.conname, fk.def);
    END LOOP;
END $$;

-- 2) 바꾼 결과가 다른 행의 ID와 겹치면(예: Jiyan과 jiyan이 둘 다 있음) 멈춥니다. 이 경우 수동으로 정리해야 합니다.
DO $$
DECLARE
    t TEXT;
    dup TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY['chara_info', 'weapon_info', 'echo_info', 'echo_set_info']
    LOOP
        EXECUTE format(
            'SELECT string_agg(id, '', '') FROM %I WHERE lower(regexp_replace(trim(id), ''\s+'', ''_'', ''g'')) IN '
            || '(SELECT lower(regexp_replace(trim(id), ''\s+'', ''_'', ''g'')) FROM %I GROUP BY 1 HAVING count(*) > 1)',
            t, t) INTO dup;
        IF dup IS NOT NULL THEN
            RAISE EXCEPTION 'ID 정규화 충돌(%): %', t, dup;
        END IF;
    END LOOP;
END $$;

-- 3) 게임 테이블 ID 정규화. 자식 테이블은 1)의 ON UPDATE CASCADE로 함께 바뀝니다.
UPDATE chara_info SET id = lower(regexp_replace(trim(id), '\s+', '_', 'g'))
WHERE id <> lower(regexp_replace(trim(id), '\s+', '_', 'g'));
UPDATE weapon_info SET id = lower(regexp_replace(trim(id), '\s+', '_', 'g'))
WHERE id <> lower(regexp_replace(trim(id), '\s+', '_', 'g'));
UPDATE echo_info SET id = lower(regexp_replace(trim(id), '\s+', '_', 'g'))
WHERE id <> lower(regexp_replace(trim(id), '\s+', '_', 'g'));
UPDATE echo_set_info SET id = lower(regexp_replace(trim(id), '\s+', '_', 'g'))
WHERE id <> lower(regexp_replace(trim(id), '\s+', '_', 'g'));

-- 4) 이미지 경로도 같은 규칙으로 맞춥니다. 실제 public/ 파일 이름도 함께 바꿔야 합니다.
UPDATE chara_info SET image_path = lower(regexp_replace(image_path, '\s+', '_', 'g'))
WHERE image_path <> lower(regexp_replace(image_path, '\s+', '_', 'g'));
UPDATE weapon_info SET icon_path = lower(regexp_replace(icon_path, '\s+', '_', 'g'))
WHERE icon_path <> lower(regexp_replace(icon_path, '\s+', '_', 'g'));
UPDATE echo_info SET icon_path = lower(regexp_replace(icon_path, '\s+', '_', 'g'))
WHERE icon_path <> lower(regexp_replace(icon_path, '\s+', '_', 'g'));
UPDATE echo_set_info SET icon_path = lower(regexp_replace(icon_path, '\s+', '_', 'g'))
WHERE icon_path <> lower(regexp_replace(icon_path, '\s+', '_', 'g'));

-- 5) 사용자 빌드는 외래 키 없이 문자열 ID를 저장하므로 직접 맞춥니다.
UPDATE character_builds SET character_id = lower(regexp_replace(trim(character_id), '\s+', '_', 'g'))
WHERE character_id <> lower(regexp_replace(trim(character_id), '\s+', '_', 'g'));
UPDATE character_builds SET weapon_id = lower(regexp_replace(trim(weapon_id), '\s+', '_', 'g'))
WHERE weapon_id <> lower(regexp_replace(trim(weapon_id), '\s+', '_', 'g'));
UPDATE character_builds SET main_echo_id = lower(regexp_replace(trim(main_echo_id), '\s+', '_', 'g'))
WHERE main_echo_id <> lower(regexp_replace(trim(main_echo_id), '\s+', '_', 'g'));
UPDATE build_echo_sets SET set_id = lower(regexp_replace(trim(set_id), '\s+', '_', 'g'))
WHERE set_id <> lower(regexp_replace(trim(set_id), '\s+', '_', 'g'));
