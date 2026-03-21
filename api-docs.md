# Simplified Dianping API Documentation

## Base URL
`/api`

## Authentication
Some endpoints require a JWT token in the `Authorization` header:
`Authorization: Bearer <token>`

---

## 1. Auth API

### POST /auth/register
Register a new user.
**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "User Name",
  "phone": "13800000000"
}
```

### POST /auth/login
Login and receive a token.
**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

---

## 2. Merchants API

### GET /merchants
Get list of merchants with optional filters.
**Query Params:**
- `category`: Category ID
- `keyword`: Search keyword
- `sort`: `rating` or `newest`
- `page`: Page number (default 1)
- `limit`: Items per page (default 20)

### GET /merchants/categories
Get list of all merchant categories.

### GET /merchants/:id
Get detailed information for a specific merchant.

---

## 3. Reviews API

### POST /reviews (Auth Required)
Post a new review for a merchant.
**Body:**
```json
{
  "merchantId": 1,
  "rating": 5,
  "content": "Great place!"
}
```

### GET /reviews/merchant/:merchantId
Get all reviews for a specific merchant.
