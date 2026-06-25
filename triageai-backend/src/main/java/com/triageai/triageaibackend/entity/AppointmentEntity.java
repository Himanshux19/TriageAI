package com.triageai.triageaibackend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "appointments")
public class AppointmentEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "clinic_id")
    private ClinicEntity clinic;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "doctor_id")
    private DoctorEntity doctor;

    private String patientName;
    private int age;
    private String gender;
    private String email;

    @Column(length = 2000)
    private String symptoms;

    @Column(length = 2000)
    private String voiceTranscript;

    @Column(length = 2000)
    private String diseaseDescription;

    @Column(length = 2000)
    private String extractedSymptoms;

    @Column(length = 1000)
    private String aiDiagnosis;

    @Column(length = 2000)
    private String clinicalNotes;

    private boolean urgencyFlag;
    private String recommendedAction;
    private double diseaseScore;
    private double riskScore;
    private double severityScore;
    private double priorityScore;
    private String severityLevel;
    private String tokenNumber;
    private String status;
    private String geofenceStatus;
    private Double latitude;
    private Double longitude;
    private LocalDateTime bookingTime;
    private LocalDateTime lastLocationUpdate;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public ClinicEntity getClinic() { return clinic; }
    public void setClinic(ClinicEntity clinic) { this.clinic = clinic; }
    public DoctorEntity getDoctor() { return doctor; }
    public void setDoctor(DoctorEntity doctor) { this.doctor = doctor; }
    public String getPatientName() { return patientName; }
    public void setPatientName(String patientName) { this.patientName = patientName; }
    public int getAge() { return age; }
    public void setAge(int age) { this.age = age; }
    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getSymptoms() { return symptoms; }
    public void setSymptoms(String symptoms) { this.symptoms = symptoms; }
    public String getVoiceTranscript() { return voiceTranscript; }
    public void setVoiceTranscript(String voiceTranscript) { this.voiceTranscript = voiceTranscript; }
    public String getDiseaseDescription() { return diseaseDescription; }
    public void setDiseaseDescription(String diseaseDescription) { this.diseaseDescription = diseaseDescription; }
    public String getExtractedSymptoms() { return extractedSymptoms; }
    public void setExtractedSymptoms(String extractedSymptoms) { this.extractedSymptoms = extractedSymptoms; }
    public String getAiDiagnosis() { return aiDiagnosis; }
    public void setAiDiagnosis(String aiDiagnosis) { this.aiDiagnosis = aiDiagnosis; }
    public String getClinicalNotes() { return clinicalNotes; }
    public void setClinicalNotes(String clinicalNotes) { this.clinicalNotes = clinicalNotes; }
    public boolean isUrgencyFlag() { return urgencyFlag; }
    public void setUrgencyFlag(boolean urgencyFlag) { this.urgencyFlag = urgencyFlag; }
    public String getRecommendedAction() { return recommendedAction; }
    public void setRecommendedAction(String recommendedAction) { this.recommendedAction = recommendedAction; }
    public double getDiseaseScore() { return diseaseScore; }
    public void setDiseaseScore(double diseaseScore) { this.diseaseScore = diseaseScore; }
    public double getRiskScore() { return riskScore; }
    public void setRiskScore(double riskScore) { this.riskScore = riskScore; }
    public double getSeverityScore() { return severityScore; }
    public void setSeverityScore(double severityScore) { this.severityScore = severityScore; }
    public double getPriorityScore() { return priorityScore; }
    public void setPriorityScore(double priorityScore) { this.priorityScore = priorityScore; }
    public String getSeverityLevel() { return severityLevel; }
    public void setSeverityLevel(String severityLevel) { this.severityLevel = severityLevel; }
    public String getTokenNumber() { return tokenNumber; }
    public void setTokenNumber(String tokenNumber) { this.tokenNumber = tokenNumber; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getGeofenceStatus() { return geofenceStatus; }
    public void setGeofenceStatus(String geofenceStatus) { this.geofenceStatus = geofenceStatus; }
    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }
    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }
    public LocalDateTime getBookingTime() { return bookingTime; }
    public void setBookingTime(LocalDateTime bookingTime) { this.bookingTime = bookingTime; }
    public LocalDateTime getLastLocationUpdate() { return lastLocationUpdate; }
    public void setLastLocationUpdate(LocalDateTime lastLocationUpdate) { this.lastLocationUpdate = lastLocationUpdate; }
}
