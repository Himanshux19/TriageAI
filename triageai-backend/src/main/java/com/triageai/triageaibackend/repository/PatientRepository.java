package com.triageai.triageaibackend.repository;
import com.triageai.triageaibackend.entity.PatientEntity;
import org.springframework.data.jpa.repository.JpaRepository;
public interface PatientRepository extends JpaRepository<PatientEntity, Long> {}
