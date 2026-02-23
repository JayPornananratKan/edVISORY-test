# EdVISORY API Documentation

## Overview

EdVISORY Expense Tracker API - RESTful API สำหรับจัดการรายรับ-จ่ายส่วนตัว

**Base URL:** `http://localhost:3000/api`

**Authentication:** Bearer Token (จาก login response)

**Supported Languages:** `en` (English), `th` (Thai)

**Features:**
- 🔐 Multi-user authentication with device tracking
- 💳 Account management (bank accounts, credit cards, cash)
- 🏷️ Category management (income/expense categories)
- 💰 Transaction tracking with attachments
- 📊 Reports and analytics
- 🌐 Multi-language support
- 📱 File upload support
- 🔍 Advanced filtering and pagination

---

## Authentication

### Register User
```http
POST /api/auth/register
```

**Request Body:**
```json
{
  "username": "string",
  "email": "string", 
  "password": "string",
  "firstName": "string",
  "lastName": "string",
  "language": "en"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "language": "en",
    "isActive": true,
    "createdAt": "2026-02-24T10:30:00.000Z"
  }
}
```

**Error Responses:**
```json
// 400 - Validation Error
{
  "success": false,
  "message": "Validation error",
  "error": "Username is required"
}

// 409 - Conflict
{
  "success": false,
  "message": "Username already exists",
  "error": "Username already exists"
}
```

---

### Login User
```http
POST /api/auth/login
```

**Headers:**
```http
Content-Type: application/json
User-Agent: Mozilla/5.0...
X-Device-ID: optional-device-uuid
```

**Request Body:**
```json
{
  "username": "string",
  "password": "string",
  "deviceInfo": {
    "userAgent": "Postman/1.0.0",
    "ip": "127.0.0.1",
    "deviceId": "postman-device-001"
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "session_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_at": "2026-02-25T10:30:00.000Z",
    "user": {
      "id": 1,
      "username": "johndoe",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "language": "en",
      "isActive": true,
      "lastLoginAt": "2026-02-24T10:30:00.000Z"
    }
  }
}
```

**Error Responses:**
```json
// 401 - Invalid Credentials
{
  "success": false,
  "message": "Invalid credentials",
  "error": "Invalid credentials"
}

// 423 - Account Locked
{
  "success": false,
  "message": "Account locked due to too many failed attempts",
  "error": "Account locked"
}
```

---

### Logout User
```http
POST /api/auth/logout
Authorization: Bearer {session_token}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

### Logout All Devices
```http
POST /api/auth/logout-all
Authorization: Bearer {session_token}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out from all devices successfully"
}
```

---

## Accounts

### Get All Accounts
```http
GET /api/accounts?page=1&limit=20
Authorization: Bearer {session_token}
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 20 | Items per page (max 100) |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Savings Account",
      "account_type": "bank_account",
      "bank_name": "Bangkok Bank",
      "account_number": "1234567890",
      "initial_balance": 10000.00,
      "current_balance": 15000.00,
      "currency": "THB",
      "is_active": true,
      "created_at": "2026-02-24T10:30:00.000Z",
      "updated_at": "2026-02-24T12:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

---

### Create Account
```http
POST /api/accounts
Authorization: Bearer {session_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "string",
  "account_type": "bank_account|cash|credit_card|digital_wallet|investment|other",
  "bank_name": "string (optional)",
  "account_number": "string (optional)",
  "initial_balance": 10000.00,
  "currency": "THB"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Account created successfully",
  "data": {
    "id": 2,
    "name": "Credit Card",
    "account_type": "credit_card",
    "bank_name": "Kasikorn Bank",
    "account_number": "4532123456789012",
    "initial_balance": 0.00,
    "current_balance": 0.00,
    "currency": "THB",
    "is_active": true,
    "created_at": "2026-02-24T14:30:00.000Z"
  }
}
```

---

### Get Account by ID
```http
GET /api/accounts/{id}
Authorization: Bearer {session_token}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Savings Account",
    "account_type": "bank_account",
    "bank_name": "Bangkok Bank",
    "account_number": "1234567890",
    "initial_balance": 10000.00,
    "current_balance": 15000.00,
    "currency": "THB",
    "is_active": true,
    "created_at": "2026-02-24T10:30:00.000Z",
    "updated_at": "2026-02-24T12:30:00.000Z"
  }
}
```

