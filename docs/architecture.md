# Arquitectura General

## Visión
Aplicación web responsive para gestionar facturación y módulos relacionados; backend API REST con autenticación JWT y RBAC; integración con servicios JSON externos.

## Diagrama de arquitectura (Mermaid)
```mermaid
flowchart LR
  subgraph Client
    UI[React + Vite + Tailwind]
  end
  subgraph Server
    API[Express + TypeScript]
    Auth[JWT & RBAC]
    Services[Servicios - casos de uso]
    Repo[Repositorios TypeORM]
  end
  DB[(PostgreSQL)]
  Ext[Servicios JSON Externos]

  UI -->|HTTP/JSON| API
  API --> Auth
  API --> Services --> Repo --> DB
  Services <--> Ext
```

## Módulos
- Autenticación y gestión de usuarios/roles (Admin, Analista)
- Facturación, Anulaciones, Radicación, Medicamentos, Ventas, Configuración
- Control JSON (import/export)

## Tecnologías
- Frontend: React + Vite + TS + Tailwind
- Backend: Node.js + Express + TS + TypeORM
- DB: PostgreSQL
- Auth: JWT
- Docs: OpenAPI/Swagger
- DevOps: Docker, Compose
