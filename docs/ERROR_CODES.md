# API Error Codes Reference

This document provides a comprehensive reference for all error codes returned by the Rewise AI API.

## Error Code Format

All error codes follow the pattern: `[CATEGORY]_[NUMBER]`

- **Category**: Type of error (AUTH, VAL, RES, AI, EXT, ERR)
- **Number**: Sequential identifier within the category

## Error Response Format

All errors are returned in this standardized JSON format:

```json
{
  "success": false,
  "error": "Human-readable error message",
  "code": "CATEGORY_001",
  "details": {
    "field": "fieldName",
    "message": "Additional context"
  },
  "timestamp": "2026-05-21T12:00:00.000Z"
}
```

---

## Authentication Errors (401, 403)

### AUTH_001: Invalid Token
**HTTP Status:** `401 Unauthorized`

Token is malformed, invalid, or doesn't match the signature.

**Example:**
```json
{
  "success": false,
  "error": "Invalid authentication token.",
  "code": "AUTH_001"
}
```

**Resolution:** User should log in again to get a fresh token.

---

### AUTH_002: Token Expired
**HTTP Status:** `401 Unauthorized`

JWT token has expired and is no longer valid.

**Example:**
```json
{
  "success": false,
  "error": "Your session has expired. Please log in again.",
  "code": "AUTH_002"
}
```

**Resolution:** Redirect user to login page or refresh token endpoint.

---

### AUTH_003: Missing Token
**HTTP Status:** `401 Unauthorized`

Authorization header is missing or doesn't contain a Bearer token.

**Example:**
```json
{
  "success": false,
  "error": "Authentication token is required.",
  "code": "AUTH_003"
}
```

**Resolution:** Include Authorization header: `Authorization: Bearer <token>`

---

### AUTH_004: User Not Found
**HTTP Status:** `401 Unauthorized`

User from the token no longer exists in the database.

**Example:**
```json
{
  "success": false,
  "error": "User not found. Token may be invalid.",
  "code": "AUTH_004"
}
```

**Resolution:** User account may have been deleted. Require re-authentication.

---

### AUTH_005: Invalid Credentials
**HTTP Status:** `401 Unauthorized`

Email or password is incorrect during login.

**Example:**
```json
{
  "success": false,
  "error": "Invalid email or password.",
  "code": "AUTH_005"
}
```

**Resolution:** Check email/password and try again.

---

## Validation Errors (400)

### VAL_001: Validation Failed
**HTTP Status:** `400 Bad Request`

One or more fields in the request failed validation.

**Example:**
```json
{
  "success": false,
  "error": "The provided data failed validation.",
  "code": "VAL_001",
  "details": [
    {
      "field": "text",
      "message": "Highlighted text is required"
    },
    {
      "field": "sourceUrl",
      "message": "Must be a valid URL with protocol"
    }
  ]
}
```

**Resolution:** Check the details array for which fields failed and fix them.

---

### VAL_002: Invalid Object ID
**HTTP Status:** `400 Bad Request`

MongoDB ObjectId format is invalid.

**Example:**
```json
{
  "success": false,
  "error": "Invalid resource ID format.",
  "code": "VAL_002",
  "details": {
    "field": "id",
    "value": "not-a-valid-id"
  }
}
```

**Resolution:** Ensure ID is a valid 24-character MongoDB ObjectId.

---

### VAL_003: Invalid Email
**HTTP Status:** `400 Bad Request`

Email address format is invalid.

**Example:**
```json
{
  "success": false,
  "error": "Invalid email address.",
  "code": "VAL_003"
}
```

**Resolution:** Provide a valid email format (example@domain.com).

---

### VAL_004: Invalid URL
**HTTP Status:** `400 Bad Request`

URL is malformed or missing protocol.

**Example:**
```json
{
  "success": false,
  "error": "Invalid URL provided.",
  "code": "VAL_004"
}
```