**Error Responses:**
```json
// 404 - Not Found
{
  "success": false,
  "message": "Account not found",
  "error": "Account not found"
}
```

---

### Update Account
```http
PUT /api/accounts/{id}
Authorization: Bearer {session_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "string (optional)",
  "bank_name": "string (optional)",
  "account_number": "string (optional)",
  "is_active": "boolean (optional)"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Account updated successfully",
  "data": {
    "id": 1,
    "name": "Updated Savings Account",
    "account_type": "bank_account",
    "bank_name": "Updated Bank",
    "account_number": "9876543210",
    "initial_balance": 10000.00,
    "current_balance": 15000.00,
    "currency": "THB",
    "is_active": true,
    "updated_at": "2026-02-24T16:30:00.000Z"
  }
}
```

---

### Delete Account
```http
DELETE /api/accounts/{id}
Authorization: Bearer {session_token}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Account deleted successfully"
}
```

**Error Responses:**
```json
// 400 - Cannot Delete
{
  "success": false,
  "message": "Cannot delete account with existing transactions",
  "error": "Cannot delete account with existing transactions"
}
```

---

## Categories

### Get All Categories
```http
GET /api/categories?page=1&limit=20&type=expense
Authorization: Bearer {session_token}
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 20 | Items per page |
| type | string | all | Filter by type: income/expense/all |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Food & Dining",
      "description": "Restaurants, groceries, food delivery",
      "color": "#FF6B6B",
      "icon": "🍔",
      "parent_id": null,
      "is_expense": true,
      "is_active": true,
      "created_at": "2026-02-24T10:30:00.000Z",
      "updated_at": "2026-02-24T10:30:00.000Z"
    },
    {
      "id": 2,
      "name": "Salary",
      "description": "Monthly salary and bonuses",
      "color": "#4ECDC4",
      "icon": "💰",
      "parent_id": null,
      "is_expense": false,
      "is_active": true,
      "created_at": "2026-02-24T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 15,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

---

### Create Category
```http
POST /api/categories
Authorization: Bearer {session_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "string",
  "description": "string (optional)",
  "color": "#FF6B6B (optional)",
  "icon": "🍔 (optional)",
  "parent_id": 1 (optional)",
  "is_expense": true
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Category created successfully",
  "data": {
    "id": 3,
    "name": "Transportation",
    "description": "Public transport, gasoline, parking",
    "color": "#95E1D3",
    "icon": "🚗",
    "parent_id": null,
    "is_expense": true,
    "is_active": true,
    "created_at": "2026-02-24T14:30:00.000Z"
  }
}
```

---

### Update Category
```http
PUT /api/categories/{id}
Authorization: Bearer {session_token}
Content-Type: application/json
```

**Response (200):**
```json
{
  "success": true,
  "message": "Category updated successfully",
  "data": {
    "id": 1,
    "name": "Updated Food & Dining",
    "description": "Updated description",
    "color": "#FF6B6B",
    "icon": "🍽️",
    "parent_id": null,
    "is_expense": true,
    "is_active": true,
    "updated_at": "2026-02-24T16:30:00.000Z"
  }
}
```

---

### Delete Category
```http
DELETE /api/categories/{id}
Authorization: Bearer {session_token}
```

**Error Responses:**
```json
// 400 - Has Transactions
{
  "success": false,
  "message": "Cannot delete category with existing transactions",
  "error": "Cannot delete category with existing transactions"
}

// 400 - Has Children
{
  "success": false,
  "message": "Cannot delete category with subcategories",
  "error": "Cannot delete category with subcategories"
}
```

---

## Transactions

### Get All Transactions
```http
GET /api/transactions?page=1&limit=20&start_date=2026-02-01&end_date=2026-02-28&transaction_type=expense&account_id=1&category_id=1
Authorization: Bearer {session_token}
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 20 | Items per page |
| start_date | string | - | YYYY-MM-DD format |
| end_date | string | - | YYYY-MM-DD format |
| transaction_type | string | all | income/expense/all |
| account_id | number | - | Filter by account |
| category_id | number | - | Filter by category |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "account_id": 1,
      "category_id": 1,
      "amount": 150.50,
      "transaction_type": "expense",
      "description": "Lunch at restaurant",
      "notes": "Business meeting",
      "transaction_date": "2026-02-15",
      "transaction_time": "12:30:00",
      "location": "Bangkok",
      "tags": ["business", "lunch"],
      "is_recurring": false,
      "recurring_pattern": null,
      "recurring_end_date": null,
      "reference_number": null,
      "account": {
        "id": 1,
        "name": "Savings Account",
        "account_type": "bank_account"
      },
      "category": {
        "id": 1,
        "name": "Food & Dining",
        "color": "#FF6B6B",
        "is_expense": true
      },
      "created_at": "2026-02-15T12:30:00.000Z",
      "updated_at": "2026-02-15T12:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

