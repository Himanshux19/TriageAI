package com.triageai.triageaibackend.controller;

import com.triageai.triageaibackend.dto.AuthResponse;
import com.triageai.triageaibackend.dto.ClinicLoginRequest;
import com.triageai.triageaibackend.dto.DoctorLoginRequest;
import com.triageai.triageaibackend.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired private AuthService authService;

    @PostMapping("/clinic/login")
    public ResponseEntity<AuthResponse> clinicLogin(@RequestBody ClinicLoginRequest req) {
        return ResponseEntity.ok(authService.loginClinic(req.getUsername(), req.getPassword()));
    }

    @PostMapping("/doctor/login")
    public ResponseEntity<AuthResponse> doctorLogin(@RequestBody DoctorLoginRequest req) {
        return ResponseEntity.ok(authService.loginDoctor(req.getDoctorId(), req.getPassword()));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<String> forgotPassword(@RequestParam String email, @RequestParam String role) {
        authService.forgotPassword(email, role);
        return ResponseEntity.ok("Reset link sent to " + email);
    }

    @PostMapping("/reset-password")
    public ResponseEntity<String> resetPassword(
            @RequestParam String token,
            @RequestParam String role,
            @RequestParam String newPassword) {
        authService.resetPassword(token, role, newPassword);
        return ResponseEntity.ok("Password reset successfully");
    }
}
