package com.triageai.triageaibackend.service;

import com.triageai.triageaibackend.dto.AppointmentResponse;
import com.triageai.triageaibackend.dto.BookAppointmentRequest;
import com.triageai.triageaibackend.entity.*;
import com.triageai.triageaibackend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AppointmentService {

    @Autowired
    private AppointmentRepository appointmentRepo;
    @Autowired
    private ClinicRepository clinicRepo;
    @Autowired
    private DoctorRepository doctorRepo;
    @Autowired
    private QueueEntryRepository queueRepo;
    @Autowired
    private ICDCodeRepository icdRepo;
    @Autowired
    private RiskAssessmentRepository riskRepo;
    @Autowired
    private AIService aiService;
    @Autowired
    private QueueService queueService;
    @Autowired
    private NotificationService notificationService;

    @Transactional
    public AppointmentResponse bookAppointment(BookAppointmentRequest req) {
        ClinicEntity clinic = clinicRepo.findById(req.getClinicId())
                .orElseThrow(() -> new RuntimeException("Clinic not found: " + req.getClinicId()));

        // Assign doctor
        DoctorEntity doctor = null;
        if (req.getPreferredDoctorId() != null && !req.getPreferredDoctorId().isBlank()) {
            doctor = doctorRepo.findById(req.getPreferredDoctorId())
                    .filter(d -> d.isActive() && "AVAILABLE".equals(d.getAvailabilityStatus()))
                    .orElse(null);
        }
        if (doctor == null) {
            doctor = assignBestDoctor(clinic);
        }
        if (doctor == null)
            throw new RuntimeException("No available doctors at this clinic.");

        // AI triage
        AIService.TriageResult triage = aiService.evaluateSymptoms(
                req.getSymptoms(),
                req.getVoiceTranscript(),
                req.getDiseaseDescription(),
                req.getAge() != null ? req.getAge() : 30);

        // Build appointment
        AppointmentEntity appt = new AppointmentEntity();
        appt.setClinic(clinic);
        appt.setDoctor(doctor);
        appt.setPatientName(req.getPatientName());
        appt.setAge(req.getAge() != null ? req.getAge() : 0);
        appt.setGender(req.getGender() != null ? req.getGender() : "UNSPECIFIED");
        appt.setEmail(req.getEmail());
        appt.setSymptoms(req.getSymptoms());
        appt.setVoiceTranscript(req.getVoiceTranscript());
        appt.setDiseaseDescription(req.getDiseaseDescription());
        appt.setExtractedSymptoms(String.join(", ", triage.getExtractedSymptoms()));
        appt.setAiDiagnosis(triage.getAiDiagnosis());
        appt.setClinicalNotes(triage.getClinicalNotes());
        appt.setUrgencyFlag(triage.isUrgencyFlag());
        appt.setRecommendedAction(triage.getRecommendedAction());
        appt.setDiseaseScore(triage.getDiseaseScore());
        appt.setRiskScore(triage.getRiskScore());
        appt.setSeverityScore(triage.getSeverityScore());
        appt.setSeverityLevel(triage.getSeverityLevel());
        appt.setPriorityScore(triage.getPriorityScore());
        appt.setLatitude(req.getLatitude());
        appt.setLongitude(req.getLongitude());
        appt.setGeofenceStatus(determineGeofenceStatus(req.getLatitude(), req.getLongitude(), clinic));
        appt.setBookingTime(LocalDateTime.now());
        appt.setStatus("WAITING");

        AppointmentEntity saved = appointmentRepo.save(appt);

        // ICD codes
        for (AIService.ICDMapping mapping : triage.getIcdCodes()) {
            ICDCodeEntity code = new ICDCodeEntity();
            code.setAppointment(saved);
            code.setCode(mapping.getCode());
            code.setDescription(mapping.getDescription());
            icdRepo.save(code);
        }

        // Risk assessment
        RiskAssessmentEntity risk = new RiskAssessmentEntity();
        risk.setAppointment(saved);
        risk.setDiseaseScore(triage.getDiseaseScore());
        risk.setRiskScore(triage.getRiskScore());
        risk.setSeverityScore(triage.getSeverityScore());
        risk.setPriorityScore(triage.getPriorityScore());
        risk.setSeverityLevel(triage.getSeverityLevel());
        risk.setExtractedSymptoms(String.join(", ", triage.getExtractedSymptoms()));
        risk.setAiDiagnosis(triage.getAiDiagnosis());
        risk.setClinicalNotes(triage.getClinicalNotes());
        risk.setCreatedAt(LocalDateTime.now());
        riskRepo.save(risk);

        // Queue entry
        int position = queueService.addToQueue(saved, clinic, doctor);
        String token = generateToken(saved.getId());
        saved.setTokenNumber(token);
        appointmentRepo.save(saved);

        // Update queue entry with token
        QueueEntryEntity qe = queueRepo.findByAppointment(saved).orElse(null);
        if (qe != null) {
            qe.setTokenNumber(token);
            queueRepo.save(qe);
        }

        double waitTime = queueService.estimateWaitTime(clinic, position);

        // Notify
        if (req.getEmail() != null && !req.getEmail().isBlank()) {
            notificationService.sendBookingConfirmation(saved, token, position, (int) waitTime,
                    triage.getSeverityLevel(), triage.getAiDiagnosis());
        }

        return buildResponse(saved, position, (int) waitTime, triage);
    }

    public AppointmentResponse trackAppointment(String tokenNumber) {
        AppointmentEntity appt = appointmentRepo.findByTokenNumber(tokenNumber)
                .orElseThrow(() -> new RuntimeException("Appointment not found for token: " + tokenNumber));
        QueueEntryEntity qe = queueRepo.findByAppointment(appt).orElse(null);
        int pos = qe != null ? qe.getQueuePosition() : 0;
        double wait = qe != null ? queueService.estimateWaitTime(appt.getClinic(), pos) : 0;

        AIService.TriageResult triage = buildTriageFromAppt(appt);
        return buildResponse(appt, pos, (int) wait, triage);
    }

    @Transactional
    public void updatePatientLocation(Long appointmentId, Double lat, Double lng) {
        AppointmentEntity appt = appointmentRepo.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found: " + appointmentId));
        appt.setLatitude(lat);
        appt.setLongitude(lng);
        String status = determineGeofenceStatus(lat, lng, appt.getClinic());
        appt.setGeofenceStatus(status);
        appt.setLastLocationUpdate(LocalDateTime.now());

        // Auto-absent if outside for >30 min
        if ("OUTSIDE_RADIUS".equals(status) && appt.getLastLocationUpdate() != null) {
            LocalDateTime threshold = LocalDateTime.now().minusMinutes(30);
            if (appt.getLastLocationUpdate().isBefore(threshold)) {
                appt.setStatus("ABSENT");
                QueueEntryEntity qe = queueRepo.findByAppointment(appt).orElse(null);
                if (qe != null) {
                    qe.setStatus("ABSENT");
                    queueRepo.save(qe);
                }
            }
        }
        appointmentRepo.save(appt);

        // Recompute queue
        QueueEntryEntity qe = queueRepo.findByAppointment(appt).orElse(null);
        if (qe != null) {
            qe.setGeofenceStatus(status);
            queueRepo.save(qe);
        }
        queueService.recomputeQueue(appt.getClinic());
    }

    public List<DoctorEntity> getDoctorsForClinic(String clinicId) {
        return doctorRepo.findByClinicClinicIdAndActiveTrue(clinicId);
    }

    // ── Helpers ──────────────────────────────────────────────
    private DoctorEntity assignBestDoctor(ClinicEntity clinic) {
        List<DoctorEntity> available = doctorRepo
                .findByClinicClinicIdAndActiveTrue(clinic.getClinicId())
                .stream()
                .filter(d -> "AVAILABLE".equals(d.getAvailabilityStatus()))
                .collect(Collectors.toList());
        if (available.isEmpty())
            return null;
        // Pick doctor with fewest active queue entries
        return available.stream()
                .min(Comparator.comparingInt(d -> queueRepo.countActiveByDoctor(d.getDoctorId())))
                .orElse(available.get(0));
    }

    private String determineGeofenceStatus(Double lat, Double lng, ClinicEntity clinic) {
        if (lat == null || lng == null)
            return "UNKNOWN";
        if (clinic.getLatitude() == null || clinic.getLongitude() == null)
            return "ARRIVED";
        double dist = haversine(lat, lng, clinic.getLatitude(), clinic.getLongitude());
        double threshold = clinic.getThresholdDistance() != null ? clinic.getThresholdDistance() : 500;
        return dist <= threshold ? "ARRIVED" : "OUTSIDE_RADIUS";
    }

    private double haversine(double lat1, double lng1, double lat2, double lng2) {
        final double R = 6371000;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                        * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    private String generateToken(Long id) {
        return "T" + String.format("%04d", id % 10000);
    }

    private AppointmentResponse buildResponse(AppointmentEntity appt, int pos, int wait, AIService.TriageResult t) {
        List<ICDCodeEntity> codes = icdRepo.findByAppointmentId(appt.getId());
        AppointmentResponse r = new AppointmentResponse();
        r.setId(appt.getId());
        r.setAppointmentId(appt.getId());
        r.setTokenNumber(appt.getTokenNumber());
        r.setPatientName(appt.getPatientName());
        r.setAge(appt.getAge());
        r.setGender(appt.getGender());
        r.setSymptoms(appt.getSymptoms());
        r.setExtractedSymptoms(appt.getExtractedSymptoms());
        r.setAiDiagnosis(appt.getAiDiagnosis());
        r.setClinicalNotes(appt.getClinicalNotes());
        r.setUrgencyFlag(appt.isUrgencyFlag());
        r.setRecommendedAction(appt.getRecommendedAction());
        r.setDiseaseScore(appt.getDiseaseScore());
        r.setRiskScore(appt.getRiskScore());
        r.setSeverityScore(appt.getSeverityScore());
        r.setSeverityLevel(appt.getSeverityLevel());
        r.setPriorityScore(appt.getPriorityScore());
        r.setStatus(appt.getStatus());
        r.setGeofenceStatus(appt.getGeofenceStatus());
        r.setQueuePosition(pos);
        r.setEstimatedWaitTime(wait);
        r.setDoctorName(appt.getDoctor() != null ? appt.getDoctor().getName() : null);
        r.setDoctorId(appt.getDoctor() != null ? appt.getDoctor().getDoctorId() : null);
        r.setBookingTime(
                appt.getBookingTime() != null ? appt.getBookingTime().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)
                        : null);
        r.setIcdCodes(codes.stream().map(c -> Map.of("code", c.getCode(), "description", c.getDescription()))
                .collect(Collectors.toList()));
        return r;
    }

    private AIService.TriageResult buildTriageFromAppt(AppointmentEntity a) {
        List<ICDCodeEntity> codes = icdRepo.findByAppointmentId(a.getId());
        List<AIService.ICDMapping> mappings = codes.stream()
                .map(c -> new AIService.ICDMapping(c.getCode(), c.getDescription()))
                .collect(Collectors.toList());
        List<String> syms = a.getExtractedSymptoms() != null
                ? Arrays.asList(a.getExtractedSymptoms().split(",\\s*"))
                : List.of();
        return new AIService.TriageResult(
                a.getDiseaseScore(), a.getRiskScore(), a.getSeverityScore(), a.getPriorityScore(),
                a.getSeverityLevel(), syms, mappings, a.getAiDiagnosis(),
                a.getClinicalNotes(), a.isUrgencyFlag(), a.getRecommendedAction());
    }

    public List<AppointmentResponse> getClinicHistory(String clinicId) {
        return appointmentRepo.findByClinicClinicIdOrderByBookingTimeDesc(clinicId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<AppointmentResponse> getDoctorHistory(String doctorId) {
        return appointmentRepo.findByDoctorDoctorIdOrderByBookingTimeDesc(doctorId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private AppointmentResponse mapToResponse(AppointmentEntity a) {
        List<ICDCodeEntity> codes = icdRepo.findByAppointmentId(a.getId());
        AppointmentResponse r = new AppointmentResponse();
        r.setId(a.getId());
        r.setAppointmentId(a.getId());
        r.setTokenNumber(a.getTokenNumber());
        r.setPatientName(a.getPatientName());
        r.setAge(a.getAge());
        r.setGender(a.getGender());
        r.setSymptoms(a.getSymptoms());
        r.setExtractedSymptoms(a.getExtractedSymptoms());
        r.setAiDiagnosis(a.getAiDiagnosis());
        r.setClinicalNotes(a.getClinicalNotes());
        r.setUrgencyFlag(a.isUrgencyFlag());
        r.setRecommendedAction(a.getRecommendedAction());
        r.setDiseaseScore(a.getDiseaseScore());
        r.setRiskScore(a.getRiskScore());
        r.setSeverityScore(a.getSeverityScore());
        r.setSeverityLevel(a.getSeverityLevel());
        r.setPriorityScore(a.getPriorityScore());
        r.setStatus(a.getStatus());
        r.setGeofenceStatus(a.getGeofenceStatus());
        r.setDoctorName(a.getDoctor() != null ? a.getDoctor().getName() : null);
        r.setDoctorId(a.getDoctor() != null ? a.getDoctor().getDoctorId() : null);
        r.setBookingTime(
                a.getBookingTime() != null ? a.getBookingTime().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME) : null);
        r.setIcdCodes(codes.stream().map(c -> Map.of("code", c.getCode(), "description", c.getDescription()))
                .collect(Collectors.toList()));
        return r;
    }
}
