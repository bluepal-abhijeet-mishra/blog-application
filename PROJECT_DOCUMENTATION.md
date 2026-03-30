# BlogSpace: Technical Architecture & Features Documentation

Welcome to the **BlogSpace** technical documentation. This document outlines the system architecture, core functionalities, technology stack, and security protocols implemented within the professional publishing platform.

---

## 🏗️ System Architecture

BlogSpace follows a robust, decoupled **Client-Server Architecture**. The platform is logically divided into two primary subsystems: a high-performance React frontend and a highly scalable Spring Boot RESTful API backend, communicating via stateless JSON payloads.

### 1. The Presentation Layer (Frontend)
The client-side application is designed for speed, responsiveness, and a premium user experience (UX) featuring glassmorphism elements, dark mode support, and micro-animations.

*   **Framework:** React 18 powered by Vite.
*   **Routing:** React Router v6 for client-side seamless navigation.
*   **State Management & Data Synchronization:** `@tanstack/react-query` handles aggressive caching, optimistic UI updates, background data fetching, and loading states automatically.
*   **Styling Engine:** TailwindCSS v3 (configured with custom typography, spacing, colors, and container queries).
*   **Animation & Motion:** Framer Motion enables fluid route transitions and interactive component animations.
*   **Content Editing:** Tiptap Editor (a headless wrapper around ProseMirror) provides a rich, deeply customizable WYSIWYG editing experience.
*   **Export Tools:** `html2pdf.js` is leveraged for robust article-to-PDF generation.

### 2. The Application Layer (Backend API)
The backend acts as the secure, scalable brain of the operation, enforcing business rules and managing all persistence operations.

*   **Framework:** Spring Boot 3.2.3 (Java 21).
*   **Security:** Spring Security combined with stateless JSON Web Tokens (JWT).
*   **Data Access:** Spring Data JPA (Hibernate) acts as the ORM mapping objects to relational database tables.
*   **API Documentation:** OpenAPI 3 (Swagger UI) automatically dictates endpoint contracts.
*   **Database Migrations:** Flyway ensures declarative, version-controlled database schema evolutions.
*   **Mail/Notification:** `spring-boot-starter-mail` for executing automated email triggers (e.g., administrator notifications, plan limits).

### 3. The Persistence Layer (Database)
*   **Database Engine:** PostgreSQL.
*   **Full-Text Search:** Direct integration with Postgres `ts_vector` and `plainto_tsquery` to provide lightning-fast, relevance-based global keyword searches across the entire publishing network.

---

## 🚀 Core Functionalities & Features

### 👤 Identity & Role Management
*   **Role-Based Access Control (RBAC):** Three distinct tiers of users: `READER`, `AUTHOR`, and `ADMIN`.
*   **Stateless Authentication:** Secure login and registration backed by JWT.
*   **Author Applications:** Readers can apply to become Authors. Administrators review and approve/deny these applications through a dedicated dashboard.
*   **User Profiles:** Users can manage display names, avatars (via UI-Avatars API), and biographical data.

### 📝 Publishing Engine
*   **Rich Text Editor:** Fully featured WYSIWYG editor supporting deep markdown, custom formatting, and embedded image/link support.
*   **Lifecycle Management:** Posts can be staged as `DRAFT` or activated as `PUBLISHED`.
*   **Taxonomy System:** Articles are categorized into primary `Categories` and tagged with multiple `Tags` for dense SEO and internal discovery.
*   **Telemetry & Analytics:** Authors get real-time dashboards detailing Views, Likes, Shares, Comments, and total publication rates.
*   **Data Exporting:** Post metrics can be bulk exported to `.csv` or `.json` directly from the dashboard.

### 🤝 Social & Interaction Mechanics
*   **Author Feed Tracking:** Users can "Follow" or "Unfollow" specific authors.
*   **Dynamic Intelligence Feeds:** The platform homepage automatically aggregates published posts. Users can filter this feed by tags, categories, or drill down into specific Author Profiles for targeted reading.
*   **Engagement Tracking:** Readers can `Save` articles for later, `Like` comments, and register internal `Shares`.
*   **Real-Time Notifications:** A notification bell system alerts users to interactions (e.g. "Your post received a comment"). Read/unread states are synchronized globally.
*   **Comment Threads:** Users can interact deeply on posts via a dedicated bottom comment section.

### 🛠️ Administrator Controls
*   **Categories Management:** Admins define to global categories and approve "Category Requests" proposed by Authors.
*   **User Management & Demographics:** Admins visualize platform growth, role distributions, and global content generation curves via beautiful Recharts UI integrations.

---

## 🔒 Security Best Practices Implemented

1.  **Endpoint Protection:** Controller endpoints are strictly annotated with `@PreAuthorize("hasAnyRole('AUTHOR', 'ADMIN')")` enforcing zero-trust API usage.
2.  **Stateless Sessions:** The backend uses JWT, mitigating CSRF heavily and allowing for immense horizontal scaling logic without session affinity complexities.
3.  **Data Validation:** Hard constraints leveraging `jakarta.validation` on DTOs stop malformed requests before they touch executing services.
4.  **Ownership Verification:** Modification queries (edit post, delete post) strictly verify if the requesting `User ID` exactly matches the `Author ID` belonging to the resource.

---

## 📂 Project Structure Overview

```text
blog-application/
│
├── frontend/                     # React / Vite Client
│   ├── src/
│   │   ├── api/                  # Axios instances and endpoint services
│   │   ├── components/           # Reusable UI (Buttons, Modals, Editor)
│   │   ├── context/              # Global React Contexts (Auth)
│   │   ├── pages/                # High-level Routes (Home, Dashboard)
│   │   └── utils/                # Helper functions (Time, PDF gen)
│   └── package.json
│
├── backend/                      # Spring Boot Server
│   ├── src/main/java/.../
│   │   ├── controller/           # RESTful API Endpoints
│   │   ├── service/              # Core Business Logic
│   │   ├── repository/           # Spring Data JPA Interfaces
│   │   ├── entity/               # Database mapped Models
│   │   ├── dto/                  # Data Transfer Objects
│   │   └── security/             # JWT Filters and Custom User Details
│   ├── src/main/resources/
│   │   ├── db/migration/         # Flyway SQL Scripts (V1 to V13+)
│   │   └── application.yml       # Server execution configs
│   └── pom.xml
│
└── docker-compose.yml            # Container definitions for Postgres
```
