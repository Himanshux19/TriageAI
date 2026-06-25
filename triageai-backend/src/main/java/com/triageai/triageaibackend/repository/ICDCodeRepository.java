package com.triageai.triageaibackend.repository;

import com.triageai.triageaibackend.entity.ICDCodeEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ICDCodeRepository extends JpaRepository<ICDCodeEntity, Long> {
    List<ICDCodeEntity> findByAppointmentId(Long appointmentId);
}
