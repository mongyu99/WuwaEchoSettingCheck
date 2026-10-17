// /api/catalog 부하 테스트 (k6). 사이트를 여는 모든 사용자가 처음 한 번 부르는 API입니다.
// 실행(backend 폴더): docker run --rm -i --add-host=host.docker.internal:host-gateway grafana/k6 run - < loadtest/catalog.js
import http from 'k6/http'
import { check } from 'k6'

// 운영과 같은 경로(nginx 80번 → app)로 측정합니다. app 포트(8080)는 compose에서 닫혀 있습니다.
const BASE_URL = __ENV.BASE_URL || 'http://host.docker.internal'

export const options = {
  scenarios: {
    // 서버 예열: 결과에서 제외하려고 태그를 따로 붙입니다.
    warmup: {
      executor: 'constant-vus',
      vus: 10,
      duration: '10s',
      tags: { phase: 'warmup' },
    },
    // constant-vus 최대 처리량
    // constant-arrival-rate 처리 속도
    load: {
      executor: 'constant-vus',
      vus: 50,
      duration: '30s',
      startTime: '10s',
      tags: { phase: 'load' },
    },
  },
  thresholds: {
    'http_req_duration{phase:load}': ['p(95)<500'],
    'http_req_failed{phase:load}': ['rate<0.01'],
  },
  summaryTrendStats: ['avg', 'med', 'p(95)', 'p(99)', 'max'],
}

export default function () {
  // 브라우저처럼 압축 응답을 받겠다고 알립니다. nginx(80번)를 거칠 때만 gzip이 적용됩니다.
  const res = http.get(`${BASE_URL}/api/catalog`, { headers: { 'Accept-Encoding': 'gzip, deflate, br' } })
  check(res, { 'status 200': (r) => r.status === 200 })
}
