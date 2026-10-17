# 1단계: 소스를 빌드해서 실행 가능한 jar를 만듭니다.
FROM eclipse-temurin:21-jdk AS build
WORKDIR /workspace

# 의존성만 먼저 받아두면, 소스만 바뀐 재빌드 때 이 단계가 캐시돼 빨라집니다.
COPY gradlew settings.gradle build.gradle ./
COPY gradle gradle
RUN ./gradlew dependencies --no-daemon -q > /dev/null

COPY src src
RUN ./gradlew bootJar --no-daemon -x test

# 2단계: 실행에 필요한 JRE와 jar만 담은 가벼운 이미지입니다.
FROM eclipse-temurin:21-jre
WORKDIR /app
# catalog 백업 JSON(Redis·DB 장애 대비)을 저장할 폴더. app 사용자는 /app에 쓸 권한이 없어 따로 만듭니다.
RUN useradd --system --no-create-home app && mkdir /app/data && chown app /app/data
COPY --from=build /workspace/build/libs/*.jar app.jar
USER app
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
