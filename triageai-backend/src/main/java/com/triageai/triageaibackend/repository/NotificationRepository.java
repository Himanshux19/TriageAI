package com.triageai.triageaibackend.repository;

import com.triageai.triageaibackend.entity.NotificationEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationRepository extends JpaRepository<NotificationEntity, Long> {
}
