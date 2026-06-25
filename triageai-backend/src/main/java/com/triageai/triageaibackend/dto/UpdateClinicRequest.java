package com.triageai.triageaibackend.dto;

public class UpdateClinicRequest {
    private String clinicName;
    private String email;
    private String phone;
    private String address;
    private Double latitude;
    private Double longitude;
    private Integer thresholdDistance;
    private String password;

    public String getClinicName() { return clinicName; }
    public void setClinicName(String clinicName) { this.clinicName = clinicName; }
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
    public Integer getThresholdDistance() { return thresholdDistance; }
    public void setThresholdDistance(Integer thresholdDistance) { this.thresholdDistance = thresholdDistance; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
}
