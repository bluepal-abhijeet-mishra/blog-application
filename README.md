# Blog Platform

Multi-author content publishing system built with Spring Boot, React, and PostgreSQL.

## Prerequisites

- Docker + Docker Compose
- Node.js 20+ (frontend local dev)
- Java 21 + Maven (backend local dev)

## Credentials Location

Credentials are currently stored in:

- `backend/src/main/resources/application.properties`
- `backend/src/main/resources/application-docker.properties` (Docker profile)

These include:

- PostgreSQL URL/user/password
- JWT secret and token expiration
- Optional admin seed email/password

## Run With Docker Compose

```bash
docker compose up --build
```

Services:

- Frontend: `http://localhost`
- Backend API: `http://localhost:8080/api`
- RSS Feed: `http://localhost:8080/api/feed.rss`
- Docker compose activates `SPRING_PROFILES_ACTIVE=docker` automatically.

## Run Locally (Without Docker)

### Backend

```bash
cd backend
mvn spring-boot:run
```

Note:

- If you run backend outside Docker, update `spring.datasource.url` in `application.properties` from `postgres` host to your local DB host.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Feature Summary

- JWT auth + role-based access (`READER`, `AUTHOR`, `ADMIN`)
- Draft/publish workflow with TipTap JSON content
- Tag/category filtering and PostgreSQL full-text search
- Two-level threaded comments
- RSS 2.0 feed for latest published posts
- Admin tools for user role updates and moderation
