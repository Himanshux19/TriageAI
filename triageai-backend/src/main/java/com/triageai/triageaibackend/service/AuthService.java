package com.triageai.triageaibackend.service;

import com.triageai.triageaibackend.dto.AuthResponse;
import com.triageai.triageaibackend.entity.ClinicEntity;
import com.triageai.triageaibackend.entity.DoctorEntity;
import com.triageai.triageaibackend.repository.ClinicRepository;
import com.triageai.triageaibackend.repository.DoctorRepository;
import com.triageai.triageaibackend.security.JwtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.UUID;

@Service
public class AuthService {

    @Autowired private ClinicRepository clinicRepo;
    @Autowired private DoctorRepository doctorRepo;
    @Autowired private JwtService jwtService;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private EmailService emailService;

    private static final Map<String, TokenInfo> resetTokens = new ConcurrentHashMap<>();

    private static class TokenInfo {
        String identifier;
        String role;
        TokenInfo(String identifier, String role) {
            this.identifier = identifier;
            this.role = role;
        }
    }

    public AuthResponse loginClinic(String username, String password) {
        ClinicEntity clinic = clinicRepo.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));
        if (!passwordEncoder.matches(password, clinic.getPassword()))
            throw new RuntimeException("Invalid credentials");
        if (!clinic.isActive())
            throw new RuntimeException("Clinic account is disabled");
        String token = jwtService.generateToken(username, "CLINIC");
        return new AuthResponse(token, clinic.getClinicId(), "CLINIC", clinic.getClinicName());
    }

    public AuthResponse loginDoctor(String doctorId, String password) {
        DoctorEntity doctor = doctorRepo.findById(doctorId)
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));
        if (!passwordEncoder.matches(password, doctor.getPassword()))
            throw new RuntimeException("Invalid credentials");
        if (!doctor.isActive())
            throw new RuntimeException("Doctor account is disabled");
        String token = jwtService.generateToken(doctorId, "DOCTOR");
        return new AuthResponse(token, doctorId, "DOCTOR", doctor.getName());
    }

    public void forgotPassword(String email, String role) {
        String resetToken = UUID.randomUUID().toString();
        String resetLink = "http://localhost:8080/reset-password?token=" + resetToken + "&role=" + role;

        if ("CLINIC".equalsIgnoreCase(role)) {
            ClinicEntity clinic = clinicRepo.findAll().stream()
                    .filter(c -> email.equalsIgnoreCase(c.getEmail()))
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("No clinic with that email"));
            resetTokens.put(resetToken, new TokenInfo(clinic.getUsername(), "CLINIC"));
            emailService.sendPasswordResetEmail(email, resetLink, clinic.getClinicName());
        } else {
            DoctorEntity doc = doctorRepo.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("No doctor with that email"));
            resetTokens.put(resetToken, new TokenInfo(doc.getDoctorId(), "DOCTOR"));
            emailService.sendPasswordResetEmail(email, resetLink, doc.getName());
        }
    }

    public void resetPassword(String token, String role, String newPassword) {
        if (token == null || token.isBlank())
            throw new RuntimeException("Invalid reset token");
        if (newPassword == null || newPassword.length() < 6)
            throw new RuntimeException("Password too short");

        TokenInfo info = resetTokens.remove(token);
        if (info == null || !info.role.equalsIgnoreCase(role)) {
            throw new RuntimeException("Invalid or expired reset token");
        }

        if ("CLINIC".equalsIgnoreCase(role)) {
            ClinicEntity clinic = clinicRepo.findByUsername(info.identifier)
                    .orElseThrow(() -> new RuntimeException("Clinic not found"));
            clinic.setPassword(passwordEncoder.encode(newPassword));
            clinicRepo.save(clinic);
        } else {
            DoctorEntity doc = doctorRepo.findById(info.identifier)
                    .orElseThrow(() -> new RuntimeException("Doctor not found"));
            doc.setPassword(passwordEncoder.encode(newPassword));
            doctorRepo.save(doc);
        }
    }
}
