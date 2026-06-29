package com.triageai.triageaibackend.dto;

import java.util.List;
import java.util.Map;

public class AppointmentResponse {
    private Long id;
    private Long appointmentId;
    private String tokenNumber;
    private String patientName;
    private int age;
    private String gender;
    private String symptoms;
    private String extractedSymptoms;
    private String aiDiagnosis;
    private String clinicalNotes;
    private boolean urgencyFlag;
    private String recommendedAction;
    private double diseaseScore;
    private double riskScore;
    private double severityScore;
    private double priorityScore;
    private String severityLevel;
    private String status;
    private String geofenceStatus;
    private int queuePosition;
    private int estimatedWaitTime;
    private String doctorName;
    private String doctorId;
    private String bookingTime;
    private List<Map<String, String>> icdCodes;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getAppointmentId() {
        return appointmentId;
    }

    public void setAppointmentId(Long appointmentId) {
        this.appointmentId = appointmentId;
    }

    public String getTokenNumber() {
        return tokenNumber;
    }

    public void setTokenNumber(String tokenNumber) {
        this.tokenNumber = tokenNumber;
    }

    public String getPatientName() {
        return patientName;
    }

    public void setPatientName(String patientName) {
        this.patientName = patientName;
    }

    public int getAge() {
        return age;
    }

    public void setAge(int age) {
        this.age = age;
    }

    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }

    public String getSymptoms() {
        return symptoms;
    }

    public void setSymptoms(String symptoms) {
        this.symptoms = symptoms;
    }

    public String getExtractedSymptoms() {
        return extractedSymptoms;
    }

    public void setExtractedSymptoms(String extractedSymptoms) {
        this.extractedSymptoms = extractedSymptoms;
    }

    public String getAiDiagnosis() {
        return aiDiagnosis;
    }

    public void setAiDiagnosis(String aiDiagnosis) {
        this.aiDiagnosis = aiDiagnosis;
    }

    public String getClinicalNotes() {
        return clinicalNotes;
    }

    public void setClinicalNotes(String clinicalNotes) {
        this.clinicalNotes = clinicalNotes;
    }

    public boolean isUrgencyFlag() {
        return urgencyFlag;
    }

    public void setUrgencyFlag(boolean urgencyFlag) {
        this.urgencyFlag = urgencyFlag;
    }

    public String getRecommendedAction() {
        return recommendedAction;
    }

    public void setRecommendedAction(String recommendedAction) {
        this.recommendedAction = recommendedAction;
    }

    public double getDiseaseScore() {
        return diseaseScore;
    }

    public void setDiseaseScore(double diseaseScore) {
        this.diseaseScore = diseaseScore;
    }

    public double getRiskScore() {
        return riskScore;
    }

    public void setRiskScore(double riskScore) {
        this.riskScore = riskScore;
    }

    public double getSeverityScore() {
        return severityScore;
    }

    public void setSeverityScore(double severityScore) {
        this.severityScore = severityScore;
    }

    public double getPriorityScore() {
        return priorityScore;
    }

    public void setPriorityScore(double priorityScore) {
        this.priorityScore = priorityScore;
    }

    public String getSeverityLevel() {
        return severityLevel;
    }

    public void setSeverityLevel(String severityLevel) {
        this.severityLevel = severityLevel;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getGeofenceStatus() {
        return geofenceStatus;
    }

    public void setGeofenceStatus(String geofenceStatus) {
        this.geofenceStatus = geofenceStatus;
    }

    public int getQueuePosition() {
        return queuePosition;
    }

    public void setQueuePosition(int queuePosition) {
        this.queuePosition = queuePosition;
    }

    public int getEstimatedWaitTime() {
        return estimatedWaitTime;
    }

    public void setEstimatedWaitTime(int estimatedWaitTime) {
        this.estimatedWaitTime = estimatedWaitTime;
    }

    public String getDoctorName() {
        return doctorName;
    }

    public void setDoctorName(String doctorName) {
        this.doctorName = doctorName;
    }

    public String getDoctorId() {
        return doctorId;
    }

    public void setDoctorId(String doctorId) {
        this.doctorId = doctorId;
    }

    public String getBookingTime() {
        return bookingTime;
    }

    public void setBookingTime(String bookingTime) {
        this.bookingTime = bookingTime;
    }

    public List<Map<String, String>> getIcdCodes() {
        return icdCodes;
    }

    public void setIcdCodes(List<Map<String, String>> icdCodes) {
        this.icdCodes = icdCodes;
    }
}
