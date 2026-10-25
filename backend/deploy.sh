#!/usr/bin/env bash
# 운영 서버 자동 배포. cron이 10분마다 실행합니다(서버 설정은 아래 주석 참고).
#   1) GitHub에 새 커밋이 있는지만 가볍게 확인합니다(git fetch).
#   2) 그 커밋의 app·web 이미지가 GHCR에 다 올라왔는지 확인합니다. CI가 아직 빌드 중이면 다음 실행 때 다시 봅니다.
#   3) 코드를 그 커밋으로 맞추고(compose·nginx 설정 반영) 이미지를 받아 재시작합니다. DB 마이그레이션은 app 시작 시 Flyway가 합니다.
#
# 서버 등록(한 번만): crontab -e 에 아래 한 줄
#   */10 * * * * flock -n /tmp/wuwaecho-deploy.lock bash $HOME/WuwaEchoSettingCheck/backend/deploy.sh >> $HOME/deploy.log 2>&1
set -euo pipefail

cd "$(dirname "$0")"
REGISTRY=ghcr.io/mongyu99

git fetch --quiet origin master
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/master)
[ "$LOCAL" = "$REMOTE" ] && exit 0

for name in app web; do
    if ! docker manifest inspect "$REGISTRY/wuwaecho-$name:$REMOTE" > /dev/null 2>&1; then
        echo "$(date '+%F %T') ${REMOTE:0:7} 이미지($name) 아직 없음, 다음 실행 때 다시 확인"
        exit 0
    fi
done

echo "$(date '+%F %T') 배포 시작 ${LOCAL:0:7} -> ${REMOTE:0:7}"
git merge --ff-only --quiet origin/master
docker compose pull --quiet app web
docker compose up -d --no-build --remove-orphans
docker image prune -f > /dev/null
echo "$(date '+%F %T') 배포 완료 ${REMOTE:0:7}"
