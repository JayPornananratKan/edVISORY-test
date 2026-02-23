# EdVISORY Postman Test Guide

## Setup Instructions

1. **Import Environment Variables:**
   ```
   baseUrl: http://localhost:3000/api
   sessionToken: [will be set automatically]
   accountId: [will be set automatically]
   categoryId: [will be set automatically]
   transactionId: [will be set automatically]
   ```

2. **Start Database:**
   ```bash
   docker-compose up -d 
   ```

3. **Start Backend:**
   ```bash
   npm run dev
   ```

---

## Test Flow - Copy these requests into Postman

### 1. Register User
```
POST {{baseUrl}}/auth/register
Content-Type: application/json

{
  "username": "testuser123",
  "email": "test@example.com",
  "password": "Test123@",
  "firstName": "Test",
  "lastName": "User",
  "language": "en"
}
```
**Tests:**
```javascript
pm.test("Status code is 201", function () {
    pm.response.to.have.status(201);
});

pm.test("Response has success field", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('success');
});
```

### 2. Login
```
POST {{baseUrl}}/auth/login
Content-Type: application/json

{
  "username": "testuser123",
  "password": "Test123@",
  "deviceInfo": {
    "userAgent": "Postman/1.0.0",
    "ip": "127.0.0.1",
    "deviceId": "postman-device-001"
  }
}
```
**Tests:**
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has session token", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.data).to.have.property('session_token');
    pm.collectionVariables.set('sessionToken', jsonData.data.session_token);
});
```

### 3. Get Profile
```
GET {{baseUrl}}/auth/profile
Authorization: Bearer {{sessionToken}}
```
**Tests:**
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has user data", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.data).to.have.property('username');
});
```

### 4. Create Account
```
POST {{baseUrl}}/accounts
Authorization: Bearer {{sessionToken}}
Content-Type: application/json

{
  "name": "Savings Account",
  "account_type": "bank_account",
  "bank_name": "Kasikornbank",
  "account_number": "1234567890",
  "initial_balance": 10000,
  "currency": "THB"
}
```
**Tests:**
```javascript
pm.test("Status code is 201", function () {
    pm.response.to.have.status(201);
});

pm.test("Response has account data", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.data).to.have.property('name');
    pm.collectionVariables.set('accountId', jsonData.data.id);
});
```

### 5. Get All Accounts
```
GET {{baseUrl}}/accounts?page=1&limit=10
Authorization: Bearer {{sessionToken}}
```
**Tests:**
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has accounts array", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.data).to.be.an('array');
});
```

### 6. Create Category
```
POST {{baseUrl}}/categories
Authorization: Bearer {{sessionToken}}
Content-Type: application/json

{
  "name": "Food & Dining",
  "description": "Restaurants and food expenses",
  "color": "#FF6B6B",
  "icon": "restaurant",
  "is_expense": true
}
```

**Tests:**
```javascript
pm.test("Status code is 201", function () {
    pm.response.to.have.status(201);
});

pm.test("Response has category data", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.data).to.have.property('name');
    pm.collectionVariables.set('categoryId', jsonData.data.id);
});
```

### 7. Get All Categories
```
GET {{baseUrl}}/categories?page=1&limit=10
Authorization: Bearer {{sessionToken}}
```
**Tests:**
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has categories array", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.data).to.be.an('array');
});
```

### 8. Create Transaction
```
POST {{baseUrl}}/transactions
Authorization: Bearer {{sessionToken}}
Content-Type: application/json

{
  "account_id": {{accountId}},
  "category_id": {{categoryId}},
  "amount": 150.00,
  "transaction_type": "expense",
  "description": "Starbucks Coffee",
  "notes": "Morning coffee before work",
  "transaction_date": "2026-02-15",
  "transaction_time": "08:30",
  "tags": ["food", "coffee"]
}
```
**Tests:**
```javascript
pm.test("Status code is 201", function () {
    pm.response.to.have.status(201);
});

pm.test("Response has transaction data", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.data).to.have.property('amount');
    pm.collectionVariables.set('transactionId', jsonData.data.id);
});
```

