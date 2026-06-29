package com.triageai.triageaibackend.repository;

import com.triageai.triageaibackend.entity.QueueHistoryEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface QueueHistoryRepository extends JpaRepository<QueueHistoryEntity, Long> {
}
