package com.triageai.triageaibackend.repository;

import com.triageai.triageaibackend.entity.ClinicEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface ClinicRepository extends JpaRepository<ClinicEntity, String> {
    Optional<ClinicEntity> findByClinicId(String clinicId);
    Optional<ClinicEntity> findByUsername(String username);
}