### Create Transaction
```http
POST /api/transactions
Authorization: Bearer {session_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "account_id": 1,
  "category_id": 1,
  "amount": 150.50,
  "transaction_type": "expense",
  "description": "Lunch at restaurant",
  "notes": "Business meeting (optional)",
  "transaction_date": "2026-02-15",
  "transaction_time": "12:30:00 (optional)",
  "location": "Bangkok (optional)",
  "tags": ["business", "lunch"] (optional),
  "is_recurring": false (optional),
  "recurring_pattern": "monthly" (optional),
  "recurring_end_date": "2026-12-31" (optional),
  "reference_number": "INV-001" (optional)
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Transaction created successfully",
  "data": {
    "id": 2,
    "account_id": 1,
    "category_id": 1,
    "amount": 150.50,
    "transaction_type": "expense",
    "description": "Lunch at restaurant",
    "notes": "Business meeting",
    "transaction_date": "2026-02-15",
    "transaction_time": "12:30:00",
    "location": "Bangkok",
    "tags": ["business", "lunch"],
    "is_recurring": false,
    "recurring_pattern": null,
    "recurring_end_date": null,
    "reference_number": null,
    "created_at": "2026-02-15T14:30:00.000Z"
  }
}
```

---

### Get Transaction by ID
```http
GET /api/transactions/{id}
Authorization: Bearer {session_token}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "account_id": 1,
    "category_id": 1,
    "amount": 150.50,
    "transaction_type": "expense",
    "description": "Lunch at restaurant",
    "notes": "Business meeting",
    "transaction_date": "2026-02-15",
    "transaction_time": "12:30:00",
    "location": "Bangkok",
    "tags": ["business", "lunch"],
    "is_recurring": false,
    "recurring_pattern": null,
    "recurring_end_date": null,
    "reference_number": null,
    "account": {
      "id": 1,
      "name": "Savings Account",
      "account_type": "bank_account"
    },
    "category": {
      "id": 1,
      "name": "Food & Dining",
      "color": "#FF6B6B",
      "is_expense": true
    },
    "attachments": [
      {
        "id": 1,
        "file_name": "receipt.jpg",
        "original_name": "restaurant_receipt.jpg",
        "file_size": 2048576,
        "mime_type": "image/jpeg",
        "uploaded_at": "2026-02-15T14:30:00.000Z"
      }
    ],
    "created_at": "2026-02-15T12:30:00.000Z",
    "updated_at": "2026-02-15T12:30:00.000Z"
  }
}
```

---

### Update Transaction
```http
PUT /api/transactions/{id}
Authorization: Bearer {session_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "account_id": 2 (optional),
  "category_id": 3 (optional),
  "amount": 200.00 (optional),
  "transaction_type": "expense (optional)",
  "description": "Updated description (optional)",
  "notes": "Updated notes (optional)",
  "transaction_date": "2026-02-16 (optional),"
  "transaction_time": "13:00:00 (optional)",
  "location": "Updated location (optional)",
  "tags": ["updated", "tags"] (optional),
  "is_recurring": true (optional),
  "recurring_pattern": "weekly" (optional),
  "recurring_end_date": "2024-06-30" (optional)
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Transaction updated successfully",
  "data": {
    "id": 1,
    "account_id": 2,
    "category_id": 3,
    "amount": 200.00,
    "transaction_type": "expense",
    "description": "Updated description",
    "notes": "Updated notes",
    "transaction_date": "2026-02-16",
    "transaction_time": "13:00:00",
    "location": "Updated location",
    "tags": ["updated", "tags"],
    "is_recurring": true,
    "recurring_pattern": "weekly",
    "recurring_end_date": "2026-06-30",
    "reference_number": null,
    "updated_at": "2026-02-15T16:30:00.000Z"
  }
}
```

