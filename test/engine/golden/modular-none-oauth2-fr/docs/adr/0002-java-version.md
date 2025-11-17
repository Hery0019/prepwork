# ADR 0002 — Version de Java

Date : 2026-09-02 · Statut : acceptée

## Contexte

Spring Boot 4.1.1 (version épinglée par prepwork) supporte Java 17 et 21 LTS.

## Décision

**Java 17** : contrainte d'exploitation ; passer à 21 dès que possible.

## Conséquences

`java.version` est fixé dans `pom.xml` ; le Dockerfile et la CI utilisent la même version.
