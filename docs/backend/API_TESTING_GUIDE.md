# 🔐 Finsieve Authentication API - Testing Guide

## 📡 API Endpoints

Base URL: `http://localhost:3000/api/v1`

### Authentication Endpoints

| Method | Endpoint                | Description               | Auth Required |
| ------ | ----------------------- | ------------------------- | ------------- |
| POST   | `/auth/register`        | Register new user         | No            |
| POST   | `/auth/login`           | Login user                | No            |
| POST   | `/auth/refresh`         | Refresh access token      | No            |
| POST   | `/auth/logout`          | Logout user               | No            |
| POST   | `/auth/forgot-password` | Request password reset    | No            |
| POST   | `/auth/reset-password`  | Reset password with token | No            |
| POST   | `/auth/verify-email`    | Verify email with token   | No            |
| GET    | `/auth/me`              | Get current user          | Yes           |

---

## 🧪 Testing with cURL

### 1. Register New User

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "SecurePass123!",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

**Expected Response (201):**

```json
{
  "success": true,
  "message": "Registration successful! Please check your email to verify your account.",
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "john.doe@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "userTier": "free",
      "isEmailVerified": false,
      "createdAt": "2026-02-08T10:30:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "15m"
  }
}
```

**Email logs in console:**

```
📧 ================================
📧 EMAIL (Development Mode)
📧 ================================
To: john.doe@example.com
Subject: Welcome to Finsieve! 🎉
--- Content ---
[Welcome email content]
📧 ================================
```

---

### 2. Login User

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "SecurePass123!"
  }'
```

**Expected Response (200):**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "john.doe@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "userTier": "free",
      "isEmailVerified": false
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "15m"
  }
}
```

---

### 3. Get Current User (Protected Route)

```bash
# Save access token from login/register response
ACCESS_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl -X GET http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected Response (200):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "john.doe@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "userTier": "free",
      "isEmailVerified": false
    }
  }
}
```

---

### 4. Forgot Password

```bash
curl -X POST http://localhost:3000/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com"
  }'
```

**Expected Response (200):**

```json
{
  "success": true,
  "message": "If an account exists with this email, you will receive a password reset link shortly."
}
```

**Email logs in console:**

```
📧 ================================
📧 EMAIL (Development Mode)
📧 ================================
To: john.doe@example.com
Subject: Reset Your Finsieve Password
--- Content ---
Reset link: http://localhost:5174/reset-password?token=abc123...
📧 ================================
```

---

### 5. Reset Password

```bash
# Use token from email (check console logs)
RESET_TOKEN="token-from-email-here"

curl -X POST http://localhost:3000/api/v1/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "'$RESET_TOKEN'",
    "password": "NewSecurePass123!"
  }'
```

**Expected Response (200):**

```json
{
  "success": true,
  "message": "Password reset successful. Please login with your new password."
}
```

---

### 6. Refresh Access Token

```bash
# Save refresh token from login/register response
REFRESH_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl -X POST http://localhost:3000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "'$REFRESH_TOKEN'"
  }'
```

**Expected Response (200):**

```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "15m"
  }
}
```

---

### 7. Logout

```bash
curl -X POST http://localhost:3000/api/v1/auth/logout \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "'$REFRESH_TOKEN'"
  }'
```

**Expected Response (200):**

```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

### 8. Verify Email

```bash
# Use token from verification email (check console logs)
VERIFY_TOKEN="token-from-email-here"

curl -X POST http://localhost:3000/api/v1/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "token": "'$VERIFY_TOKEN'"
  }'
```

**Expected Response (200):**

```json
{
  "success": true,
  "message": "Email verified successfully!"
}
```

---

## 🧪 Testing with Postman

### Setup

1. **Import Collection:**
   - Create new collection: "Finsieve API"
   - Set base URL variable: `{{baseUrl}}` = `http://localhost:3000/api/v1`

2. **Environment Variables:**
   ```
   baseUrl: http://localhost:3000/api/v1
   accessToken: (will be set after login)
   refreshToken: (will be set after login)
   ```

### Test Sequence

**1. Register:**

- Method: POST
- URL: `{{baseUrl}}/auth/register`
- Body (JSON):
  ```json
  {
    "email": "test@finsieve.com",
    "password": "TestPass123!",
    "firstName": "Test",
    "lastName": "User"
  }
  ```
- Tests (JavaScript):
  ```javascript
  pm.test("Status is 201", () => {
    pm.response.to.have.status(201);
  });
  pm.test("Has access token", () => {
    const data = pm.response.json().data;
    pm.expect(data.accessToken).to.exist;
    pm.environment.set("accessToken", data.accessToken);
    pm.environment.set("refreshToken", data.refreshToken);
  });
  ```

**2. Login:**

- Method: POST
- URL: `{{baseUrl}}/auth/login`
- Body (JSON):
  ```json
  {
    "email": "test@finsieve.com",
    "password": "TestPass123!"
  }
  ```
- Tests:
  ```javascript
  pm.test("Status is 200", () => {
    pm.response.to.have.status(200);
  });
  pm.test("Login successful", () => {
    const response = pm.response.json();
    pm.expect(response.success).to.be.true;
    pm.environment.set("accessToken", response.data.accessToken);
  });
  ```

