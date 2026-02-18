# EdVISORY Expense Tracker API - Postman Collection

## 🚀 Quick Start

### 1. Base URL
```
http://localhost:3000
```

### 2. Authentication
- **Login First**: ทุก API (ยกเว้น `/register` และ `/login`) ต้องมี authentication
- **Session Token**: ได้จาก response หลัง login ใช้ใน `Authorization: Bearer <token>`

---

## 🔐 Authentication APIs

### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "testuser",
  "email": "test@example.com", 
  "password": "Test1234!",
  "firstName": "Test",
  "lastName": "User",
  "language": "en"
}
```

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "testuser",
  "password": "Test1234!",
  "deviceInfo": {
    "userAgent": "Postman Runtime/7.32.3",
    "ip": "127.0.0.1",
    "deviceId": "postman-device-001"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "session_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_at": "2024-01-19T10:30:00.000Z", // missing
    "user": {
      "id": 1,
      "username": "testuser",
      "email": "test@example.com",
      "firstName": "Test",
      "lastName": "User"
    }
  }
}
```

### Logout
```http
POST /api/auth/logout
Authorization: Bearer <session_token>
```

### Logout All Devices
```http
POST /api/auth/logout-all
Authorization: Bearer <session_token>
```

---

## 💳 Account APIs

### Get All Accounts
```http
GET /api/accounts?page=1&limit=20
Authorization: Bearer <session_token>
```

### Create Account
```http
POST /api/accounts
Authorization: Bearer <session_token>
Content-Type: application/json

{
  "name": "Test Bank Account",
  "account_type": "bank_account",
  "bank_name": "Kasikornbank",
  "account_number": "123-456-7890",
  "initial_balance": 10000,
  "currency": "THB"
}
```

### Get Account by ID
```http
GET /api/accounts/1
Authorization: Bearer <session_token>
```

### Update Account
```http
PATCH /api/accounts/1
Authorization: Bearer <session_token>
Content-Type: application/json

{
  "name": "Updated Account Name",
  "current_balance": 15000
}
```

### Delete Account (Soft Delete)
```http
DELETE /api/accounts/1
Authorization: Bearer <session_token>
```

---

## 📁 Category APIs

### Get All Categories
```http
GET /api/categories?page=1&limit=50&is_expense=true
Authorization: Bearer <session_token>
```

### Create Category
```http
POST /api/categories
Authorization: Bearer <session_token>
Content-Type: application/json

{
  "name": "Food & Dining",
  "description": "Restaurants and food delivery",
  "color": "#F44336",
  "icon": "restaurant",
  "is_expense": true
}
```

### Get Category by ID
```http
GET /api/categories/1
Authorization: Bearer <session_token>
```

### Update Category
```http
PATCH /api/categories/1
Authorization: Bearer <session_token>
Content-Type: application/json

{
  "name": "Updated Category",
  "color": "#2196F3"
}
```

### Delete Category (Soft Delete)
```http
DELETE /api/categories/1
Authorization: Bearer <session_token>
```

---

## 💰 Transaction APIs

### Get All Transactions
```http
GET /api/transactions?page=1&limit=20&start_date=2024-01-01&end_date=2024-01-31&transaction_type=expense
Authorization: Bearer <session_token>
```

### Create Transaction
```http
POST /api/transactions
Authorization: Bearer <session_token>
Content-Type: application/json

{
  "account_id": 1,
  "category_id": 1,
  "amount": 500.00,
  "transaction_type": "expense",
  "description": "Lunch at restaurant",
  "notes": "Had lunch with colleagues",
  "transaction_date": "2024-01-15",
  "transaction_time": "12:30",
  "location": "Bangkok",
  "tags": ["food", "lunch"],
  "is_recurring": false
}
```

### Get Transaction by ID
```http
GET /api/transactions/1
Authorization: Bearer <session_token>
```

### Update Transaction
```http
PATCH /api/transactions/1
Authorization: Bearer <session_token>
Content-Type: application/json

{
  "amount": 450.00,
  "description": "Updated transaction description",
  "notes": "Updated notes"
}
```

### Delete Transaction
```http
DELETE /api/transactions/1
Authorization: Bearer <session_token>
```

---

## 📊 Report APIs

### Transaction Summary
```http
GET /api/reports/transaction-summary?start_date=2024-01-01&end_date=2024-01-31&group_by=month&transaction_type=expense
Authorization: Bearer <session_token>
```

### Daily Spending Analysis
```http
GET /api/reports/daily-spending?month=1&year=2024&target_monthly_spending=30000
Authorization: Bearer <session_token>
```

### Account Summary
```http
GET /api/reports/account-summary
Authorization: Bearer <session_token>
```

### Category Spending
```http
GET /api/reports/category-spending?start_date=2024-01-01&end_date=2024-01-31
Authorization: Bearer <session_token>
```

---

## 🏥 Health Check

### Server Health
```http
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-18T10:30:00.000Z",
  "uptime": 3600.5,
  "version": "1.0.0"
}
```

---

## 🔧 Environment Setup

### 1. Database Setup
```bash
# Sync database tables
npm run db:sync

# Seed sample data
npm run db:seed

# Start server
npm run dev
```

### 2. Test Credentials
- **Username**: `testuser`
- **Password**: `Test1234!`
- **Email**: `test@example.com`

---

## 📝 Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information"
}
```

---

## 🌍 Multi-Language Support

Headers:
```
Accept-Language: th
```

Supported Languages:
- `en` - English
- `th` - Thai

---

## 🚨 Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 404 | Not Found |
| 409 | Conflict |
| 500 | Internal Server Error |

---

## 💡 Tips for Testing

1. **Use Environment Variables**: ตั้งค่า `.env` ให้ถูกต้องก่อนรัน
2. **Database Connection**: ตรวจสอบว่า PostgreSQL ทำงานอยู่
3. **Session Management**: Token มีอายุ 24 ชั่วโมง
4. **Pagination**: ใช้ `page` และ `limit` สำหรับข้อมูลจำนวนมาก
5. **Filtering**: ใช้ query parameters สำหรับ filtering ข้อมูล

---

## 📱 Postman Setup

1. **Import Collection**: คัดลอก requests ข้างบนไปยัง Postman
2. **Set Variables**: 
   - `baseUrl`: `http://localhost:3000`
   - `token`: `{{login.response.data.session_token}}`
3. **Authorization**: ตั้งค่า `Bearer {{token}}` ใน Authorization tab
4. **Environment**: สร้าง environment สำหรับ development/production

**Happy Testing! 🎉**
