# Blog Platform

A multi-author content publishing system built with Spring Boot, React, and PostgreSQL.

## Features

- **Multi-author Publishing:** Authors can create, edit, and publish rich text content.
- **Rich Text Editor:** Powered by TipTap (ProseMirror).
- **Comments:** Nested comments (2 levels) with moderation capabilities.
- **Search:** Full-text search using PostgreSQL `tsvector`.
- **RSS Feed:** RSS 2.0 XML feed of the latest posts.
- **RBAC:** READER, AUTHOR, and ADMIN roles.
- **Dockerized:** Entire stack starts with a single command.

## Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS, TipTap, React Query, React Router.
- **Backend:** Spring Boot 3, Spring Security, JWT, JPA/Hibernate, Flyway, PostgreSQL.
- **Database:** PostgreSQL 15.
- **Containers:** Docker, Docker Compose.

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js (for local frontend dev)
- Java 21 & Maven (for local backend dev)

### Running with Docker Compose

1. Clone the repository.
2. (Optional) Create a `.env` file based on `.env.example`.
3. Run:
   ```bash
   docker compose up --build
   ```
4. Access the application:
   - Frontend: [http://localhost](http://localhost)
   - Backend API: [http://localhost:8080/api](http://localhost:8080/api)
   - RSS Feed: [http://localhost:8080/api/feed.rss](http://localhost:8080/api/feed.rss)

### Environment Variables

See `.env.example` for the required environment variables.

### Default Admin User
The first user registered on the platform will automatically be assigned the `ADMIN` role.