---

### Delete Transaction
```http
DELETE /api/transactions/{id}
Authorization: Bearer {session_token}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Transaction deleted successfully"
}
```

---

## File Attachments

### Upload Transaction Attachment
```http
POST /api/transactions/{transaction_id}/attachments
Authorization: Bearer {session_token}
Content-Type: multipart/form-data
```

**Request Body (multipart/form-data):**
```
file: [binary file data]
```

**Response (201):**
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "id": 1,
    "transaction_id": 1,
    "file_name": "receipt_20260215_143000.jpg",
    "original_name": "restaurant_receipt.jpg",
    "file_path": "/uploads/transactions/receipt_20260215_143000.jpg",
    "file_size": 2048576,
    "mime_type": "image/jpeg",
    "file_hash": "sha256:abc123...",
    "uploaded_at": "2026-02-15T14:30:00.000Z"
  }
}
```

**Error Responses:**
```json
// 400 - File Too Large
{
  "success": false,
  "message": "File size exceeds maximum limit",
  "error": "File size exceeds maximum limit"
}

// 400 - Invalid File Type
{
  "success": false,
  "message": "Invalid file type",
  "error": "Invalid file type"
}
```

---

### Download Attachment
```http
GET /api/attachments/{attachment_id}/download
Authorization: Bearer {session_token}
```

**Response (200):**
```
Content-Type: image/jpeg
Content-Disposition: attachment; filename="receipt.jpg"
Content-Length: 2048576

[binary file data]
```

---

### Delete Attachment
```http
DELETE /api/attachments/{attachment_id}
Authorization: Bearer {session_token}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Attachment deleted successfully"
}
```

---

## Export/Import

### Export Transactions
```http
GET /api/data/export?format=excel&start_date=2026-02-01&end_date=2026-02-28&account_ids=1,2&category_ids=1,3&transaction_type=expense
Authorization: Bearer {session_token}
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| format | string | csv | Export format: excel/csv/json/googlesheet |
| start_date | string | - | YYYY-MM-DD format |
| end_date | string | - | YYYY-MM-DD format |
| account_ids | string | - | Comma-separated account IDs |
| category_ids | string | - | Comma-separated category IDs |
| transaction_type | string | all | income/expense/all |
| include_attachments | boolean | false | Include attachment info |

**Response (200):**
```
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="transactions_2026-02-15.xlsx"

[Excel file data]
```

---

### Import Transactions
```http
POST /api/data/import?format=csv
Authorization: Bearer {session_token}
Content-Type: multipart/form-data
```

**Request Body (multipart/form-data):**
```
file: [binary file data]
```

**Response (200):**
```json
{
  "success": true,
  "message": "Import completed with 45 successful and 2 failed",
  "data": {
    "imported_count": 45,
    "failed_count": 2,
    "errors": [
      "Row 12: Invalid amount format",
      "Row 28: Date is required"
    ],
    "imported_transactions": [
      {
        "id": 123,
        "description": "Imported transaction",
        "amount": 150.50
      }
    ]
  }
}
```

---

### Get Import Template
```http
GET /api/data/template?format=excel
Authorization: Bearer {session_token}
```

**Response (200):**
```
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="import_template_2026-02-15.xlsx"

[Excel template file with sample data]
```

---

### Get Supported Formats
```http
GET /api/data/formats
Authorization: Bearer {session_token}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "export_formats": [
      {
        "format": "excel",
        "extension": ".xlsx",
        "mime_type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "description": "Microsoft Excel format with formatting"
      },
      {
        "format": "csv",
        "extension": ".csv",
        "mime_type": "text/csv",
        "description": "Comma-separated values format"
      },
      {
        "format": "json",
        "extension": ".json",
        "mime_type": "application/json",
        "description": "JSON format with metadata"
      },
      {
        "format": "googlesheet",
        "extension": ".json",
        "mime_type": "application/json",
        "description": "Google Sheets integration format"
      }
    ],
    "import_formats": [
      {
        "format": "excel",
        "extension": ".xlsx",
        "mime_type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "description": "Microsoft Excel format"
      },
      {
        "format": "csv",
        "extension": ".csv",
        "mime_type": "text/csv",
        "description": "Comma-separated values format"
      },
      {
        "format": "json",
        "extension": ".json",
        "mime_type": "application/json",
        "description": "JSON format"
      }
    ],
    "max_file_size": "10MB",
    "supported_columns": [
      "date", "time", "description", "notes", "amount", "type",
      "account_name", "category_name", "location", "tags",
      "is_recurring", "recurring_pattern", "reference_number"
    ]
  }
}
```

