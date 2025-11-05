# ADR 0002 — Version de Java

Date : 2026-09-02 · Statut : acceptée

## Contexte

Spring Boot 4.1.1 (version épinglée par prepwork) supporte Java 17 et 21 LTS.

## Décision

**Java 21** : records, pattern matching, threads virtuels disponibles.

## Conséquences

`java.version` est fixé dans `pom.xml` ; le Dockerfile et la CI utilisent la même version.
