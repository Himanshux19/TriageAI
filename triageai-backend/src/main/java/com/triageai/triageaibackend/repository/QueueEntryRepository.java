package com.triageai.triageaibackend.repository;

import com.triageai.triageaibackend.entity.AppointmentEntity;
import com.triageai.triageaibackend.entity.QueueEntryEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface QueueEntryRepository extends JpaRepository<QueueEntryEntity, Long> {

    Optional<QueueEntryEntity> findByAppointment(AppointmentEntity appointment);

    List<QueueEntryEntity> findByClinicClinicIdAndStatusNotIn(String clinicId, List<String> statuses);

    List<QueueEntryEntity> findByDoctorDoctorIdAndStatusNotIn(String doctorId, List<String> statuses);

    @Query("SELECT MAX(q.queuePosition) FROM QueueEntryEntity q WHERE q.clinic.clinicId = :clinicId AND q.status NOT IN ('COMPLETED','ABSENT','CANCELLED')")
    Optional<Integer> findMaxPositionByClinic(@Param("clinicId") String clinicId);

    @Query("SELECT COUNT(q) FROM QueueEntryEntity q WHERE q.doctor.doctorId = :doctorId AND q.status NOT IN ('COMPLETED','ABSENT','CANCELLED')")
    int countActiveByDoctor(@Param("doctorId") String doctorId);
}