**Resolution:** Ensure URL includes protocol (http:// or https://).

---

### VAL_005: Missing Required Field
**HTTP Status:** `400 Bad Request`

A required field is missing from the request body.

**Example:**
```json
{
  "success": false,
  "error": "Required field is missing.",
  "code": "VAL_005"
}
```

**Resolution:** Include all required fields in the request.

---

## Resource Errors (404)

### RES_001: Resource Not Found
**HTTP Status:** `404 Not Found`

Generic resource not found error.

**Example:**
```json
{
  "success": false,
  "error": "Resource not found.",
  "code": "RES_001"
}
```

---

### RES_002: Highlight Not Found
**HTTP Status:** `404 Not Found`

Requested highlight doesn't exist or user doesn't have access to it.

**Example:**
```json
{
  "success": false,
  "error": "Highlight not found.",
  "code": "RES_002"
}
```

**Resolution:** Verify the highlight ID is correct and belongs to the authenticated user.

---

### RES_003: User Not Found
**HTTP Status:** `404 Not Found`

User profile doesn't exist.

**Example:**
```json
{
  "success": false,
  "error": "User not found.",
  "code": "RES_003"
}
```

---

## Conflict Errors (409)

### CONF_001: Duplicate Entry
**HTTP Status:** `409 Conflict`

Entry already exists (e.g., duplicate email).

**Example:**
```json
{
  "success": false,
  "error": "This entry already exists. (Duplicate: email)",
  "code": "CONF_001",
  "details": {
    "field": "email",
    "value": "user@example.com"
  }
}
```

**Resolution:** Use a unique value for the field.

---

### CONF_002: Resource Already Exists
**HTTP Status:** `409 Conflict`

Resource already exists in the system.

**Example:**
```json
{
  "success": false,
  "error": "Resource already exists.",
  "code": "CONF_002"
}
```

---

## Rate Limiting Errors (429)

### RATE_001: Rate Limit Exceeded
**HTTP Status:** `429 Too Many Requests`

API rate limit exceeded. Max 100 requests per 15 minutes.

**Example:**
```json
{
  "success": false,
  "error": "Too many requests. Please try again later.",
  "code": "RATE_001"
}
```

**Resolution:** Wait before making more requests. Check `Retry-After` header.

---

### RATE_002: Auth Rate Limit Exceeded
**HTTP Status:** `429 Too Many Requests`

Too many login attempts. Max 20 attempts per 15 minutes.

**Example:**
```json
{
  "success": false,
  "error": "Too many login attempts. Please try again later.",
  "code": "RATE_002"
}
```

**Resolution:** Wait before trying to log in again.

---

## AI Processing Errors (5xx)

### AI_001: AI Processing Failed
**HTTP Status:** `500 Internal Server Error`

AI service failed to process the request.

**Example:**
```json
{
  "success": false,
  "error": "AI processing failed. Please try again.",
  "code": "AI_001"
}
```

**Resolution:** Retry the request or check system status.

---

### AI_002: AI Provider Unavailable
**HTTP Status:** `503 Service Unavailable`

AI provider (Gemini, HuggingFace, Ollama) is unavailable.

**Example:**
```json
{
  "success": false,
  "error": "AI service is temporarily unavailable.",
  "code": "AI_002"
}
```

**Resolution:** Check AI provider status and retry later.

---

### AI_003: AI Quota Exceeded
**HTTP Status:** `429 Too Many Requests`

AI provider quota has been exceeded.

**Example:**
```json
{
  "success": false,
  "error": "AI quota exceeded. Please try again later.",
  "code": "AI_003"
}
```

**Resolution:** Wait for quota reset or upgrade AI plan.

---

## External Service Errors (503)

### EXT_001: MongoDB Connection Failed
**HTTP Status:** `503 Service Unavailable`

Cannot connect to MongoDB database.

**Example:**
```json
{
  "success": false,
  "error": "Database connection failed.",
  "code": "EXT_001"
}
```

**Resolution:** Check MongoDB Atlas connection string and network access.

---

### EXT_002: Redis Connection Failed
**HTTP Status:** `503 Service Unavailable`

Cannot connect to Redis.

**Example:**
```json
{
  "success": false,
  "error": "Cache service failed.",
  "code": "EXT_002"
}
```

**Resolution:** Check Redis availability and connection URL.

---

### EXT_003: Email Service Failed
**HTTP Status:** `503 Service Unavailable`

Cannot send email (SMTP error).

**Example:**
```json
{
  "success": false,
  "error": "Email service failed.",
  "code": "EXT_003"
}
```

**Resolution:** Check SMTP credentials and email server status.

---

### EXT_004: Google OAuth Failed
**HTTP Status:** `500 Internal Server Error`

Google OAuth authentication failed.

**Example:**
```json
{
  "success": false,
  "error": "Google authentication failed.",
  "code": "EXT_004"
}
```

**Resolution:** Check Google OAuth credentials and settings.

---

## General Errors (500)

### ERR_001: Internal Server Error
**HTTP Status:** `500 Internal Server Error`

Generic internal server error.

**Example:**
```json
{
  "success": false,
  "error": "Internal server error. Please try again later.",
  "code": "ERR_001"
}
```

**Resolution:** Retry request or contact support if issue persists.

---

### ERR_999: Unknown Error
**HTTP Status:** `500 Internal Server Error`

An unexpected error occurred.

**Example:**
```json
{
  "success": false,
  "error": "An unknown error occurred.",
  "code": "ERR_999"
}
```

**Resolution:** Check logs and contact support.

---

## Using Error Codes in Frontend

### Example: Handling AUTH_002 (Token Expired)

```javascript
async function makeAuthenticatedRequest(url, options) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle token expiration
      if (data.code === 'AUTH_002') {
        // Clear auth and redirect to login
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
      }

      // Handle other errors
      console.error(`Error [${data.code}]: ${data.error}`);
      throw new Error(data.error);
    }

    return data;
  } catch (error) {
    console.error('Request failed:', error);
    throw error;
  }
}
```

---

## Status Code Summary

| Code | Category | Meaning |
|------|----------|---------|
| 400 | VAL_* | Validation error in request |
| 401 | AUTH_* | Authentication failed |
| 404 | RES_* | Resource not found |
| 409 | CONF_* | Resource conflict |
| 429 | RATE_*, AI_003 | Too many requests |
| 500 | AI_*, EXT_*, ERR_* | Server error |
| 503 | EXT_* | Service unavailable |

---

## Best Practices

1. **Always check the error code**, not just the message
2. **Log error codes** for debugging and analytics
3. **Implement retry logic** for RATE_* and EXT_* errors
4. **Redirect to login** for AUTH_002 (token expired)
5. **Show user-friendly messages** from the error field
6. **Include error codes in support tickets** for faster resolution

