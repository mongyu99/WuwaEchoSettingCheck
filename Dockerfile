# 1단계: React 화면을 정적 파일(dist)로 빌드합니다.
FROM node:22-alpine AS build
WORKDIR /workspace

COPY package.json package-lock.json ./
# sharp(이미지 변환 스크립트용) 같은 설치 스크립트는 빌드에 필요 없어서 건너뜁니다.
RUN npm ci --ignore-scripts

COPY index.html vite.config.js ./
COPY src src
COPY public public
# 빈 값 = API를 같은 주소(/api)로 호출. nginx가 API 서버로 넘겨줍니다.
ENV VITE_API_BASE_URL=""
RUN npm run build

# 2단계: nginx가 빌드된 파일을 서빙하고 /api 요청은 API 서버로 넘깁니다.
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /workspace/dist /usr/share/nginx/html
EXPOSE 80
