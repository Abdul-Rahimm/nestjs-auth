# Auth Backend API

This is a NestJS backend API for user authentication with PostgreSQL database.

## Features

- User signup with email/password
- User login with JWT authentication
- User logout with session tracking
- PostgreSQL database with TypeORM
- Password hashing with bcrypt
- Session logging (signin/signout timestamps)

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Start PostgreSQL Database

```bash
docker-compose up -d
```

### 3. Configure Environment

Copy `.env` file and update JWT_SECRET:

```env
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

### 4. Start Development Server

```bash
npm run start:dev
```

The server will run on http://localhost:3001

## API Endpoints

### POST /auth/signup

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### POST /auth/login

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### POST /auth/logout

Requires Bearer token in Authorization header.

## Database Schema

### users table

- id (primary key)
- email (unique)
- passwordHash
- createdAt

### user_sessions table

- id (primary key)
- userId (foreign key)
- action (signin/signout)
- timestamp
