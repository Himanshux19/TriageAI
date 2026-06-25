package com.triageai.triageaibackend.service;

import com.triageai.triageaibackend.dto.QueueEntryResponse;
import com.triageai.triageaibackend.entity.*;
import com.triageai.triageaibackend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class QueueService {

    @Autowired private QueueEntryRepository queueRepo;
    @Autowired private AppointmentRepository appointmentRepo;
    @Autowired private QueueHistoryRepository historyRepo;
    @Autowired private ClinicRepository clinicRepo;

    private static final double AVG_CONSULTATION_MINUTES = 8.0;

    // ── Add to queue ─────────────────────────────────────────
    @Transactional
    public int addToQueue(AppointmentEntity appt, ClinicEntity clinic, DoctorEntity doctor) {
        recomputeQueue(clinic);
        int maxPos = queueRepo.findMaxPositionByClinic(clinic.getClinicId()).orElse(0);
        int newPos = maxPos + 1;

        QueueEntryEntity qe = new QueueEntryEntity();
        qe.setAppointment(appt);
        qe.setClinic(clinic);
        qe.setDoctor(doctor);
        qe.setPatientName(appt.getPatientName());
        qe.setTokenNumber(appt.getTokenNumber());
        qe.setSeverityLevel(appt.getSeverityLevel());
        qe.setPriorityScore(appt.getPriorityScore());
        qe.setQueuePosition(newPos);
        qe.setStatus("WAITING");
        qe.setGeofenceStatus(appt.getGeofenceStatus() != null ? appt.getGeofenceStatus() : "UNKNOWN");
        qe.setEnqueuedAt(LocalDateTime.now());
        queueRepo.save(qe);

        // Re-sort by priority
        recomputeQueue(clinic);
        QueueEntryEntity updated = queueRepo.findByAppointment(appt).orElse(qe);
        return updated.getQueuePosition();
    }

    // ── Full priority re-sort ─────────────────────────────────
    @Transactional
    public void recomputeQueue(ClinicEntity clinic) {
        List<QueueEntryEntity> active = queueRepo
                .findByClinicClinicIdAndStatusNotIn(clinic.getClinicId(),
                        List.of("COMPLETED", "ABSENT", "CANCELLED"))
                .stream()
                .sorted(Comparator.comparingDouble(QueueEntryEntity::getPriorityScore).reversed()
                        .thenComparing(QueueEntryEntity::getEnqueuedAt))
                .collect(Collectors.toList());

        for (int i = 0; i < active.size(); i++) {
            QueueEntryEntity qe = active.get(i);
            qe.setQueuePosition(i + 1);
            qe.setEstimatedWaitMinutes((int) Math.round((i) * AVG_CONSULTATION_MINUTES));
            queueRepo.save(qe);
        }
    }

    // ── Estimate wait time ───────────────────────────────────
    public double estimateWaitTime(ClinicEntity clinic, int position) {
        if (position <= 0) return 0;
        return Math.max(0, (position - 1)) * AVG_CONSULTATION_MINUTES;
    }

    // ── Get queue for clinic ─────────────────────────────────
    public List<QueueEntryResponse> getClinicQueue(String clinicId) {
        return queueRepo
                .findByClinicClinicIdAndStatusNotIn(clinicId, List.of("COMPLETED", "ABSENT", "CANCELLED"))
                .stream()
                .sorted(Comparator.comparingInt(QueueEntryEntity::getQueuePosition))
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // ── Get queue for doctor ─────────────────────────────────
    public List<QueueEntryResponse> getDoctorQueue(String doctorId) {
        return queueRepo
                .findByDoctorDoctorIdAndStatusNotIn(doctorId, List.of("COMPLETED", "ABSENT", "CANCELLED"))
                .stream()
                .sorted(Comparator.comparingInt(QueueEntryEntity::getQueuePosition))
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // ── Call next patient ────────────────────────────────────
    @Transactional
    public QueueEntryResponse callNext(String doctorId) {
        List<QueueEntryEntity> waiting = queueRepo
                .findByDoctorDoctorIdAndStatusNotIn(doctorId, List.of("COMPLETED", "ABSENT", "CANCELLED", "IN_CONSULTATION"))
                .stream()
                .filter(q -> !"ABSENT".equals(q.getStatus()))
                .sorted(Comparator.comparingInt(QueueEntryEntity::getQueuePosition))
                .collect(Collectors.toList());

        if (waiting.isEmpty()) throw new RuntimeException("No patients waiting.");

        QueueEntryEntity next = waiting.get(0);
        next.setStatus("IN_CONSULTATION");
        next.setConsultationStartTime(LocalDateTime.now());
        queueRepo.save(next);

        AppointmentEntity appt = next.getAppointment();
        appt.setStatus("IN_CONSULTATION");
        appointmentRepo.save(appt);

        return toResponse(next);
    }

    // ── Complete consultation ─────────────────────────────────
    @Transactional
    public void completeConsultation(Long appointmentId) {
        AppointmentEntity appt = appointmentRepo.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));
        appt.setStatus("COMPLETED");
        appointmentRepo.save(appt);

        QueueEntryEntity qe = queueRepo.findByAppointment(appt)
                .orElseThrow(() -> new RuntimeException("Queue entry not found"));
        qe.setStatus("COMPLETED");
        qe.setConsultationEndTime(LocalDateTime.now());
        queueRepo.save(qe);

        archiveToHistory(qe);
        recomputeQueue(appt.getClinic());
    }

    // ── Mark absent ──────────────────────────────────────────
    @Transactional
    public void markAbsent(Long appointmentId) {
        AppointmentEntity appt = appointmentRepo.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));
        appt.setStatus("ABSENT");
        appointmentRepo.save(appt);

        queueRepo.findByAppointment(appt).ifPresent(qe -> {
            qe.setStatus("ABSENT");
            queueRepo.save(qe);
        });

        recomputeQueue(appt.getClinic());
    }

    // ── Archive ──────────────────────────────────────────────
    private void archiveToHistory(QueueEntryEntity qe) {
        QueueHistoryEntity h = new QueueHistoryEntity();
        h.setClinic(qe.getClinic());
        h.setDoctor(qe.getDoctor());
        h.setAppointment(qe.getAppointment());
        h.setPatientName(qe.getPatientName());
        h.setSeverityLevel(qe.getSeverityLevel());
        h.setPriorityScore(qe.getPriorityScore());
        h.setEnqueuedAt(qe.getEnqueuedAt());
        h.setConsultationStartTime(qe.getConsultationStartTime());
        h.setConsultationEndTime(qe.getConsultationEndTime());
        h.setStatus(qe.getStatus());
        long waitMins = 0;
        if (qe.getEnqueuedAt() != null && qe.getConsultationStartTime() != null)
            waitMins = java.time.Duration.between(qe.getEnqueuedAt(), qe.getConsultationStartTime()).toMinutes();
        h.setActualWaitMinutes((int) waitMins);
        historyRepo.save(h);
    }

    private QueueEntryResponse toResponse(QueueEntryEntity qe) {
        QueueEntryResponse r = new QueueEntryResponse();
        AppointmentEntity appt = qe.getAppointment();
        r.setAppointmentId(appt != null ? appt.getId() : null);
        r.setTokenNumber(qe.getTokenNumber());
        r.setPatientName(qe.getPatientName());
        r.setAge(appt != null ? appt.getAge() : 0);
        r.setGender(appt != null ? appt.getGender() : "");
        r.setSymptoms(appt != null ? appt.getSymptoms() : "");
        r.setExtractedSymptoms(appt != null ? appt.getExtractedSymptoms() : "");
        r.setAiDiagnosis(appt != null ? appt.getAiDiagnosis() : "");
        r.setSeverityLevel(qe.getSeverityLevel());
        r.setPriorityScore(qe.getPriorityScore());
        r.setQueuePosition(qe.getQueuePosition());
        r.setEstimatedWaitTime(qe.getEstimatedWaitMinutes() != null ? qe.getEstimatedWaitMinutes() : 0);
        r.setStatus(qe.getStatus());
        r.setGeofenceStatus(qe.getGeofenceStatus());
        r.setDoctorName(qe.getDoctor() != null ? qe.getDoctor().getName() : "");
        r.setDoctorId(qe.getDoctor() != null ? qe.getDoctor().getDoctorId() : "");
        r.setUrgencyFlag(appt != null && appt.isUrgencyFlag());
        r.setRecommendedAction(appt != null ? appt.getRecommendedAction() : "");
        r.setRiskScore(appt != null ? appt.getRiskScore() : 0);
        r.setClinicalNotes(appt != null ? appt.getClinicalNotes() : "");
        return r;
    }
}
