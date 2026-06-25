package com.triageai.triageaibackend.controller;

import com.triageai.triageaibackend.dto.*;
import com.triageai.triageaibackend.entity.ClinicEntity;
import com.triageai.triageaibackend.service.ClinicDashboardService;
import com.triageai.triageaibackend.service.ClinicService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;
import com.triageai.triageaibackend.entity.AppointmentEntity;

@RestController
@RequestMapping("/api/clinic")
public class ClinicController {

    @Autowired private ClinicService clinicService;
    @Autowired private ClinicDashboardService dashboardService;

    @PostMapping("/register")
    public ResponseEntity<String> register(@RequestBody ClinicRegisterRequest req) {
        String id = clinicService.register(req);
        return ResponseEntity.ok(id);
    }

    @GetMapping("/profile")
    public ResponseEntity<ClinicProfileResponse> profile(Authentication auth) {
        return ResponseEntity.ok(clinicService.getProfile(auth.getName()));
    }

    @PutMapping("/profile")
    public ResponseEntity<ClinicProfileResponse> updateProfile(Authentication auth, @RequestBody UpdateClinicRequest req) {
        return ResponseEntity.ok(clinicService.updateProfile(auth.getName(), req));
    }

    @GetMapping("/statistics")
    public ResponseEntity<ClinicStatsResponse> statistics(Authentication auth) {
        ClinicEntity clinic = clinicService.getClinicEntity(auth.getName());
        return ResponseEntity.ok(dashboardService.getStatistics(clinic.getClinicId()));
    }

    @GetMapping("/queue")
    public ResponseEntity<List<QueueEntryResponse>> queue(Authentication auth) {
        ClinicEntity clinic = clinicService.getClinicEntity(auth.getName());
        return ResponseEntity.ok(dashboardService.getQueue(clinic.getClinicId()));
    }

    @PostMapping("/generate-qr")
    public ResponseEntity<String> generateQr(Authentication auth) {
        return ResponseEntity.ok(clinicService.generateQr(auth.getName()));
    }

    @Autowired private com.triageai.triageaibackend.repository.AppointmentRepository appointmentRepo;

    @GetMapping("/export-patients")
    public void exportPatients(Authentication auth, jakarta.servlet.http.HttpServletResponse response) throws Exception {
        ClinicEntity clinic = clinicService.getClinicEntity(auth.getName());
        List<AppointmentEntity> appointments = appointmentRepo.findAll().stream()
                .filter(a -> a.getClinic().getClinicId().equals(clinic.getClinicId()))
                .sorted((a1, a2) -> a2.getBookingTime().compareTo(a1.getBookingTime()))
                .collect(Collectors.toList());

        response.setContentType("text/csv");
        response.setHeader("Content-Disposition", "attachment; filename=\"patients_report_" + clinic.getClinicId() + ".csv\"");

        java.io.PrintWriter writer = response.getWriter();
        writer.println("Appointment ID,Token,Patient Name,Age,Gender,Symptoms,AI Diagnosis,Severity,Risk Score,Priority Score,Status,Booking Time");

        for (AppointmentEntity a : appointments) {
            writer.printf("%d,%s,\"%s\",%d,%s,\"%s\",\"%s\",%s,%.1f,%.1f,%s,%s\n",
                    a.getId(),
                    a.getTokenNumber() != null ? a.getTokenNumber() : "",
                    a.getPatientName() != null ? a.getPatientName().replace("\"", "\"\"") : "",
                    a.getAge(),
                    a.getGender(),
                    a.getSymptoms() != null ? a.getSymptoms().replace("\"", "\"\"") : "",
                    a.getAiDiagnosis() != null ? a.getAiDiagnosis().replace("\"", "\"\"") : "",
                    a.getSeverityLevel() != null ? a.getSeverityLevel() : "",
                    a.getRiskScore(),
                    a.getPriorityScore(),
                    a.getStatus(),
                    a.getBookingTime() != null ? a.getBookingTime().toString() : ""
            );
        }
        writer.flush();
    }

    @Autowired private com.triageai.triageaibackend.service.AppointmentService appointmentService;

    @GetMapping("/history")
    public ResponseEntity<List<AppointmentResponse>> getHistory(Authentication auth) {
        ClinicEntity clinic = clinicService.getClinicEntity(auth.getName());
        return ResponseEntity.ok(appointmentService.getClinicHistory(clinic.getClinicId()));
    }

    @GetMapping("/doctor/{doctorId}/history")
    public ResponseEntity<List<AppointmentResponse>> getDoctorHistory(@PathVariable String doctorId) {
        return ResponseEntity.ok(appointmentService.getDoctorHistory(doctorId));
    }
}
