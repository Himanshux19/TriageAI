package com.triageai.triageaibackend.controller;

import com.triageai.triageaibackend.dto.AppointmentResponse;
import com.triageai.triageaibackend.dto.BookAppointmentRequest;
import com.triageai.triageaibackend.dto.DoctorResponse;
import com.triageai.triageaibackend.entity.DoctorEntity;
import com.triageai.triageaibackend.service.AIService;
import com.triageai.triageaibackend.service.AppointmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/appointment")
public class AppointmentController {

    @Autowired
    private AppointmentService appointmentService;
    @Autowired
    private AIService aiService;

    @PostMapping("/book")
    public ResponseEntity<AppointmentResponse> book(@RequestBody BookAppointmentRequest req) {
        return ResponseEntity.ok(appointmentService.bookAppointment(req));
    }

    @GetMapping("/track/{tokenNumber}")
    public ResponseEntity<AppointmentResponse> track(@PathVariable String tokenNumber) {
        return ResponseEntity.ok(appointmentService.trackAppointment(tokenNumber));
    }

    @PostMapping("/location/{appointmentId}")
    public ResponseEntity<Void> updateLocation(
            @PathVariable Long appointmentId,
            @RequestParam Double lat,
            @RequestParam Double lng) {
        appointmentService.updatePatientLocation(appointmentId, lat, lng);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/doctors/{clinicId}")
    public ResponseEntity<List<DoctorResponse>> getDoctors(@PathVariable String clinicId) {
        List<DoctorEntity> docs = appointmentService.getDoctorsForClinic(clinicId);
        List<DoctorResponse> response = docs.stream().map(d -> {
            DoctorResponse r = new DoctorResponse();
            r.setDoctorId(d.getDoctorId());
            r.setName(d.getName());
            r.setSpecialization(d.getSpecialization());
            r.setExperienceYears(d.getExperienceYears());
            r.setActive(d.isActive());
            r.setAvailabilityStatus(d.getAvailabilityStatus());
            return r;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/transcribe")
    public ResponseEntity<String> transcribe(@RequestBody Map<String, String> payload) {
        String audioBase64 = payload.get("audio");
        String mimeType = payload.getOrDefault("mimeType", "audio/webm");
        if (audioBase64 == null || audioBase64.isBlank())
            return ResponseEntity.badRequest().body("No audio data provided.");
        try {
            byte[] audioBytes = Base64.getDecoder().decode(audioBase64);
            String ext = mimeType.contains("ogg") ? "audio.ogg"
                    : mimeType.contains("wav") ? "audio.wav"
                            : mimeType.contains("mp4") ? "audio.mp4"
                                    : "audio.webm";
            String transcript = aiService.transcribeVoice(audioBytes, ext);
            return ResponseEntity.ok(transcript);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Transcription failed: " + e.getMessage());
        }
    }
}
