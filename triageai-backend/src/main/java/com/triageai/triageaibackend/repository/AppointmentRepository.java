package com.triageai.triageaibackend.repository;

import com.triageai.triageaibackend.entity.AppointmentEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface AppointmentRepository extends JpaRepository<AppointmentEntity, Long> {
    Optional<AppointmentEntity> findByTokenNumber(String tokenNumber);

    List<AppointmentEntity> findByClinicClinicIdAndBookingTimeBetween(String clinicId, LocalDateTime from, LocalDateTime to);

    @Query("SELECT COUNT(a) FROM AppointmentEntity a WHERE a.clinic.clinicId = :clinicId AND a.bookingTime >= :from AND a.bookingTime <= :to")
    long countByClinicAndDate(@Param("clinicId") String clinicId, @Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("SELECT COUNT(a) FROM AppointmentEntity a WHERE a.clinic.clinicId = :clinicId AND a.status = :status AND a.bookingTime >= :from")
    long countByClinicAndStatus(@Param("clinicId") String clinicId, @Param("status") String status, @Param("from") LocalDateTime from);

    @Query("SELECT COUNT(a) FROM AppointmentEntity a WHERE a.clinic.clinicId = :clinicId AND a.severityLevel = :level AND a.bookingTime >= :from")
    long countByClinicAndSeverity(@Param("clinicId") String clinicId, @Param("level") String level, @Param("from") LocalDateTime from);

    @Query("SELECT AVG(a.riskScore) FROM AppointmentEntity a WHERE a.clinic.clinicId = :clinicId AND a.bookingTime >= :from")
    Double avgRiskScore(@Param("clinicId") String clinicId, @Param("from") LocalDateTime from);

    List<AppointmentEntity> findByClinicClinicIdOrderByBookingTimeDesc(String clinicId);
    List<AppointmentEntity> findByDoctorDoctorIdOrderByBookingTimeDesc(String doctorId);
}
