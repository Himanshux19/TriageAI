package com.triageai.triageaibackend.service;

import com.triageai.triageaibackend.dto.*;
import com.triageai.triageaibackend.entity.ClinicEntity;
import com.triageai.triageaibackend.repository.ClinicRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ClinicService {

    @Autowired
    private ClinicRepository clinicRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private QRService qrService;
    @Autowired
    private NotificationService notificationService;

    public String register(ClinicRegisterRequest req) {
        if (req.getPassword() == null || !req.getPassword().equals(req.getConfirmPassword()))
            throw new RuntimeException("Passwords do not match");
        if (clinicRepository.findByUsername(req.getUsername()).isPresent())
            throw new RuntimeException("Username already taken");

        long count = clinicRepository.count();
        String clinicId = String.format("CLN%04d", 1001 + count);

        ClinicEntity clinic = new ClinicEntity();
        clinic.setClinicId(clinicId);
        clinic.setClinicName(req.getClinicName());
        clinic.setUsername(req.getUsername());
        clinic.setEmail(req.getEmail());
        clinic.setPassword(passwordEncoder.encode(req.getPassword()));
        clinic.setAddress(req.getAddress());
        clinic.setActive(true);
        clinic.setThresholdDistance(500);
        clinic = clinicRepository.save(clinic);

        try {
            String qrUrl = qrService.generateQRCode(clinicId);
            clinic.setQrCodeUrl(qrUrl);
            clinicRepository.save(clinic);
        } catch (Exception e) {
            System.err.println("QR generation failed: " + e.getMessage());
        }

        notificationService.sendClinicRegistration(req.getEmail(), clinicId, req.getUsername(),
                "http://localhost:8080/patient/book/" + clinicId);
        return clinicId;
    }

    public ClinicEntity getClinicEntityByUsername(String username) {
        return clinicRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Clinic not found: " + username));
    }

    // Used by controller — auth.getName() returns username
    public ClinicProfileResponse getProfile(String username) {
        ClinicEntity c = getClinicEntityByUsername(username);
        return toProfileResponse(c);
    }

    public ClinicProfileResponse updateProfile(String username, UpdateClinicRequest req) {
        ClinicEntity c = getClinicEntityByUsername(username);
        if (req.getClinicName() != null)
            c.setClinicName(req.getClinicName());
        if (req.getEmail() != null)
            c.setEmail(req.getEmail());
        if (req.getAddress() != null)
            c.setAddress(req.getAddress());
        if (req.getPhone() != null)
            c.setPhone(req.getPhone());
        if (req.getLatitude() != null)
            c.setLatitude(req.getLatitude());
        if (req.getLongitude() != null)
            c.setLongitude(req.getLongitude());
        if (req.getThresholdDistance() != null)
            c.setThresholdDistance(req.getThresholdDistance());
        if (req.getPassword() != null && !req.getPassword().isBlank())
            c.setPassword(passwordEncoder.encode(req.getPassword()));
        clinicRepository.save(c);
        return toProfileResponse(c);
    }

    @Transactional
    public String generateQr(String username) {
        ClinicEntity c = getClinicEntityByUsername(username);
        try {
            String url = qrService.generateQRCode(c.getClinicId());
            c.setQrCodeUrl(url);
            clinicRepository.save(c);
            return url;
        } catch (Exception e) {
            throw new RuntimeException("QR generation failed: " + e.getMessage());
        }
    }

    // Used by ClinicController for statistics / queue
    public ClinicEntity getClinicEntity(String username) {
        return getClinicEntityByUsername(username);
    }

    private ClinicProfileResponse toProfileResponse(ClinicEntity c) {
        ClinicProfileResponse r = new ClinicProfileResponse();
        r.setClinicId(c.getClinicId());
        r.setClinicName(c.getClinicName());
        r.setUsername(c.getUsername());
        r.setEmail(c.getEmail());
        r.setPhone(c.getPhone());
        r.setAddress(c.getAddress());
        r.setLatitude(c.getLatitude());
        r.setLongitude(c.getLongitude());
        r.setQrCodeUrl(c.getQrCodeUrl());
        r.setThresholdDistance(c.getThresholdDistance() != null ? c.getThresholdDistance() : 500);
        return r;
    }
}
