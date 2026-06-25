package com.triageai.triageaibackend.service;

import com.triageai.triageaibackend.entity.AppointmentEntity;
import com.triageai.triageaibackend.entity.NotificationEntity;
import com.triageai.triageaibackend.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;

@Service
public class NotificationService {

    @Autowired private EmailService emailService;
    @Autowired private NotificationRepository notificationRepo;

    public void sendBookingConfirmation(AppointmentEntity appt, String token, int position, int waitTime, String severity, String diagnosis) {
        if (appt.getEmail() == null || appt.getEmail().isBlank()) return;
        String subject = "TriageAI – Appointment Confirmed: Token " + token;
        String body = String.format(
            "Hello %s,\n\nYour appointment has been confirmed.\n\n" +
            "Token Number: %s\nQueue Position: #%d\nEstimated Wait: %d minutes\n" +
            "Severity: %s\nPreliminary Assessment: %s\n\n" +
            "Please stay near the clinic. You can track your queue position at:\n" +
            "http://localhost:8080/patient/track/%s\n\n" +
            "TriageAI Clinical Services",
            appt.getPatientName(), token, position, waitTime, severity, diagnosis, token);
        emailService.sendEmail(appt.getEmail(), subject, body);
        logNotification(appt.getEmail(), "BOOKING_CONFIRMATION");
    }

    public void sendClinicRegistration(String email, String clinicId, String username, String qrLink) {
        String subject = "TriageAI – Clinic Registration Successful";
        String body = String.format(
            "Welcome to TriageAI!\n\nYour clinic has been registered.\n\n" +
            "Clinic ID: %s\nUsername: %s\nQR Booking Link: %s\n\n" +
            "Share the QR link with your patients to allow them to book appointments.\n\nTriageAI Team",
            clinicId, username, qrLink);
        emailService.sendEmail(email, subject, body);
    }

    public void sendDoctorRegistration(String email, String doctorId, String tempPassword, String clinicName) {
        String subject = "TriageAI – Doctor Account Created";
        String body = String.format(
            "Hello Doctor,\n\nYour account has been created at %s.\n\n" +
            "Doctor ID: %s\nTemporary Password: %s\n\n" +
            "Please log in and change your password immediately.\n\nTriageAI Team",
            clinicName, doctorId, tempPassword);
        emailService.sendEmail(email, subject, body);
    }

    private void logNotification(String email, String type) {
        try {
            NotificationEntity n = new NotificationEntity();
            n.setRecipientEmail(email);
            n.setType(type);
            n.setMessage(type + " sent to " + email);
            n.setSentAt(LocalDateTime.now());
            notificationRepo.save(n);
        } catch (Exception ignored) {}
    }
}
