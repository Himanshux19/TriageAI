package com.triageai.triageaibackend.repository;
import com.triageai.triageaibackend.entity.StatisticsEntity;
import org.springframework.data.jpa.repository.JpaRepository;
public interface StatisticsRepository extends JpaRepository<StatisticsEntity, Long> {}
