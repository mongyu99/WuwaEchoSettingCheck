-- 메인 배너는 클릭해도 이동하지 않으므로 이동 주소 컬럼을 지웁니다.
ALTER TABLE main_banners DROP COLUMN url;
