# 🔐 Authentication API - NestJS Backend

<p align="center">
  <img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" />
</p>

<p align="center">
  A secure, production-ready authentication API built with NestJS, TypeORM, PostgreSQL, and JWT tokens.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS" />
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Docker-2CA5E0?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
</p>

---

## 📋 Table of Contents

- [🎯 Overview](#-overview)
- [🏗️ Architecture](#️-architecture)
- [📁 Project Structure](#-project-structure)
- [🔄 Authentication Flows](#-authentication-flows)
- [🗄️ Database Schema](#️-database-schema)
- [🚀 API Endpoints](#-api-endpoints)
- [⚙️ Setup & Installation](#️-setup--installation)
- [🧪 Testing the API](#-testing-the-api)
- [🔒 Security Features](#-security-features)

---

## 🎯 Overview

This is a **complete authentication API** that provides secure user registration, login, and session management. The system tracks user activities and maintains session logs for signin/signout events.

### Key Features

- ✅ **User Registration** with email validation
- ✅ **JWT-based Authentication** with secure tokens
- ✅ **Password Hashing** using bcrypt with salt rounds
- ✅ **Session Tracking** for user activities
- ✅ **Input Validation** with class-validator
- ✅ **CORS Configuration** for frontend integration
- ✅ **TypeScript Strict Mode** for type safety
- ✅ **PostgreSQL Database** with TypeORM
- ✅ **Docker Support** for easy deployment

---

## 🏗️ Architecture

```mermaid
graph TB
    Client[Frontend Client] --> Controller[Auth Controller]
    Controller --> Service[Auth Service]
    Service --> UserRepo[(User Repository)]
    Service --> SessionRepo[(Session Repository)]
    UserRepo --> DB[(PostgreSQL Database)]
    SessionRepo --> DB
    Service --> JWT[JWT Service]
    Service --> Bcrypt[Bcrypt Hashing]

    subgraph "NestJS Application"
        Controller
        Service
        JWT
        Bcrypt
    end

    subgraph "Data Layer"
        UserRepo
        SessionRepo
        DB
    end
```

---

## 📁 Project Structure

```
src/
├── 📁 auth/                          # Authentication module
│   ├── 📁 dto/
│   │   └── auth.dto.ts               # Data Transfer Objects (SignupDto, LoginDto)
│   ├── 📁 interfaces/
│   │   └── auth.interface.ts         # TypeScript interfaces (JwtPayload, AuthResponse)
│   ├── 📁 strategies/
│   │   └── jwt.strategy.ts           # Passport JWT strategy implementation
│   ├── 📁 guards/
│   │   └── jwt-auth.guard.ts         # JWT authentication guard
│   ├── 📁 decorators/
│   │   └── get-user.decorator.ts     # Custom decorator to extract user from request
│   ├── auth.controller.ts            # REST API endpoints (/auth/signup, /auth/login, /auth/logout)
│   ├── auth.service.ts               # Business logic for authentication
│   └── auth.module.ts                # Auth module configuration
├── 📁 user/
│   └── user.entity.ts                # User database entity (id, email, passwordHash, createdAt)
├── 📁 user-session/
│   └── user-session.entity.ts        # Session tracking entity (id, userId, action, timestamp)
├── app.module.ts                     # Root application module
└── main.ts                           # Application bootstrap with CORS and validation
```

### 🔧 Configuration Files

```
📁 Root Directory/
├── docker-compose.yaml               # PostgreSQL database container
├── .env                             # Environment variables (JWT_SECRET, DB config)
├── package.json                     # Dependencies and scripts
└── tsconfig.json                    # TypeScript configuration
```

---

## 🔄 Authentication Flows

### 1. 📝 User Signup Flow

```mermaid
sequenceDiagram
    participant Client
    participant Controller as AuthController
    participant Service as AuthService
    participant UserRepo as UserRepository
    participant DB as PostgreSQL

    Client->>Controller: POST /auth/signup
    Note over Client,Controller: { email, password }

    Controller->>Controller: Validate DTO (SignupDto)
    Controller->>Service: signup(signupDto)

    Service->>UserRepo: findOne({ email })
    UserRepo->>DB: SELECT * FROM users WHERE email = ?
    DB-->>UserRepo: User data or null
    UserRepo-->>Service: existingUser

    alt User exists
        Service-->>Controller: throw ConflictException
        Controller-->>Client: 409 Conflict Error
    else User doesn't exist
        Service->>Service: hash password (bcrypt + salt)
        Service->>UserRepo: save(newUser)
        UserRepo->>DB: INSERT INTO users
        DB-->>UserRepo: Success
        UserRepo-->>Service: Created user
        Service-->>Controller: { message: "User registered successfully" }
        Controller-->>Client: 201 Created
    end
```

**Key Files Involved:**

- `auth.controller.ts` - `/auth/signup` endpoint
- `auth.service.ts` - `signup()` method with business logic
- `dto/auth.dto.ts` - `SignupDto` with validation rules
- `user.entity.ts` - User database model

### 2. 🔐 User Login Flow

```mermaid
sequenceDiagram
    participant Client
    participant Controller as AuthController
    participant Service as AuthService
    participant UserRepo as UserRepository
    participant SessionRepo as SessionRepository
    participant JWT as JwtService
    participant DB as PostgreSQL

    Client->>Controller: POST /auth/login
    Note over Client,Controller: { email, password }

    Controller->>Controller: Validate DTO (LoginDto)
    Controller->>Service: login(loginDto)

    Service->>UserRepo: findOne({ email })
    UserRepo->>DB: SELECT * FROM users WHERE email = ?
    DB-->>UserRepo: User data or null
    UserRepo-->>Service: user

    alt User not found
        Service-->>Controller: throw UnauthorizedException
        Controller-->>Client: 401 Unauthorized
    else User found
        Service->>Service: compare(password, user.passwordHash)

        alt Password invalid
            Service-->>Controller: throw UnauthorizedException
            Controller-->>Client: 401 Unauthorized
        else Password valid
            Service->>SessionRepo: save({ userId, action: 'signin' })
            SessionRepo->>DB: INSERT INTO user_sessions
            DB-->>SessionRepo: Session logged

            Service->>JWT: sign({ sub: userId, email })
            JWT-->>Service: JWT Token

            Service-->>Controller: { message: "Login successful", token }
            Controller-->>Client: 200 OK with JWT token
        end
    end
```

**Key Files Involved:**

- `auth.controller.ts` - `/auth/login` endpoint
- `auth.service.ts` - `login()` method with password verification
- `user-session.entity.ts` - Session logging model
- `interfaces/auth.interface.ts` - `JwtPayload` interface

### 3. 🚪 User Logout Flow

```mermaid
sequenceDiagram
    participant Client
    participant Guard as JwtAuthGuard
    participant Strategy as JwtStrategy
    participant Controller as AuthController
    participant Service as AuthService
    participant SessionRepo as SessionRepository
    participant DB as PostgreSQL

    Client->>Guard: POST /auth/logout
    Note over Client,Guard: Authorization: Bearer <JWT_TOKEN>

    Guard->>Strategy: validate(jwtPayload)
    Strategy->>Strategy: Extract user info from JWT
    Strategy-->>Guard: { userId, email }
    Guard-->>Controller: Request with user data

    Controller->>Service: logout(userId)

    Service->>SessionRepo: save({ userId, action: 'signout' })
    SessionRepo->>DB: INSERT INTO user_sessions
    DB-->>SessionRepo: Session logged

    Service-->>Controller: { message: "Logout successful" }
    Controller-->>Client: 200 OK
```

**Key Files Involved:**

- `guards/jwt-auth.guard.ts` - JWT authentication guard
- `strategies/jwt.strategy.ts` - JWT token validation
- `decorators/get-user.decorator.ts` - Extract user from request
- `auth.service.ts` - `logout()` method

---

## 🗄️ Database Schema

```mermaid
erDiagram
    users ||--o{ user_sessions : has

    users {
        int id PK
        varchar email UK
        varchar passwordHash
        timestamp createdAt
    }

    user_sessions {
        int id PK
        int userId FK
        enum action
        timestamp timestamp
    }
```

### Table Details

#### 👤 `users` Table

| Column         | Type         | Constraints                 | Description            |
| -------------- | ------------ | --------------------------- | ---------------------- |
| `id`           | INTEGER      | PRIMARY KEY, AUTO_INCREMENT | Unique user identifier |
| `email`        | VARCHAR(255) | UNIQUE, NOT NULL            | User's email address   |
| `passwordHash` | VARCHAR(255) | NOT NULL                    | Bcrypt hashed password |
| `createdAt`    | TIMESTAMP    | DEFAULT NOW()               | Account creation time  |

#### 📊 `user_sessions` Table

| Column      | Type      | Constraints                 | Description               |
| ----------- | --------- | --------------------------- | ------------------------- |
| `id`        | INTEGER   | PRIMARY KEY, AUTO_INCREMENT | Unique session identifier |
| `userId`    | INTEGER   | FOREIGN KEY                 | Reference to users.id     |
| `action`    | ENUM      | 'signin', 'signout'         | Type of user action       |
| `timestamp` | TIMESTAMP | DEFAULT NOW()               | When the action occurred  |

---

## 🚀 API Endpoints

### 📝 POST `/auth/signup`

Register a new user account.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Validation Rules:**

- Email must be valid format
- Password minimum 6 characters

**Response:**

```json
{
  "message": "User registered successfully"
}
```

**Status Codes:**

- `201` - User created successfully
- `400` - Validation error
- `409` - User already exists

---

### 🔐 POST `/auth/login`

Authenticate user and receive JWT token.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:**

```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Status Codes:**

- `200` - Login successful
- `401` - Invalid credentials

---

### 🚪 POST `/auth/logout`

Log out user and record signout event.

**Headers:**

```
Authorization: Bearer <JWT_TOKEN>
```

**Response:**

```json
{
  "message": "Logout successful"
}
```

**Status Codes:**

- `200` - Logout successful
- `401` - Invalid or missing token

---

## ⚙️ Setup & Installation

### 1. 📦 Install Dependencies

```bash
npm install
```

### 2. 🐳 Start PostgreSQL Database

```bash
docker-compose up -d
```

### 3. 🔧 Environment Configuration

Create `.env` file with your configuration:

```env
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=development
PORT=3001

DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=auth_user
DB_PASSWORD=auth_password
DB_NAME=auth_db
```

### 4. 🚀 Start Development Server

```bash
npm run start:dev
```

The server will run on **http://localhost:3001**

### 5. 🏗️ Build for Production

```bash
npm run build
npm run start:prod
```

---

## 🧪 Testing the API

### Using cURL

**Signup:**

```bash
curl -X POST http://localhost:3001/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'
```

**Login:**

```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'
```

**Logout:**

```bash
curl -X POST http://localhost:3001/auth/logout \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Using Postman

1. Import the API endpoints
2. Set base URL to `http://localhost:3001`
3. For logout, add Bearer token to Authorization header

---

## 🔒 Security Features

### 🛡️ Password Security

- **Bcrypt Hashing**: Passwords are hashed with salt rounds (12)
- **No Plain Text**: Passwords never stored in plain text
- **Secure Comparison**: Uses bcrypt.compare() for verification

### 🎫 JWT Security

- **Secure Secret**: JWT signed with strong secret key
- **Expiration**: Tokens expire after 24 hours
- **Payload Validation**: JWT strategy validates token structure

### 🔍 Input Validation

- **DTO Validation**: All inputs validated with class-validator
- **Email Format**: Email addresses must be valid format
- **Password Requirements**: Minimum length enforcement
- **Whitelist Mode**: Only whitelisted properties accepted

### 🌐 CORS Configuration

- **Origin Control**: Only allowed origins can access API
- **Credentials Support**: Secure credential handling
- **Production Ready**: Easy to configure for production domains

---

**🎉 Your authentication API is now ready to use! The codebase follows best practices for security, maintainability, and scalability.**
