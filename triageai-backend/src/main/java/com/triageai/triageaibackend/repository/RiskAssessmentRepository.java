package com.triageai.triageaibackend.repository;

import com.triageai.triageaibackend.entity.RiskAssessmentEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RiskAssessmentRepository extends JpaRepository<RiskAssessmentEntity, Long> {
}
