package com.triageai.triageaibackend.dto;

public class ClinicStatsResponse {
    private int totalPatientsToday;
    private int completedConsultations;
    private int criticalCasesCount;
    private int highCount;
    private int mediumCount;
    private int lowCount;
    private int activeDoctors;
    private int inConsultationCount;
    private int waitingCount;
    private int averageWaitTime;
    private double averageRiskScore;

    public int getTotalPatientsToday() { return totalPatientsToday; }
    public void setTotalPatientsToday(int totalPatientsToday) { this.totalPatientsToday = totalPatientsToday; }
    public int getCompletedConsultations() { return completedConsultations; }
    public void setCompletedConsultations(int completedConsultations) { this.completedConsultations = completedConsultations; }
    public int getCriticalCasesCount() { return criticalCasesCount; }
    public void setCriticalCasesCount(int criticalCasesCount) { this.criticalCasesCount = criticalCasesCount; }
    public int getHighCount() { return highCount; }
    public void setHighCount(int highCount) { this.highCount = highCount; }
    public int getMediumCount() { return mediumCount; }
    public void setMediumCount(int mediumCount) { this.mediumCount = mediumCount; }
    public int getLowCount() { return lowCount; }
    public void setLowCount(int lowCount) { this.lowCount = lowCount; }
    public int getActiveDoctors() { return activeDoctors; }
    public void setActiveDoctors(int activeDoctors) { this.activeDoctors = activeDoctors; }
    public int getInConsultationCount() { return inConsultationCount; }
    public void setInConsultationCount(int inConsultationCount) { this.inConsultationCount = inConsultationCount; }
    public int getWaitingCount() { return waitingCount; }
    public void setWaitingCount(int waitingCount) { this.waitingCount = waitingCount; }
    public int getAverageWaitTime() { return averageWaitTime; }
    public void setAverageWaitTime(int averageWaitTime) { this.averageWaitTime = averageWaitTime; }
    public double getAverageRiskScore() { return averageRiskScore; }
    public void setAverageRiskScore(double averageRiskScore) { this.averageRiskScore = averageRiskScore; }
}
