FROM maven:3.9-eclipse-temurin-21 AS build

WORKDIR /build

COPY pom.xml ./
RUN mvn -B dependency:go-offline

COPY src/ src/
RUN mvn -B package -DskipTests

FROM registry.access.redhat.com/ubi9/openjdk-21-runtime:1.24

ENV LANGUAGE='en_US:en'

COPY --chown=185 --from=build /build/target/quarkus-app/lib/ /deployments/lib/
COPY --chown=185 --from=build /build/target/quarkus-app/*.jar /deployments/
COPY --chown=185 --from=build /build/target/quarkus-app/app/ /deployments/app/
COPY --chown=185 --from=build /build/target/quarkus-app/quarkus/ /deployments/quarkus/

EXPOSE 8080
USER 185

ENV JAVA_OPTS_APPEND="-Dquarkus.http.host=0.0.0.0 -Djava.util.logging.manager=org.jboss.logmanager.LogManager"
ENV JAVA_APP_JAR="/deployments/quarkus-run.jar"

ENTRYPOINT [ "/opt/jboss/container/java/run/run-java.sh" ]
