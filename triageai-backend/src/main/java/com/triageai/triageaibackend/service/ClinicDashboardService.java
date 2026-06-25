package com.triageai.triageaibackend.service;

import com.triageai.triageaibackend.dto.ClinicStatsResponse;
import com.triageai.triageaibackend.dto.QueueEntryResponse;
import com.triageai.triageaibackend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class ClinicDashboardService {

    @Autowired private AppointmentRepository appointmentRepo;
    @Autowired private QueueEntryRepository queueRepo;
    @Autowired private DoctorRepository doctorRepo;
    @Autowired private QueueService queueService;

    public ClinicStatsResponse getStatistics(String clinicId) {
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime now = LocalDateTime.now();

        long total     = appointmentRepo.countByClinicAndDate(clinicId, startOfDay, now);
        long completed = appointmentRepo.countByClinicAndStatus(clinicId, "COMPLETED", startOfDay);
        long critical  = appointmentRepo.countByClinicAndSeverity(clinicId, "CRITICAL", startOfDay);
        long high      = appointmentRepo.countByClinicAndSeverity(clinicId, "HIGH", startOfDay);
        long medium    = appointmentRepo.countByClinicAndSeverity(clinicId, "MEDIUM", startOfDay);
        long low       = appointmentRepo.countByClinicAndSeverity(clinicId, "LOW", startOfDay);
        long active    = doctorRepo.countByClinicClinicIdAndActiveTrue(clinicId);
        long inConsult = queueRepo.findByClinicClinicIdAndStatusNotIn(clinicId, List.of("COMPLETED","ABSENT","CANCELLED"))
                                  .stream().filter(q -> "IN_CONSULTATION".equals(q.getStatus())).count();
        long waiting   = queueRepo.findByClinicClinicIdAndStatusNotIn(clinicId, List.of("COMPLETED","ABSENT","CANCELLED"))
                                  .stream().filter(q -> "WAITING".equals(q.getStatus())).count();

        Double avgRisk = appointmentRepo.avgRiskScore(clinicId, startOfDay);

        ClinicStatsResponse r = new ClinicStatsResponse();
        r.setTotalPatientsToday((int) total);
        r.setCompletedConsultations((int) completed);
        r.setCriticalCasesCount((int) critical);
        r.setHighCount((int) high);
        r.setMediumCount((int) medium);
        r.setLowCount((int) low);
        r.setActiveDoctors((int) active);
        r.setInConsultationCount((int) inConsult);
        r.setWaitingCount((int) waiting);
        r.setAverageWaitTime(8);
        r.setAverageRiskScore(avgRisk != null ? Math.round(avgRisk * 10.0) / 10.0 : 0.0);
        return r;
    }

    public List<QueueEntryResponse> getQueue(String clinicId) {
        return queueService.getClinicQueue(clinicId);
    }
}
