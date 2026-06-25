package com.triageai.triageaibackend.dto;

public class ClinicProfileResponse {
    private String clinicId;
    private String clinicName;
    private String username;
    private String email;
    private String phone;
    private String address;
    private Double latitude;
    private Double longitude;
    private String qrCodeUrl;
    private int thresholdDistance;

    public String getClinicId() { return clinicId; }
    public void setClinicId(String clinicId) { this.clinicId = clinicId; }
    public String getClinicName() { return clinicName; }
    public void setClinicName(String clinicName) { this.clinicName = clinicName; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }
    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }
    public String getQrCodeUrl() { return qrCodeUrl; }
    public void setQrCodeUrl(String qrCodeUrl) { this.qrCodeUrl = qrCodeUrl; }
    public int getThresholdDistance() { return thresholdDistance; }
    public void setThresholdDistance(int thresholdDistance) { this.thresholdDistance = thresholdDistance; }
}
