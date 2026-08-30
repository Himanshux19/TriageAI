# 🏥 TriageAI

**TriageAI** is an AI-powered clinical triage and queue management platform designed to streamline patient intake, prioritise urgent cases, and improve overall patient flow.

The platform brings together **AI-assisted symptom analysis, medical coding support, appointment management, queue tracking, notifications, and clinic management tools** into a unified digital workflow for patients, doctors, and healthcare providers.

## ✨ Features

### 🤖 AI-Powered Triage
* Analyse patient symptoms using AI-assisted triage logic
* Help determine the urgency and priority of cases
* Provide structured information to support clinical workflows

### 🩺 Medical Coding Support
* Map reported symptoms and conditions to relevant **ICD-10 codes**
* Assist healthcare workflows with structured medical classification

### 📅 Appointment & Queue Management
* Book and manage patient appointments
* Track queue status in real time
* Prioritise patients based on triage outcomes
* Support efficient patient flow within clinics

### 👨‍⚕️ Doctor & Clinic Dashboards
* Dedicated workflows for doctors and clinic staff
* View patient information and queue status
* Manage appointments and patient interactions

### 🔐 Authentication & Security
* JWT-based authentication
* Spring Security integration
* Secure password handling
* Password reset functionality

### 📧 Notifications
* Email notifications through SMTP
* Password reset emails
* Appointment and workflow-related notifications

### 📱 QR-Based Clinic Access
* Generate QR codes for clinic booking
* Allow patients to quickly access clinic booking workflows

## 🏗️ Architecture

TriageAI follows a modern full-stack architecture:

```text
┌──────────────────────┐
│   React Frontend     │
│  React + Vite        │
└──────────┬───────────┘
           │ REST API
           ▼
┌──────────────────────┐
│   Spring Boot API    │
│ Security + Services  │
└───────┬───────┬──────┘
        │       │
        ▼       ▼
   ┌────────┐  ┌──────────────┐
   │ MySQL  │  │  Groq API    │
   │Database│  │ AI Services  │
   └────────┘  └──────────────┘
        │
        ▼
┌──────────────────────┐
│   SMTP Email Service │
└──────────────────────┘
```

## 🛠️ Tech Stack

### Backend

* **Java 17+**
* **Spring Boot 3.2**
* Spring Security
* Spring Data JPA
* Hibernate
* MySQL
* JWT Authentication
* REST APIs
* Maven

### Frontend

* **React 18**
* Vite
* React Router
* Axios
* CSS

### AI & External Services

* **Groq API** — AI-powered chat and transcription
* SMTP — email delivery
* QR Code generation

### Additional Capabilities

* Input validation
* Authentication and authorisation
* Appointment and queue management

## 📁 Project Structure

```text
TriageAI/
│
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
│   │   │   │
│   │   │   └── resources/
│   │   │       ├── application.properties
│   │   │       └── static/
│   │   │
│   │   └── test/
│   │
│   ├── pom.xml
│   ├── mvnw
│   └── mvnw.cmd
│
├── triageai-frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── utils/
│   │   ├── main.jsx
│   │   └── index.css
│   │
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

## ⚙️ Prerequisites

Before running TriageAI, ensure the following are installed:

* **Java 17 or later**
* **Maven** or the provided Maven Wrapper
* **Node.js 18 or later**
* **MySQL 8 or later**
* A **Groq API key**
* SMTP credentials for email delivery

## 🔐 Environment Variables

The backend uses environment variables for database, authentication, AI, and email configuration.

| Variable        | Description                            | Example                                |
| --------------- | -------------------------------------- | -------------------------------------- |
| `DB_URL`        | MySQL JDBC connection URL              | `jdbc:mysql://localhost:3306/triageai` |
| `DB_USER`       | MySQL username                         | `root`                                 |
| `DB_PASSWORD`   | MySQL password                         | `your_password`                        |
| `JWT_SECRET`    | Secret key used for JWT authentication | `a-long-random-string`                 |
| `SMTP_USER`     | SMTP username/email                    | `your@email.com`                       |
| `SMTP_PASSWORD` | SMTP password or app password          | `your_app_password`                    |
| `GROQ_API_KEY`  | Groq API key                           | `your_groq_key`                        |

> **Security:** Never commit API keys, database passwords, JWT secrets, or SMTP credentials to version control.

### PowerShell Configuration

```powershell
$env:DB_URL="jdbc:mysql://localhost:3306/triageai"
$env:DB_USER="root"
$env:DB_PASSWORD="your_password"
$env:JWT_SECRET="your_jwt_secret"
$env:SMTP_USER="your@email.com"
$env:SMTP_PASSWORD="your_app_password"
$env:GROQ_API_KEY="your_groq_key"
```

## 🗄️ Database Setup

Create the MySQL database before starting the backend:

```sql
CREATE DATABASE triageai;
```

Then configure the database connection using the environment variables described above.

## 🚀 Running the Project

### 1. Start the Backend

Navigate to the backend directory:

```powershell
cd triageai-backend
```

Run the Spring Boot application using the Maven Wrapper:

```powershell
mvnv spring-boot:run
```

The backend will be available at:

```text
http://localhost:8080
```

### 2. Start the Frontend

Open another terminal and navigate to the frontend:

```powershell
cd triageai-frontend
```

Install dependencies:

```powershell
npm install
```

Start the Vite development server:

```powershell
npm run dev
```

The frontend will be available at:

```text
http://localhost:5173
```

## 🔄 Application Flow

A typical patient workflow looks like:

```text
Patient
   │
   ▼
Clinic Booking / QR Access
   │
   ▼
Appointment Booking
   │
   ▼
Symptom & Patient Information
   │
   ▼
AI-Assisted Triage
   │
   ├── Urgency Assessment
   │
   └── ICD-10 Coding Support
   │
   ▼
Queue Prioritisation
   │
   ▼
Doctor / Clinic Dashboard
   │
   ▼
Patient Consultation
```

This workflow is designed to reduce manual coordination and provide clinics with a structured view of patient urgency and queue status.

## 🔒 Security Considerations

TriageAI uses several mechanisms to protect application data and access:

* JWT-based authentication
* Spring Security
* Environment-based secret management
* Protected API endpoints
* Database-backed authentication
* SMTP credentials stored outside source code

For production deployments, use strong secrets and avoid exposing sensitive credentials through source control or client-side code.

## 👨‍💻 Development

Contributions, improvements, and suggestions are welcome.

When contributing:

1. Create a feature branch.
2. Implement and test your changes.
3. Keep credentials and secrets out of the repository.
4. Submit a pull request with a clear description of the changes.

## 📄 License

This project is licensed under the [MIT LICENSE](LICENSE).
