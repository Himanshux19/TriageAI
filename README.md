# TriageAI

TriageAI is an AI-powered clinical triage and queue management platform designed to improve patient flow, prioritise urgent cases, and support clinics with smart digital workflows. The system combines AI-assisted symptom analysis, medical coding support, queue tracking, and booking tools into a single experience for clinics, doctors, and patients.

## Overview

TriageAI helps healthcare providers:

- assess patient urgency using AI-driven triage logic
- map symptoms to ICD-10 related codes
- manage appointment booking and queue status
- support doctor and clinic dashboards
- send notifications and password reset emails
- generate QR-based clinic booking access

## Tech Stack

- Backend: Spring Boot 3.2, Spring Security, JPA/Hibernate, MySQL, JWT
- Frontend: React 18, Vite, React Router, Axios
- AI Services: Groq API for chat and transcription
- Other: QR generation, SMTP email delivery, validation and file upload support

## Project Structure

```text
TriageAI/
├── triageai-backend/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/
│   │   │   │   └── com/triageai/triageaibackend/
│   │   │   │       ├── controller/
│   │   │   │       ├── dto/
│   │   │   │       ├── entity/
│   │   │   │       ├── repository/
│   │   │   │       ├── security/
│   │   │   │       └── service/
│   │   │   └── resources/
│   │   │       ├── application.properties
│   │   │       └── static/
│   │   └── test/
│   ├── pom.xml
│   └── mvnw / mvnw.cmd
├── triageai-frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── utils/
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## Prerequisites

Before running the project, make sure you have:

- Java 17+
- Maven or the provided Maven wrapper
- Node.js 18+
- MySQL 8+
- A Groq API key
- SMTP credentials for email notifications

## Environment Variables

The backend reads configuration from environment variables. Set the following before starting the app:

| Variable      | Description                       | Example                              |
| ------------- | --------------------------------- | ------------------------------------ |
| DB_URL        | MySQL JDBC connection URL         | jdbc:mysql://localhost:3306/triageai |
| DB_USER       | MySQL username                    | root                                 |
| DB_PASSWORD   | MySQL password                    | your_password                        |
| JWT_SECRET    | Secret key for JWT authentication | a-long-random-string                 |
| SMTP_USER     | SMTP email username               | your@email.com                       |
| SMTP_PASSWORD | SMTP app password or password     | your_app_password                    |
| GROQ_API_KEY  | API key for Groq AI services      | your_groq_key                        |

### Example (PowerShell)

```powershell
$env:DB_URL="jdbc:mysql://localhost:3306/triageai"
$env:DB_USER="root"
$env:DB_PASSWORD="your_password"
$env:JWT_SECRET="your_jwt_secret"
$env:SMTP_USER="your@email.com"
$env:SMTP_PASSWORD="your_app_password"
$env:GROQ_API_KEY="your_groq_key"
```

## Database Setup

Create the database in MySQL:

```sql
CREATE DATABASE triageai;
```

## Running the Project

### 1. Start the Backend

From the backend folder:

```powershell
cd triageai-backend
./mvnw.cmd spring-boot:run
```

The backend will run at:

- http://localhost:8080

### 2. Start the Frontend

From the frontend folder:

```powershell
cd triageai-frontend
npm install
npm run dev
```

The frontend will run at:

- http://localhost:5173
