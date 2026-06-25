package com.triageai.triageaibackend.entity;
import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "statistics")
public class StatisticsEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String clinicId;
    private LocalDate date;
    private int totalPatients;
    private int completed;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getClinicId() { return clinicId; }
    public void setClinicId(String clinicId) { this.clinicId = clinicId; }
    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }
    public int getTotalPatients() { return totalPatients; }
    public void setTotalPatients(int totalPatients) { this.totalPatients = totalPatients; }
    public int getCompleted() { return completed; }
    public void setCompleted(int completed) { this.completed = completed; }
}
