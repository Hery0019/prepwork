# syntax=docker/dockerfile:1
# Construction multi-étapes (DOCK-001) : le jar est produit dans l'image, jamais copié depuis un poste.
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /workspace

# Dépendances d'abord, sources ensuite : la couche des dépendances reste en cache (DOCK-AP-001).
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw -B -q dependency:go-offline

COPY src/ src/
RUN ./mvnw -B -q -DskipTests package && cp target/*.jar app.jar

# Image finale : JRE seul, utilisateur non root (DOCK-002).
FROM eclipse-temurin:21-jre-alpine
RUN addgroup -S app && adduser -S app -G app
USER app
WORKDIR /app
COPY --from=build /workspace/app.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