**3. Get Current User:**

- Method: GET
- URL: `{{baseUrl}}/auth/me`
- Headers:
  ```
  Authorization: Bearer {{accessToken}}
  ```
- Tests:
  ```javascript
  pm.test("Status is 200", () => {
    pm.response.to.have.status(200);
  });
  pm.test("Has user data", () => {
    const user = pm.response.json().data.user;
    pm.expect(user.email).to.exist;
  });
  ```

---

## 🔍 Error Cases

### 1. Invalid Email Format

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "invalid-email",
    "password": "SecurePass123!",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

**Response (400):**

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email address"
    }
  ]
}
```

### 2. Weak Password

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "123",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

**Response (400):**

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "password",
      "message": "Password must be at least 8 characters long"
    },
    {
      "field": "password",
      "message": "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    }
  ]
}
```

### 3. Email Already Exists

```bash
# Register same email twice
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "SecurePass123!",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

**Response (409):**

```json
{
  "success": false,
  "message": "An account with this email already exists"
}
```

### 4. Invalid Credentials

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "WrongPassword123!"
  }'
```

**Response (401):**

```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

### 5. No Authorization Header

```bash
curl -X GET http://localhost:3000/api/v1/auth/me
```

**Response (401):**

```json
{
  "success": false,
  "message": "Access denied. No token provided."
}
```

### 6. Invalid Token

```bash
curl -X GET http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer invalid-token-here"
```

**Response (401):**

```json
{
  "success": false,
  "message": "Invalid or expired token."
}
```

---

## 📋 Complete Test Script

Save this as `test-auth.sh`:

```bash
#!/bin/bash

BASE_URL="http://localhost:3000/api/v1"

echo "🧪 Testing Finsieve Authentication API"
echo "======================================"

# 1. Register
echo -e "\n1️⃣ Testing Registration..."
REGISTER_RESPONSE=$(curl -s -X POST $BASE_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@finsieve.com",
    "password": "TestPass123!",
    "firstName": "Test",
    "lastName": "User"
  }')

echo "$REGISTER_RESPONSE" | jq '.'

# Extract tokens
ACCESS_TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.data.accessToken')
REFRESH_TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.data.refreshToken')

# 2. Get current user
echo -e "\n2️⃣ Testing Get Current User..."
curl -s -X GET $BASE_URL/auth/me \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'

# 3. Logout
echo -e "\n3️⃣ Testing Logout..."
curl -s -X POST $BASE_URL/auth/logout \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\": \"$REFRESH_TOKEN\"}" | jq '.'

# 4. Login
echo -e "\n4️⃣ Testing Login..."
LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@finsieve.com",
    "password": "TestPass123!"
  }')

echo "$LOGIN_RESPONSE" | jq '.'

# Update tokens
ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.accessToken')
REFRESH_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.refreshToken')

# 5. Refresh token
echo -e "\n5️⃣ Testing Token Refresh..."
curl -s -X POST $BASE_URL/auth/refresh \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\": \"$REFRESH_TOKEN\"}" | jq '.'

# 6. Forgot password
echo -e "\n6️⃣ Testing Forgot Password..."
curl -s -X POST $BASE_URL/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@finsieve.com"
  }' | jq '.'

echo -e "\n✅ All tests completed!"
```

**Run tests:**

```bash
chmod +x test-auth.sh
./test-auth.sh
```

---

## 📊 Password Requirements

✅ Minimum 8 characters  
✅ At least one uppercase letter (A-Z)  
✅ At least one lowercase letter (a-z)  
✅ At least one number (0-9)  
✅ At least one special character (@$!%\*?&)

**Valid examples:**

- `SecurePass123!`
- `MyP@ssw0rd`
- `Test1234!@#$`

**Invalid examples:**

- `password` (no uppercase, number, or special char)
- `PASSWORD123!` (no lowercase)
- `Password` (no number or special char)
- `Pass1!` (too short, less than 8 chars)

---

## 🔐 JWT Token Structure

**Access Token (15 minutes expiry):**

```json
{
  "userId": "uuid-here",
  "email": "user@example.com",
  "type": "access",
  "iat": 1234567890,
  "exp": 1234568790
}
```

**Refresh Token (7 days expiry):**

```json
{
  "userId": "uuid-here",
  "email": "user@example.com",
  "type": "refresh",
  "iat": 1234567890,
  "exp": 1235172690
}
```

---

## 📧 Email Flow (Development Mode)

All emails are logged to the console in development mode:

1. **Welcome Email** - Sent on registration
2. **Email Verification** - Sent on registration
3. **Password Reset** - Sent on forgot password request

Check server console for email content and tokens!

---

## 🎯 Next Steps

After authentication is working:

1. **Update Frontend** - Connect React to these APIs
2. **User Management APIs** - Profile, preferences
3. **Watchlist APIs** - Create, read, update, delete
4. **Market Data APIs** - Search, quotes, historical data

---

**API Documentation Complete! 🎉**

Test the endpoints and let me know when you're ready to integrate with the frontend!
