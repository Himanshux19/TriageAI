package com.triageai.triageaibackend.entity;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "queue_history")
public class QueueHistoryEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "clinic_id")
    private ClinicEntity clinic;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "doctor_id")
    private DoctorEntity doctor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appointment_id")
    private AppointmentEntity appointment;

    private String patientName;
    private String severityLevel;
    private double priorityScore;
    private LocalDateTime enqueuedAt;
    private LocalDateTime consultationStartTime;
    private LocalDateTime consultationEndTime;
    private String status;
    private int actualWaitMinutes;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public ClinicEntity getClinic() { return clinic; }
    public void setClinic(ClinicEntity clinic) { this.clinic = clinic; }
    public DoctorEntity getDoctor() { return doctor; }
    public void setDoctor(DoctorEntity doctor) { this.doctor = doctor; }
    public AppointmentEntity getAppointment() { return appointment; }
    public void setAppointment(AppointmentEntity appointment) { this.appointment = appointment; }
    public String getPatientName() { return patientName; }
    public void setPatientName(String patientName) { this.patientName = patientName; }
    public String getSeverityLevel() { return severityLevel; }
    public void setSeverityLevel(String severityLevel) { this.severityLevel = severityLevel; }
    public double getPriorityScore() { return priorityScore; }
    public void setPriorityScore(double priorityScore) { this.priorityScore = priorityScore; }
    public LocalDateTime getEnqueuedAt() { return enqueuedAt; }
    public void setEnqueuedAt(LocalDateTime enqueuedAt) { this.enqueuedAt = enqueuedAt; }
    public LocalDateTime getConsultationStartTime() { return consultationStartTime; }
    public void setConsultationStartTime(LocalDateTime consultationStartTime) { this.consultationStartTime = consultationStartTime; }
    public LocalDateTime getConsultationEndTime() { return consultationEndTime; }
    public void setConsultationEndTime(LocalDateTime consultationEndTime) { this.consultationEndTime = consultationEndTime; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public int getActualWaitMinutes() { return actualWaitMinutes; }
    public void setActualWaitMinutes(int actualWaitMinutes) { this.actualWaitMinutes = actualWaitMinutes; }
}
