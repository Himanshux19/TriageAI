# TriageAI — AI-Powered Clinical Triage & Queue Management System

TriageAI is a state-of-the-art clinical triage and queue management platform designed to optimize patient flows in clinics and hospitals. By leveraging advanced artificial intelligence (LLaMA 3.3 70B via Groq API) and real-time geofencing, TriageAI prioritizes patients based on clinical severity rather than simple arrival time, ensuring critical cases are attended to immediately.

## Key Features

- **AI-Powered Triage**: Automatically evaluates symptoms, classifies clinical urgency (Critical, High, Medium, Low), generates preliminary AI diagnoses, and suggests clinical actions.
- **ICD-10-CM Mapping**: Automatically maps patient symptoms to relevant ICD-10 medical codes using a rich pre-mapped database with intelligent LLM fallback.
- **Voice-to-Text Input**: Enables patients to dictate their symptoms using Whisper v3 voice transcription.
- **Geofencing & Tracker**: Automatically tracks patient locations. If a patient leaves the geofenced clinic radius for more than 30 minutes, they are automatically marked absent.
- **Dynamic Load Balancing**: Ensures that if a doctor goes offline or becomes unavailable, waiting patients are dynamically redistributed to other available doctors in the clinic.
- **Clinic QR Booking**: Generates unique QR codes for clinics so patients can book appointments simply by scanning the code.
- **Email Notifications**: Automatically emails temporary credentials to registered doctors, booking confirmations with live queue positions to patients, and password reset links.
- **Theme Support**: Premium light and dark mode design system.
- **Patient History**: High-fidelity logs for clinics and doctors to review overall history of patients attended.

## Tech Stack

- **Backend**: Spring Boot 3.2, Spring Security, JPA/Hibernate, MySQL 8, JWT, ZXing QR Code
- **Frontend**: React 18, Vite 6, Tailwind CSS v4, Lucide Icons
- **AI Engine**: Groq API (LLaMA 3.3 70B + Whisper v3)

## Setup & Installation

### 1. Database Setup

Ensure you have MySQL running, and create a database named `triageai`:

```sql
CREATE DATABASE triageai;
```

### 2. Environment Variables (.env)

Create a `.env` file in `triageai-backend/src/main/resources/.env` containing your local settings:

```env
DB_URL=jdbc:mysql://localhost:3306/triageai
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
JWT_SECRET=your_jwt_secret_key_at_least_32_characters
SMTP_USER=your_smtp_email
SMTP_PASSWORD=your_smtp_app_password
GROQ_API_KEY=your_groq_api_key
```

### 3. Running the Backend

From the `triageai-backend` directory, start the Spring Boot app:

```bash
./mvnw.cmd spring-boot:run
```

The server will run on `http://localhost:8080`.

### 4. Running the Frontend

From the `triageai-frontend` directory:

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.
