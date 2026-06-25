package com.triageai.triageaibackend.controller;

import com.triageai.triageaibackend.dto.*;
import com.triageai.triageaibackend.entity.DoctorEntity;
import com.triageai.triageaibackend.service.DoctorService;
import com.triageai.triageaibackend.service.QueueService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/doctor")
public class DoctorController {

    @Autowired private DoctorService doctorService;
    @Autowired private QueueService queueService;

    @PostMapping("/register")
    public ResponseEntity<DoctorResponse> register(@RequestBody DoctorRegisterRequest req) {
        DoctorEntity d = doctorService.registerDoctor(req);
        return ResponseEntity.ok(toResponse(d));
    }

    @GetMapping("/profile")
    public ResponseEntity<DoctorResponse> profile(Authentication auth) {
        DoctorEntity d = doctorService.getProfile(auth.getName());
        return ResponseEntity.ok(toResponse(d));
    }

    @PutMapping("/profile")
    public ResponseEntity<DoctorResponse> updateProfile(Authentication auth, @RequestBody DoctorProfileUpdateRequest req) {
        DoctorEntity d = doctorService.updateProfile(auth.getName(), req);
        return ResponseEntity.ok(toResponse(d));
    }

    @GetMapping("/doctors")
    public ResponseEntity<List<DoctorResponse>> getDoctors(Authentication auth) {
        List<DoctorEntity> docs = doctorService.getDoctorsForClinicByDoctorId(auth.getName());
        return ResponseEntity.ok(docs.stream().map(this::toResponse).collect(Collectors.toList()));
    }

    @GetMapping("/queue")
    public ResponseEntity<List<QueueEntryResponse>> getQueue(Authentication auth) {
        return ResponseEntity.ok(queueService.getDoctorQueue(auth.getName()));
    }

    @PostMapping("/call-next")
    public ResponseEntity<QueueEntryResponse> callNext(Authentication auth) {
        return ResponseEntity.ok(queueService.callNext(auth.getName()));
    }

    @PutMapping("/complete/{appointmentId}")
    public ResponseEntity<Void> complete(@PathVariable Long appointmentId) {
        queueService.completeConsultation(appointmentId);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/mark-absent/{appointmentId}")
    public ResponseEntity<Void> markAbsent(@PathVariable Long appointmentId) {
        queueService.markAbsent(appointmentId);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/availability")
    public ResponseEntity<Void> updateAvailability(Authentication auth, @RequestParam String status) {
        doctorService.updateAvailability(auth.getName(), status);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{doctorId}/active")
    public ResponseEntity<Void> setActive(@PathVariable String doctorId, @RequestParam boolean active) {
        doctorService.setActive(doctorId, active);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{doctorId}/edit")
    public ResponseEntity<DoctorResponse> editDoctor(@PathVariable String doctorId, @RequestBody DoctorRegisterRequest req) {
        DoctorEntity d = doctorService.editDoctor(doctorId, req);
        return ResponseEntity.ok(toResponse(d));
    }

    @DeleteMapping("/{doctorId}")
    public ResponseEntity<Void> deleteDoctor(@PathVariable String doctorId) {
        doctorService.deleteDoctor(doctorId);
        return ResponseEntity.ok().build();
    }

    private DoctorResponse toResponse(DoctorEntity d) {
        DoctorResponse r = new DoctorResponse();
        r.setDoctorId(d.getDoctorId());
        r.setName(d.getName());
        r.setSpecialization(d.getSpecialization());
        r.setExperienceYears(d.getExperienceYears());
        r.setEmail(d.getEmail());
        r.setActive(d.isActive());
        r.setAvailabilityStatus(d.getAvailabilityStatus());
        r.setProfilePhoto(d.getProfilePhoto());
        return r;
    }

    @Autowired private com.triageai.triageaibackend.service.AppointmentService appointmentService;

    @GetMapping("/history")
    public ResponseEntity<List<AppointmentResponse>> getHistory(Authentication auth) {
        return ResponseEntity.ok(appointmentService.getDoctorHistory(auth.getName()));
    }
}