### 9. Get All Transactions
```
GET {{baseUrl}}/transactions?page=1&limit=10
Authorization: Bearer {{sessionToken}}
```
**Tests:**
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has transactions array", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.data).to.be.an('array');
});
```

### 10. Create Transaction with Attachment
```
POST {{baseUrl}}/transactions
Authorization: Bearer {{sessionToken}}
Content-Type: multipart/form-data

account_id: {{accountId}}
category_id: {{categoryId}}
amount: 320.00
transaction_type: expense
description: Lunch at Restaurant
notes: Team lunch with colleagues
transaction_date: 2026-02-16
tags: food,restaurant
receipt: [select a test image file]
```
**Tests:**
```javascript
pm.test("Status code is 201", function () {
    pm.response.to.have.status(201);
});

pm.test("Response has transaction with attachments", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.data).to.have.property('attachments');
});
```

### 11. Transaction Summary Report
```
GET {{baseUrl}}/reports/transaction-summary?start_date=2026-02-01&end_date=2026-02-28&group_by=month
Authorization: Bearer {{sessionToken}}
```
**Tests:**
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has summary data", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.data).to.have.property('summary');
});
```

### 12. Daily Spending Report
```
GET {{baseUrl}}/reports/daily-spending?start_date=2026-02-01&end_date=2026-02-28
Authorization: Bearer {{sessionToken}}
```
**Tests:**
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has daily spending data", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.data).to.be.an('array');
});
```

### 13. Export Transactions - CSV
```
GET {{baseUrl}}/data/export?format=CSV
Authorization: Bearer {{sessionToken}}
```
**Tests:**
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has file data", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.data).to.have.property('filename');
});
```

### 14. Export Transactions - Google Sheets
```
GET {{baseUrl}}/data/export?format=googlesheet
Authorization: Bearer {{sessionToken}}
```
**Tests:**
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has Google Sheets data", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.data).to.have.property('filename');
});
```

### 15. Import Transactions - CSV
```
POST {{baseUrl}}/data/import
Authorization: Bearer {{sessionToken}}
Content-Type: multipart/form-data

file: [select sample_transactions.csv]
format: csv
```
**Tests:**
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has import results", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.data).to.have.property('imported');
});
```

### 16. Logout
```
POST {{baseUrl}}/auth/logout
Authorization: Bearer {{sessionToken}}
```
**Tests:**
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Clear session token", function () {
    pm.collectionVariables.set('sessionToken', '');
});
```

---

## Test Data Files

### sample_transactions.csv
```csv
date,description,amount,type,account_name,category_name,notes,tags
2026-02-15,Starbucks Coffee,150.00,expense,Cash,Food & Beverage,Morning coffee,food,coffee
2026-02-15,7-Eleven,89.50,expense,Cash,Food & Beverage,Snacks and drinks,food,convenience
2026-02-16,BTS Skytrain,45.00,expense,Cash,Transportation,Daily commute,transport,bts
2026-02-16,Lunch at Restaurant,320.00,expense,Cash,Food & Beverage,Team lunch,food,restaurant
2026-02-17,Monthly Salary,50000.00,income,KTB Bank,Salary,February salary,income,salary
2026-02-17,Electricity Bill,850.00,expense,KTB Bank,Utilities,Monthly electricity,utilities,electricity
2026-02-18,Internet Bill,599.00,expense,KTB Bank,Utilities,Fiber internet monthly,utilities,internet
2026-02-18,Netflix Subscription,299.00,expense,Credit Card,Entertainment,Monthly subscription,entertainment,streaming
2026-02-19,Grocery Shopping,1250.00,expense,Credit Card,Food & Beverage,Weekly groceries,food,groceries
2026-02-19,Gas Station,450.00,expense,Credit Card,Transportation,Car fuel,transport,fuel
```

---

## Expected Test Results

1. **Authentication Flow**: Register → Login → Profile → Logout
2. **Account Management**: Create → List
3. **Category Management**: Create → List  
4. **Transaction Flow**: Create (with/without attachment) → List
5. **Reporting**: Summary → Daily spending
6. **Export/Import**: Export (CSV/Google Sheets) → Import (CSV)

All tests should pass with status codes 200-201 and proper response structures.
