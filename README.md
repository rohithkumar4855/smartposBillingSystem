# 🧾 Smart Billing API

A RESTful API built with **Node.js**, **Express**, and **PostgreSQL** for store registration, phone verification, and login authentication.

---

## 📘 API Endpoints

### 1️⃣ Register Store
**Endpoint:** `POST /api/auth/register`  
**Purpose:** Register a new store.

**Request:**
```json
{
  "storeName": "Smart Mart",
  "ownerName": "Ravi",
  "email": "mari02@example.com",
  "phone": "9876543210",
  "gstNumber": "29ABCDE1234F1Z9",
  "address": "Hyderabad, India",
  "logoUrl": "https://example.com/logo.png"
}
2️⃣ Verify Phone Number

Endpoint: POST /api/auth/verify-phone
Purpose: Check if phone number is registered and send OTP.

Request:

{
  "phone": "9876543210"
}
3️⃣ Login

Endpoint: POST /api/auth/login
Purpose: Log in with phone number and OTP to receive JWT token.

Request:

{
  "phone": "9876543210",
  "otp": "123456"
}
4️⃣ Get All Stores (Admin Only)

Method: GET
Endpoint: /api/auth
Purpose: List all registered stores (Admin Only).

Headers:

Authorization: Bearer superadmin123

5. Get Store by ID (Admin only)

GET /api/auth/{storeId}

Headers:

Authorization: superadmin123


Response:

{
  "storeId": 1,
  "storeName": "Smart Mart",
  "email": "ravi@example.com",
  "address": "Hyderabad, India",
  "gstNumber": "29ABCDE1234F1Z9",
  "status": "active"
}

6. Update Store (Admin only)

PUT /api/auth/{storeId}

Headers:

Authorization: superadmin123


Body: (any field can be updated)

{
  "storeName": "Updated Mart",
  "phone": "9876543210",
  "address": "New Address",
  "logoUrl": "https://example.com/new-logo.png"
}


Response:

{
  "status": "updated"
}

Method: DELETE

URL: https://smart-billing-production.up.railway.app/api/auth/1

Headers:

Authorization: superadmin123


Response:

{ "status": "deleted" }

Notes:
// here main point is we need to install CORS package.........otherwise we get errors while consuming the apis....... 

Admin authorization is required for GET all stores, GET by ID, and Update APIs.

JWT token is returned on successful login.
