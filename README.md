# Traffic-Simulation-Chats

[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=ARSW2026-JDC_Traffic-Simulator-Chats&metric=coverage)](https://sonarcloud.io/dashboard?id=ARSW2026-JDC_Traffic-Simulator-Chats)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=ARSW2026-JDC_Traffic-Simulator-Chats&metric=alert_status)](https://sonarcloud.io/dashboard?id=ARSW2026-JDC_Traffic-Simulator-Chats)
[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=ARSW2026-JDC_Traffic-Simulator-Chats&metric=sqale_rating)](https://sonarcloud.io/dashboard?id=ARSW2026-JDC_Traffic-Simulator-Chats)
[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=ARSW2026-JDC_Traffic-Simulator-Chats&metric=security_rating)](https://sonarcloud.io/dashboard?id=ARSW2026-JDC_Traffic-Simulator-Chats)

Módulo de chat en tiempo real para la aplicación CUTS. Proporciona funcionalidades de WebSocket para mensajería instantánea entre usuarios conectados al simulador de tráfico.

## Tecnologías

- **[NestJS](https://nestjs.com/)** v11.0.0 - Framework backend
- **[TypeScript](https://www.typescriptlang.org/)** v5.3.3 - Tipado
- **[Prisma](https://www.prisma.io/)** v7.5.0 - ORM
- **[PostgreSQL](https://www.postgresql.org/)** - Base de datos
- **[Socket.io](https://socket.io/)** v4.6.1 - WebSocket
- **[firebase-admin](https://firebase.google.com/docs/admin)** v12.0.0 - Autenticación
- **[Joi](https://joi.dev/)** v18.0.2 - Validación de env vars

## Prerrequisitos

- Node.js >= 18.x
- npm >= 9.x
- PostgreSQL >= 14.x
- Redis (opcional)

## Instalación

```bash
npm install
```

## Ejecución

```bash
# Desarrollo
npm run start:dev

# Producción
npm run build && npm run start:prod
```

## Tests

```bash
npm run test           # Unit tests
npm run test:e2e      # E2E tests
npm run test:cov       # Coverage
```

## Variables de Entorno

| Variable | Descripción | Requerido |
|----------|-------------|-----------|
| `PORT` | Puerto del servidor | ✅ |
| `DATABASE_URL` | URL PostgreSQL | ✅ |
| `FIREBASE_PROJECT_ID` | Firebase Project ID | ✅ |
| `FIREBASE_CLIENT_EMAIL` | Firebase Client Email | ✅ |
| `FIREBASE_PRIVATE_KEY` | Firebase Private Key | ✅ |
| `VITE_FIREBASE_API_KEY` | Firebase API Key (frontend) | ✅ |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain (frontend) | ✅ |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Project ID (frontend) | ✅ |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Storage Bucket (frontend) | ✅ |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase Sender ID (frontend) | ✅ |
| `VITE_FIREBASE_APP_ID` | Firebase App ID (frontend) | ✅ |
| `ALLOWED_ORIGINS` | CORS origins (comma-separated) | - |

## Endpoints

- REST: `GET /chat/messages`
- WebSocket namespace: `/chat`

## Estructura

```
src/
├── auth/           # Autenticación Firebase
├── chat/          # Chat WebSocket (gateway, service, controller)
├── config/         # Variables de entorno
├── health/         # Health checks
├── prisma/         # Cliente Prisma
└── users/         # Gestión de usuarios
```

## Scripts disponibles

| Script | Descripción |
|--------|-------------|
| `npm run build` | Compila el proyecto |
| `npm run start` | Inicia en producción |
| `npm run start:dev` | Desarrollo con hot-reload |
| `npm run start:debug` | Modo debug |
| `npm run lint` | ESLint con auto-fix |
| `npm run format` | Prettier |
| `npm run prisma:generate` | Genera cliente Prisma |
| `npm run prisma:migrate` | Migra la base de datos |
| `npm run prisma:push` | Aplica cambios sin migracion |
| `npm run test:cov` | Coverage |

## Notas de Implementación

Este módulo se comunica con el gateway a través de la ruta `/chat` para manejar conexiones WebSocket. El namespace utilizado es `/chat`.
