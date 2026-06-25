package com.triageai.triageaibackend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    public void sendEmail(String to, String subject, String body) {
        if (mailSender == null) {
            System.out.println("[EmailService] MAIL NOT CONFIGURED. Would send to: " + to);
            System.out.println("Subject: " + subject);
            return;
        }
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setTo(to);
            msg.setSubject(subject);
            msg.setText(body);
            msg.setFrom("noreply@triageai.com");
            mailSender.send(msg);
        } catch (Exception e) {
            System.err.println("[EmailService] Failed to send email to " + to + ": " + e.getMessage());
        }
    }

    public void sendPasswordResetEmail(String to, String resetLink, String name) {
        String subject = "TriageAI – Password Reset Request";
        String body = String.format(
            "Hello %s,\n\nA password reset was requested.\n\n" +
            "Click the link to reset: %s\n\nThis link expires in 1 hour.\n\n" +
            "If you did not request this, ignore this email.\n\nTriageAI Team", name, resetLink);
        sendEmail(to, subject, body);
    }
}