---

### Import File Format Examples

#### **Excel Format (.xlsx)**
| Date | Time | Description | Notes | Amount | Type | Account Name | Category Name | Location | Tags | Is Recurring | Recurring Pattern | Reference Number |
|------|------|-------------|-------|--------|------|--------------|---------------|----------|------|--------------|-------------------|------------------|
| 2026-02-15 | 12:30:00 | Lunch at restaurant | Business meeting | 150.50 | expense | Savings Account | Food & Dining | Bangkok | business,lunch | FALSE | | INV-001 |

#### **CSV Format (.csv)**
```csv
Date,Time,Description,Notes,Amount,Type,Account Name,Category Name,Location,Tags,Is Recurring,Recurring Pattern,Reference Number
2026-02-15,12:30:00,Lunch at restaurant,Business meeting,150.50,expense,Savings Account,Food & Dining,Bangkok,business,lunch,FALSE,,INV-001
2026-02-16,09:15:00,Gas station,Monthly fuel,500.00,expense,Credit Card,Transportation,Bangkok,transport,FALSE,,
```

#### **JSON Format (.json)**
```json
{
  "export_date": "2026-02-15T10:30:00.000Z",
  "total_transactions": 2,
  "transactions": [
    {
      "date": "2026-02-15",
      "time": "12:30:00",
      "description": "Lunch at restaurant",
      "notes": "Business meeting",
      "amount": 150.50,
      "type": "expense",
      "account_name": "Savings Account",
      "category_name": "Food & Dining",
      "location": "Bangkok",
      "tags": "business,lunch",
      "is_recurring": false,
      "recurring_pattern": "",
      "reference_number": "INV-001"
    }
  ]
}
```

---

### Import Features

#### **Smart Column Mapping**
The system automatically detects various column names:
- **Date:** `date`, `Date`, `transaction_date`, `Transaction Date`
- **Description:** `description`, `Description`, `desc`
- **Amount:** `amount`, `Amount`, `transaction_amount`, `Transaction Amount`
- **Type:** `type`, `Type`, `transaction_type`, `Transaction Type`
- **Account:** `account_name`, `Account Name`, `account`
- **Category:** `category_name`, `Category Name`, `category`

#### **Auto-Creation**
- **Accounts:** Automatically creates new accounts if not found
- **Categories:** Automatically creates new categories if not found
- **Balance Updates:** Automatically updates account balances

#### **Validation**
- **Required Fields:** Date and Amount are required
- **Amount Format:** Must be a valid positive number
- **Date Format:** YYYY-MM-DD format preferred
- **Type Validation:** Must be 'income' or 'expense'

---

## Reports

### Get Transaction Summary
```http
GET /api/reports/summary?start_date=2026-02-01&end_date=2026-02-28&group_by=category
Authorization: Bearer {session_token}
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| start_date | string | - | YYYY-MM-DD format |
| end_date | string | - | YYYY-MM-DD format |
| group_by | string | category | category/account/date |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "period": {
      "start_date": "2026-02-01",
      "end_date": "2026-02-28"
    },
    "summary": {
      "total_income": 50000.00,
      "total_expense": 35000.00,
      "net_income": 15000.00,
      "transaction_count": 45
    },
    "by_category": [
      {
        "category_id": 1,
        "category_name": "Food & Dining",
        "total_amount": 5000.00,
        "transaction_count": 15,
        "percentage": 14.29
      },
      {
        "category_id": 2,
        "category_name": "Transportation",
        "total_amount": 3000.00,
        "transaction_count": 8,
        "percentage": 8.57
      }
    ]
  }
}
```

---

