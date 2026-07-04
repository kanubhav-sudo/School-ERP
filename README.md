# School ERP System

A production-grade School ERP (Enterprise Resource Planning) web application built with modern technologies.

## Overview

This is a role-based school management system with three user roles:

- **Admin** — Full system control: manage students, teachers, classes, fees, results, calendar, notices, and settings.
- **Teacher** — Manage attendance, homework, classwork, and marks for assigned classes and sections.
- **Student** — View attendance, homework, classwork, results, fees, admit cards, and notices.

All roles share a single application with role-based access control (RBAC).

## Tech Stack

### Frontend

- React 19
- Vite
- TypeScript
- Tailwind CSS
- shadcn/ui
- React Router
- TanStack Query
- React Hook Form + Zod
- Axios

### Backend

- Node.js
- Express.js
- TypeScript
- Prisma ORM
- PostgreSQL

### Infrastructure

- Docker & Docker Compose

## Project Structure

```
school-erp/
├── frontend/          # React + Vite application
├── backend/           # Express.js API server
├── docs/              # Project documentation
├── docker-compose.yml # PostgreSQL + services
└── .env.example       # Environment variables template
```

## Getting Started

### Prerequisites

- Node.js >= 20
- Docker & Docker Compose
- Git

### Setup

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd school-erp
   ```

2. **Start the database**

   ```bash
   docker compose up -d
   ```

3. **Setup the backend**

   ```bash
   cd backend
   cp .env.example .env
   npm install
   npm run dev
   ```

4. **Setup the frontend**

   ```bash
   cd frontend
   cp .env.example .env
   npm install
   npm run dev
   ```

5. **Open the application**

   - Frontend: [http://localhost:5173](http://localhost:5173)
   - Backend API: [http://localhost:3000](http://localhost:3000)

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [API Reference](docs/API.md)
- [Database Design](docs/DATABASE.md)
- [Features](docs/FEATURES.md)
- [Roadmap](docs/ROADMAP.md)
- [Changelog](docs/CHANGELOG.md)

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
