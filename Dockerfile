FROM node:24-bookworm-slim AS frontend
WORKDIR /build/frontend
COPY react-front-end-app/package*.json ./
RUN npm ci
COPY react-front-end-app/ ./
RUN npm run build

FROM maven:3.9-eclipse-temurin-21 AS backend
WORKDIR /build/backend
COPY java-spring-boot-back-end-app/pom.xml ./
RUN mvn -B dependency:go-offline
COPY java-spring-boot-back-end-app/src/main ./src/main
COPY --from=frontend /build/frontend/dist ./src/main/resources/static
RUN mvn -B -Dmaven.test.skip=true package

FROM eclipse-temurin:21-jre-jammy AS runtime
RUN groupadd --gid 10001 vera && useradd --uid 10001 --gid vera --create-home vera
WORKDIR /app
COPY --from=backend --chown=vera:vera /build/backend/target/vera-api-0.0.1-SNAPSHOT.jar /app/app.jar
COPY --chmod=755 docker/entrypoint.sh /app/entrypoint.sh
ENV SPRING_PROFILES_ACTIVE=prod
ENV JAVA_TOOL_OPTIONS="-Xms128m -Xmx384m"
USER vera
EXPOSE 8080
ENTRYPOINT ["/app/entrypoint.sh"]
