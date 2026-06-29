package com.triageai.triageaibackend.repository;

import com.triageai.triageaibackend.entity.DoctorEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface DoctorRepository extends JpaRepository<DoctorEntity, String> {
    List<DoctorEntity> findByClinicClinicIdAndActiveTrue(String clinicId);

    List<DoctorEntity> findByClinicClinicId(String clinicId);

    Optional<DoctorEntity> findByEmail(String email);

    @Query("SELECT COUNT(d) FROM DoctorEntity d WHERE d.clinic.clinicId = :clinicId AND d.active = true")
    long countByClinicClinicIdAndActiveTrue(@Param("clinicId") String clinicId);
}
