package com.triageai.triageaibackend.service;

import com.triageai.triageaibackend.dto.DoctorProfileUpdateRequest;
import com.triageai.triageaibackend.dto.DoctorRegisterRequest;
import com.triageai.triageaibackend.entity.ClinicEntity;
import com.triageai.triageaibackend.entity.DoctorEntity;
import com.triageai.triageaibackend.repository.ClinicRepository;
import com.triageai.triageaibackend.repository.DoctorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import org.springframework.transaction.annotation.Transactional;
import com.triageai.triageaibackend.entity.AppointmentEntity;
import com.triageai.triageaibackend.entity.QueueEntryEntity;
import com.triageai.triageaibackend.repository.AppointmentRepository;
import com.triageai.triageaibackend.repository.QueueEntryRepository;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class DoctorService {

    @Autowired private DoctorRepository doctorRepo;
    @Autowired private ClinicRepository clinicRepo;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private NotificationService notificationService;
    @Autowired private QueueEntryRepository queueRepo;
    @Autowired private AppointmentRepository appointmentRepo;
    @Autowired private QueueService queueService;

    @Transactional
    public DoctorEntity registerDoctor(DoctorRegisterRequest req) {
        ClinicEntity clinic = clinicRepo.findByClinicId(req.getClinicId())
                .orElseThrow(() -> new RuntimeException("Clinic not found: " + req.getClinicId()));

        long count = doctorRepo.count();
        String doctorId;
        do {
            doctorId = "DOC" + String.format("%04d", 1001 + count);
            count++;
        } while (doctorRepo.existsById(doctorId));

        String tempPassword = "Doc@" + doctorId;

        DoctorEntity doc = new DoctorEntity();
        doc.setDoctorId(doctorId);
        doc.setName(req.getName());
        doc.setSpecialization(req.getSpecialization());
        doc.setExperienceYears(req.getExperienceYears());
        doc.setEmail(req.getEmail());
        doc.setPassword(passwordEncoder.encode(tempPassword));
        doc.setClinic(clinic);
        doc.setActive(true);
        doc.setAvailabilityStatus("AVAILABLE");
        doctorRepo.save(doc);

        notificationService.sendDoctorRegistration(req.getEmail(), doctorId, tempPassword, clinic.getClinicName());
        return doc;
    }

    public DoctorEntity getProfile(String doctorId) {
        return doctorRepo.findById(doctorId)
                .orElseThrow(() -> new RuntimeException("Doctor not found: " + doctorId));
    }

    @Transactional
    public DoctorEntity updateProfile(String doctorId, DoctorProfileUpdateRequest req) {
        DoctorEntity doc = getProfile(doctorId);
        if (req.getName() != null) doc.setName(req.getName());
        if (req.getSpecialization() != null) doc.setSpecialization(req.getSpecialization());
        if (req.getExperienceYears() != null) doc.setExperienceYears(req.getExperienceYears());
        if (req.getProfilePhoto() != null) doc.setProfilePhoto(req.getProfilePhoto());
        if (req.getPassword() != null && !req.getPassword().isBlank())
            doc.setPassword(passwordEncoder.encode(req.getPassword()));
        return doctorRepo.save(doc);
    }

    @Transactional
    public void updateAvailability(String doctorId, String status) {
        DoctorEntity doc = getProfile(doctorId);
        doc.setAvailabilityStatus(status);
        doctorRepo.save(doc);
        if ("UNAVAILABLE".equals(status)) {
            redistributeQueue(doc);
        }
    }

    @Transactional
    public void setActive(String doctorId, boolean active) {
        DoctorEntity doc = getProfile(doctorId);
        doc.setActive(active);
        if (!active) {
            doc.setAvailabilityStatus("UNAVAILABLE");
        }
        doctorRepo.save(doc);
        if (!active) {
            redistributeQueue(doc);
        }
    }

    @Transactional
    public DoctorEntity editDoctor(String doctorId, DoctorRegisterRequest req) {
        DoctorEntity doc = getProfile(doctorId);
        if (req.getName() != null) doc.setName(req.getName());
        if (req.getSpecialization() != null) doc.setSpecialization(req.getSpecialization());
        if (req.getExperienceYears() > 0) doc.setExperienceYears(req.getExperienceYears());
        if (req.getEmail() != null) doc.setEmail(req.getEmail());
        return doctorRepo.save(doc);
    }

    @Transactional
    public void deleteDoctor(String doctorId) {
        DoctorEntity doc = getProfile(doctorId);
        doc.setActive(false);
        doc.setAvailabilityStatus("UNAVAILABLE");
        doctorRepo.save(doc);
        redistributeQueue(doc);
    }

    public List<DoctorEntity> getDoctorsForClinicByDoctorId(String doctorId) {
        Optional<ClinicEntity> clinicOpt = clinicRepo.findByUsername(doctorId);
        if (clinicOpt.isPresent()) {
            return doctorRepo.findByClinicClinicId(clinicOpt.get().getClinicId());
        }
        DoctorEntity doc = getProfile(doctorId);
        return doctorRepo.findByClinicClinicId(doc.getClinic().getClinicId());
    }

    @Transactional
    public void redistributeQueue(DoctorEntity doctor) {
        List<QueueEntryEntity> entries = queueRepo.findByDoctorDoctorIdAndStatusNotIn(
                doctor.getDoctorId(), List.of("COMPLETED", "ABSENT", "CANCELLED", "IN_CONSULTATION")
        );
        if (entries.isEmpty()) return;

        List<DoctorEntity> availableDoctors = doctorRepo.findByClinicClinicIdAndActiveTrue(doctor.getClinic().getClinicId())
                .stream()
                .filter(d -> "AVAILABLE".equals(d.getAvailabilityStatus()) && !d.getDoctorId().equals(doctor.getDoctorId()))
                .collect(Collectors.toList());

        if (availableDoctors.isEmpty()) return;

        for (QueueEntryEntity qe : entries) {
            DoctorEntity bestDoc = availableDoctors.stream()
                    .min(Comparator.comparingInt(d -> queueRepo.countActiveByDoctor(d.getDoctorId())))
                    .orElse(availableDoctors.get(0));

            qe.setDoctor(bestDoc);
            queueRepo.save(qe);

            AppointmentEntity appt = qe.getAppointment();
            if (appt != null) {
                appt.setDoctor(bestDoc);
                appointmentRepo.save(appt);
            }
        }
        queueService.recomputeQueue(doctor.getClinic());
    }
}
