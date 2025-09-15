# 🔐 **Role-Based Access Control (RBAC) Implementation**

## **📋 Table of Contents**

- [🏗️ Architectural Overview](#️-architectural-overview)
- [🎯 RBAC Components](#-rbac-components)
- [📊 Database Schema](#-database-schema)
- [🔄 Authentication & Authorization Flow](#-authentication--authorization-flow)
- [🛡️ Security Model](#️-security-model)
- [🚀 API Endpoints & Permissions](#-api-endpoints--permissions)
- [💻 Technical Implementation Details](#-technical-implementation-details)
- [🧪 Testing & Usage](#-testing--usage)

---

## 🏗️ **Architectural Overview**

The RBAC system extends the existing JWT-based authentication with role-based authorization, following NestJS best practices and maintaining clean separation of concerns.

### **System Architecture**

```mermaid
graph TB
    subgraph "Client Layer"
        Client[Frontend Client]
    end

    subgraph "API Gateway Layer"
        Controller[Auth Controller]
        Client --> Controller
    end

    subgraph "Security Layer"
        JWTGuard[JWT Auth Guard]
        RolesGuard[Roles Guard]
        Controller --> JWTGuard
        JWTGuard --> RolesGuard
    end

    subgraph "Business Logic Layer"
        AuthService[Auth Service]
        RolesGuard --> AuthService
    end

    subgraph "Data Access Layer"
        UserRepo[(User Repository)]
        SessionRepo[(Session Repository)]
        AuthService --> UserRepo
        AuthService --> SessionRepo
    end

    subgraph "Database Layer"
        PostgreSQL[(PostgreSQL Database)]
        UserRepo --> PostgreSQL
        SessionRepo --> PostgreSQL
    end

    subgraph "Infrastructure"
        JWTService[JWT Service]
        Reflector[Metadata Reflector]
        RolesGuard -.-> JWTService
        RolesGuard -.-> Reflector
    end
```

### **Design Principles**

1. **🔒 Security First** - Multiple layers of validation (authentication → authorization)
2. **📦 Separation of Concerns** - Clear boundaries between authentication and authorization
3. **🎯 Decorator-Driven** - Use of metadata decorators for clean, declarative role assignments
4. **🔄 Token-Based** - Stateless role information embedded in JWT tokens
5. **🛡️ Guard Composition** - Composable guards for flexible security policies

---

## 🎯 **RBAC Components**

### **1. Role Enumeration**

```typescript
// src/auth/enums/roles.enum.ts
export enum Role {
  USER = 'user',
  ADMIN = 'admin',
}
```

### **2. Role Decorator**

```typescript
// src/auth/decorators/roles.decorator.ts
export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
```

### **3. Roles Guard**

```typescript
// src/auth/guards/roles.guard.ts
@Injectable()
export class RolesGuard implements CanActivate {
  // Validates user roles against required endpoint permissions
}
```

---

## 📊 **Database Schema**

### **Enhanced User Entity**

```typescript
@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  passwordHash: string;

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.USER, // 👈 New role column with default
  })
  role: Role;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => UserSession, (userSession) => userSession.user)
  sessions: UserSession[];
}
```

### **Database Schema Diagram**

```mermaid
erDiagram
    users ||--o{ user_sessions : has

    users {
        int id PK
        varchar email UK
        varchar passwordHash
        enum role "NEW: user|admin, default=user"
        timestamp createdAt
    }

    user_sessions {
        int id PK
        int userId FK
        enum action "signin|signout"
        timestamp timestamp
    }
```

---

## 🔄 **Authentication & Authorization Flow**

### **Complete RBAC Flow Diagram**

```mermaid
sequenceDiagram
    participant Client
    participant Controller as Auth Controller
    participant JWTGuard as JWT Auth Guard
    participant RolesGuard as Roles Guard
    participant JWTService as JWT Service
    participant Reflector
    participant AuthService as Auth Service
    participant DB as Database

    Note over Client,DB: 1. User Login (Role Assignment)
    Client->>Controller: POST /auth/login
    Controller->>AuthService: login(credentials)
    AuthService->>DB: findUser + validate
    DB-->>AuthService: user with role
    AuthService->>JWTService: sign({ sub, email, role })
    JWTService-->>AuthService: JWT with role
    AuthService-->>Client: { token, message }

    Note over Client,DB: 2. Protected Endpoint Access
    Client->>Controller: GET /auth/users + Bearer token
    Controller->>JWTGuard: canActivate()
    JWTGuard->>JWTService: verify(token)
    JWTService-->>JWTGuard: valid payload
    JWTGuard-->>Controller: authenticated ✓

    Controller->>RolesGuard: canActivate()
    RolesGuard->>Reflector: getAllAndOverride(ROLES_KEY)
    Reflector-->>RolesGuard: [Role.ADMIN]
    RolesGuard->>JWTService: verify(token)
    JWTService-->>RolesGuard: { role: 'user' }

    alt User has required role
        RolesGuard-->>Controller: authorized ✓
        Controller->>AuthService: getAllUsers()
        AuthService-->>Client: users data
    else User lacks required role
        RolesGuard-->>Client: 403 Forbidden
    end
```

### **Authorization Decision Matrix**

| Endpoint                 | Authentication Required | Role Required | Access Granted To   |
| ------------------------ | ----------------------- | ------------- | ------------------- |
| `POST /auth/signup`      | ❌ No                   | -             | Everyone            |
| `POST /auth/login`       | ❌ No                   | -             | Everyone            |
| `POST /auth/logout`      | ✅ Yes                  | -             | Authenticated users |
| `GET /auth/users`        | ✅ Yes                  | `ADMIN`       | Admin users only    |
| `DELETE /auth/users/:id` | ✅ Yes                  | `ADMIN`       | Admin users only    |
| `PATCH /auth/update/:id` | ✅ Yes                  | `ADMIN`       | Admin users only    |

---

## 🛡️ **Security Model**

### **Multi-Layer Security Architecture**

```mermaid
graph TD
    Request[HTTP Request] --> AuthHeader{Authorization Header?}
    AuthHeader -->|No| Reject1[401 Unauthorized]
    AuthHeader -->|Yes| JWTValidation[JWT Token Validation]

    JWTValidation --> JWTValid{Valid JWT?}
    JWTValid -->|No| Reject2[401 Unauthorized]
    JWTValid -->|Yes| RoleCheck[Role Requirement Check]

    RoleCheck --> RoleRequired{Role Required?}
    RoleRequired -->|No| Allow1[✅ Access Granted]
    RoleRequired -->|Yes| RoleValidation[User Role Validation]

    RoleValidation --> HasRole{User has required role?}
    HasRole -->|No| Reject3[403 Forbidden]
    HasRole -->|Yes| Allow2[✅ Access Granted]
```

### **Security Features**

1. **🔐 JWT-Based Stateless Authentication**
   - No server-side session storage required
   - Role information embedded in token payload
   - Configurable token expiration (24h default)

2. **🛡️ Role-Based Authorization**
   - Declarative role assignments using decorators
   - Runtime role validation against token payload
   - Flexible multi-role support (`@Roles(Role.ADMIN, Role.MODERATOR)`)

3. **🔒 Guard Composition**
   - Sequential guard execution (JWT → Roles)
   - Early termination on authentication failure
   - Clean separation of authentication vs authorization logic

4. **⚡ Performance Optimizations**
   - Metadata caching via Reflector
   - No database queries during authorization
   - Efficient role checking with array operations

---

## 🚀 **API Endpoints & Permissions**

### **Endpoint Security Configuration**

#### **Public Endpoints (No Authentication Required)**

```typescript
@Post('signup')  // Creates users with default 'user' role
async signup(@Body(ValidationPipe) signupDto: SignupDto) { }

@Post('login')   // Returns JWT with user's role
async login(@Body(ValidationPipe) loginDto: LoginDto) { }
```

#### **Authenticated Endpoints (JWT Required)**

```typescript
@Post('logout')
@UseGuards(JwtAuthGuard)  // Only authentication required
async logout(@GetUser() user) { }
```

#### **Admin-Only Endpoints (JWT + ADMIN Role Required)**

```typescript
@Get('users')
@UseGuards(JwtAuthGuard, RolesGuard)  // Composition of guards
@Roles(Role.ADMIN)                    // Role requirement metadata
async getAllUsers() { }

@Delete('users/:id')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
async deleteUser(@Param('id') userId: number) { }

@Patch('update/:id')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
async updateUser(@Param('id') userId: number, @Body() updateDto) { }
```

### **Response Patterns**

| Status Code | Scenario              | Response Body                                               |
| ----------- | --------------------- | ----------------------------------------------------------- |
| `200/201`   | Success               | `{ message: "...", data?: any }`                            |
| `400`       | Validation Error      | `{ statusCode: 400, message: [...], error: "Bad Request" }` |
| `401`       | Authentication Failed | `{ statusCode: 401, message: "Unauthorized" }`              |
| `403`       | Authorization Failed  | `{ statusCode: 403, message: "Forbidden resource" }`        |
| `404`       | Resource Not Found    | `{ statusCode: 404, message: "Not Found" }`                 |
| `409`       | Conflict              | `{ statusCode: 409, message: "..." }`                       |
