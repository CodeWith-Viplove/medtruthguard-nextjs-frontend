# MedTruth Guard: API Documentation

Welcome to the API Documentation for **MedTruth Guard**. This README comprehensively outlines all required backend API endpoints that power the application's core functionality.

## Project Flow Overview
The architecture is structured around a streamlined, secure medical pipeline:
**Citizen → Context → Query → AI Response → Doctor Flow → Dashboard**

## Quick Stats
- **Total APIs Required:** 9 Core Endpoints
- **Content Type:** `application/json`
- **Base Routing:** Custom routing via `/api/` (Next.js server-side functions / API gateway)

---

## 1. Authentication Endpoints

These endpoints onboard citizens and medical professionals into the ecosystem.

### 1.1 Citizen Registration
- **Endpoint:** `POST /api/register/citizen`
- **Role in Flow:** Step 1 (Citizen entry point)
- **Request Payload Structure:**
```json
{
  "fullName": "Jane Doe",
  "email": "jane@example.com",
  "password": "securepassword123",
  "contactNumber": "+1234567890"
}
```
- **Response Format (201 Created):**
```json
{
  "success": true,
  "citizenId": "cit_987654",
  "token": "eyJhbG...",
  "message": "Citizen registered successfully."
}
```

### 1.2 Doctor Registration
- **Endpoint:** `POST /api/register/doctor`
- **Role in Flow:** Step 5 Setup (Doctor registration/entry point)
- **Request Payload Structure:**
```json
{
  "fullName": "Dr. Sarah Smith",
  "email": "dr.smith@example.com",
  "password": "securepassword123",
  "licenseNumber": "MHMC/2018/123456",
  "specialization": "Cardiology"
}
```
- **Response Format (201 Created):**
```json
{
  "success": true,
  "doctorId": "doc_123456",
  "token": "eyJhbG...",
  "message": "Doctor registered successfully. Pending credential verification."
}
```

---

## 2. Context & Query Endpoints (Citizen Flow)

The citizen provides essential medical background to establish context, then submits their real-time query.

### 2.1 Submit Patient Context
- **Endpoint:** `POST /api/citizen/context`
- **Role in Flow:** Context Building (Step 2)
- **Request Payload Structure:**
```json
{
  "citizenId": "cit_987654",
  "age": 34,
  "gender": "Female",
  "preExistingConditions": ["Asthma", "Hypertension"],
  "currentMedications": ["Albuterol"]
}
```
- **Response Format (200 OK):**
```json
{
  "success": true,
  "contextId": "ctx_001",
  "message": "Context saved successfully."
}
```

### 2.2 Submit Medical Query
- **Endpoint:** `POST /api/citizen/query`
- **Role in Flow:** Query Trigger (Step 3)
- **Request Payload Structure:**
```json
{
  "citizenId": "cit_987654",
  "contextId": "ctx_001",
  "symptoms": ["Shortness of breath", "Mild chest pain"],
  "queryText": "Is it safe to take ibuprofen with my current symptoms and medications?"
}
```
- **Response Format (202 Accepted):**
```json
{
  "success": true,
  "queryId": "qry_555",
  "status": "PROCESSING_AI_RESPONSE",
  "message": "Query submitted securely to the AI engine."
}
```

---

## 3. AI Processing & Execution Endpoints

The core truth-guarding AI interaction, fetching responses protected with medical guardrails.

### 3.1 Fetch AI Response
- **Endpoint:** `GET /api/query/{queryId}/ai-response`
- **Role in Flow:** AI Response Delivery (Step 4)
- **Request Payload:** None (Requires Authorization Header & Path Parameter)
- **Response Format (200 OK):**
```json
{
  "success": true,
  "queryId": "qry_555",
  "status": "COMPLETED",
  "aiResponse": {
    "summary": "It is generally not recommended to take ibuprofen if you have asthma...",
    "confidenceScore": 92.5,
    "requiresDoctorReview": true
  },
  "sources": [
    {
      "name": "WHO Asthma Guidelines 2023",
      "url": "https://www.who.int"
    },
    {
      "name": "CDC Treatment Protocol",
      "url": "https://www.cdc.gov"
    }
  ]
}
```

---

## 4. Doctor Verification & Flow Endpoints

These endpoints power the Doctor interface, enabling medical professionals to vet the AI's response prior to final delivery.

### 4.1 Fetch Doctor Queue
- **Endpoint:** `GET /api/doctor/queue`
- **Role in Flow:** Doctor Flow Initialization (Step 5)
- **Request Payload:** None (Requires Authorization Header)
- **Response Format (200 OK):**
```json
{
  "success": true,
  "pendingQueries": [
    {
      "queryId": "qry_555",
      "citizenAge": 34,
      "symptoms": ["Shortness of breath", "Mild chest pain"],
      "createdAt": "2026-02-26T10:30:00Z",
      "priority": "HIGH"
    }
  ]
}
```

### 4.2 Fetch Query Details for Verification
- **Endpoint:** `GET /api/doctor/query/{queryId}`
- **Role in Flow:** Doctor Verification Review (Step 5)
- **Request Payload:** None (Path parameter)
- **Response Format (200 OK):**
```json
{
  "success": true,
  "queryId": "qry_555",
  "citizenContext": { "age": 34, "preExistingConditions": ["Asthma"] },
  "patientQuery": "Is it safe to take ibuprofen with my current symptoms?",
  "aiDraftResponse": "It is generally not recommended to take ibuprofen..."
}
```

### 4.3 Submit Doctor Action (Approve/Reject/Edit)
- **Endpoint:** `POST /api/doctor/query/{queryId}/action`
- **Role in Flow:** Doctor Verification Completion (Step 5)
- **Request Payload Structure:**
```json
{
  "doctorId": "doc_123456",
  "action": "APPROVED_WITH_NOTES",
  "doctorNotes": "Ibuprofen can trigger bronchospasm in asthmatics. Alternate with acetaminophen instead.",
  "finalResponse": "Modified AI response incorporating doctor's safety notes."
}
```
- **Response Format (200 OK):**
```json
{
  "success": true,
  "status": "VERIFIED_AND_SENT_TO_PATIENT",
  "message": "Action recorded. Information securely routed to the Citizen."
}
```

---

## 5. Dashboard Endpoints

High-level metrics powering analytic or administrative display logic.

### 5.1 Fetch Platform Statistics
- **Endpoint:** `GET /api/dashboard/stats`
- **Role in Flow:** System Overview / Dashboard Data (Step 6)
- **Request Payload:** None (Requires Authorization Header)
- **Response Format (200 OK):**
```json
{
  "success": true,
  "data": {
    "totalQueriesProcessed": 14205,
    "doctorsActive": 45,
    "aiAccuracyRate": "98.2%",
    "avgResponseTimeSecs": 4.5,
    "pendingVerifications": 12
  }
}
```

---
**MedTruth Guard** · *Synthesizing AI speed with Medical Expertise.*