### Export Transactions
```http
GET /api/reports/export?format=csv&start_date=2024-01-01&end_date=2024-01-31
Authorization: Bearer {session_token}
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| format | string | csv | csv/json/xlsx |
| start_date | string | - | YYYY-MM-DD format |
| end_date | string | - | YYYY-MM-DD format |

**Response (200):**
```
Content-Type: text/csv
Content-Disposition: attachment; filename="transactions_2024-01-01_to_2024-01-31.csv"

Date,Description,Category,Account,Amount,Type,Notes
2024-01-15,Lunch at restaurant,Food & Dining,Savings Account,150.50,Expense,Business meeting
2024-01-16,Gas station,Transportation,Credit Card,500.00,Expense,Monthly fuel
```

---

## Health Check

### System Health
```http
GET /api/health
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2026-02-24T16:30:00.000Z",
    "version": "1.0.0",
    "uptime": 3600,
    "database": {
      "status": "connected",
      "response_time": 5
    },
    "memory": {
      "used": "45MB",
      "total": "512MB",
      "percentage": 8.79
    }
  }
}
```

---

## Error Handling

### Standard Error Response Format
```json
{
  "success": false,
  "message": "Error message in user's language",
  "error": "Detailed error message"
}
```

### Common HTTP Status Codes
| Status | Meaning | Description |
|--------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Validation error or invalid input |
| 401 | Unauthorized | Authentication required or failed |
| 403 | Forbidden | Permission denied |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource conflict (duplicate data) |
| 422 | Unprocessable Entity | Validation failed |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

---

## Rate Limiting

**Limits:**
- **100 requests per minute** per IP address
- **1000 requests per hour** per user

**Headers:**
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642248600
```

---

## Internationalization

### Language Support
All API responses support multiple languages based on user preference:

**English (en):**
```json
{
  "success": true,
  "message": "Account created successfully"
}
```

**Thai (th):**
```json
{
  "success": true,
  "message": "สร้างบัญชีสำเร็จ"
}
```

### Setting Language
- **Registration:** Include `language` field in request body
- **Profile Update:** Update user language preference
- **Request Headers:** `Accept-Language: th-TH,en-US;q=0.9`

---

## Postman Collection

### Environment Variables
```json
{
  "baseUrl": "http://localhost:3000/api",
  "authToken": "{{login_response.data.session_token}}"
}
```

### Sample Requests
```javascript
// Login - Save token to environment
pm.test("Save auth token", function () {
    if (pm.response.code === 200) {
        const response = pm.response.json();
        pm.environment.set("authToken", response.data.session_token);
    }
});

// Check auth token exists
pm.test("Auth token exists", function () {
    const token = pm.environment.get("authToken");
    pm.expect(token).to.not.be.undefined;
});
```

---

## SDK Examples

### JavaScript/Node.js
```javascript
const axios = require('axios');

class EdVISORYAPI {
    constructor(baseURL, authToken) {
        this.client = axios.create({
            baseURL,
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });
    }

    async getAccounts() {
        const response = await this.client.get('/api/accounts');
        return response.data;
    }

    async createTransaction(transactionData) {
        const response = await this.client.post('/api/transactions', transactionData);
        return response.data;
    }
}

// Usage
const api = new EdVISORYAPI('http://localhost:3000', 'your-token-here');
const accounts = await api.getAccounts();
```

### Python
```python
import requests

class EdVISORYAPI:
    def __init__(self, base_url, auth_token):
        self.base_url = base_url
        self.headers = {
            'Authorization': f'Bearer {auth_token}',
            'Content-Type': 'application/json'
        }
    
    def get_accounts(self):
        response = requests.get(f'{self.base_url}/api/accounts', headers=self.headers)
        return response.json()
    
    def create_transaction(self, transaction_data):
        response = requests.post(f'{self.base_url}/api/transactions', 
                               json=transaction_data, headers=self.headers)
        return response.json()

# Usage
api = EdVISORYAPI('http://localhost:3000', 'your-token-here')
accounts = api.get_accounts()
```

---

## Changelog

### Version 1.0.0 (2024-01-15)
- ✅ Initial API release
- ✅ Authentication with device tracking
- ✅ Account management
- ✅ Category management
- ✅ Transaction CRUD operations
- ✅ File upload support
- ✅ Reports and analytics
- ✅ Multi-language support (EN/TH)
- ✅ Rate limiting and security features

---

---

*Last updated: January 15, 2026*
