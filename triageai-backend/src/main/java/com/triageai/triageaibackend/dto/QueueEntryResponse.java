package com.triageai.triageaibackend.dto;

public class QueueEntryResponse {
    private Long appointmentId;
    private String tokenNumber;
    private String patientName;
    private int age;
    private String gender;
    private String symptoms;
    private String extractedSymptoms;
    private String aiDiagnosis;
    private String clinicalNotes;
    private String severityLevel;
    private double priorityScore;
    private double riskScore;
    private int queuePosition;
    private int estimatedWaitTime;
    private String status;
    private String geofenceStatus;
    private String doctorName;
    private String doctorId;
    private boolean urgencyFlag;
    private String recommendedAction;

    public Long getAppointmentId() { return appointmentId; }
    public void setAppointmentId(Long appointmentId) { this.appointmentId = appointmentId; }
    public String getTokenNumber() { return tokenNumber; }
    public void setTokenNumber(String tokenNumber) { this.tokenNumber = tokenNumber; }
    public String getPatientName() { return patientName; }
    public void setPatientName(String patientName) { this.patientName = patientName; }
    public int getAge() { return age; }
    public void setAge(int age) { this.age = age; }
    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }
    public String getSymptoms() { return symptoms; }
    public void setSymptoms(String symptoms) { this.symptoms = symptoms; }
    public String getExtractedSymptoms() { return extractedSymptoms; }
    public void setExtractedSymptoms(String extractedSymptoms) { this.extractedSymptoms = extractedSymptoms; }
    public String getAiDiagnosis() { return aiDiagnosis; }
    public void setAiDiagnosis(String aiDiagnosis) { this.aiDiagnosis = aiDiagnosis; }
    public String getClinicalNotes() { return clinicalNotes; }
    public void setClinicalNotes(String clinicalNotes) { this.clinicalNotes = clinicalNotes; }
    public String getSeverityLevel() { return severityLevel; }
    public void setSeverityLevel(String severityLevel) { this.severityLevel = severityLevel; }
    public double getPriorityScore() { return priorityScore; }
    public void setPriorityScore(double priorityScore) { this.priorityScore = priorityScore; }
    public double getRiskScore() { return riskScore; }
    public void setRiskScore(double riskScore) { this.riskScore = riskScore; }
    public int getQueuePosition() { return queuePosition; }
    public void setQueuePosition(int queuePosition) { this.queuePosition = queuePosition; }
    public int getEstimatedWaitTime() { return estimatedWaitTime; }
    public void setEstimatedWaitTime(int estimatedWaitTime) { this.estimatedWaitTime = estimatedWaitTime; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getGeofenceStatus() { return geofenceStatus; }
    public void setGeofenceStatus(String geofenceStatus) { this.geofenceStatus = geofenceStatus; }
    public String getDoctorName() { return doctorName; }
    public void setDoctorName(String doctorName) { this.doctorName = doctorName; }
    public String getDoctorId() { return doctorId; }
    public void setDoctorId(String doctorId) { this.doctorId = doctorId; }
    public boolean isUrgencyFlag() { return urgencyFlag; }
    public void setUrgencyFlag(boolean urgencyFlag) { this.urgencyFlag = urgencyFlag; }
    public String getRecommendedAction() { return recommendedAction; }
    public void setRecommendedAction(String recommendedAction) { this.recommendedAction = recommendedAction; }
}
