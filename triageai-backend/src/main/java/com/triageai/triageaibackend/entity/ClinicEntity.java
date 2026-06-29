package com.triageai.triageaibackend.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "clinics")
public class ClinicEntity {
    @Id
    private String clinicId;
    private String clinicName;
    @Column(unique = true)
    private String username;
    private String email;
    private String password;
    private String phone;
    private String address;
    private Double latitude;
    private Double longitude;
    private Integer thresholdDistance;
    @Column(columnDefinition = "LONGTEXT")
    private String qrCodeUrl;
    private boolean active;

    public String getClinicId() {
        return clinicId;
    }

    public void setClinicId(String clinicId) {
        this.clinicId = clinicId;
    }

    public String getClinicName() {
        return clinicName;
    }

    public void setClinicName(String clinicName) {
        this.clinicName = clinicName;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public Integer getThresholdDistance() {
        return thresholdDistance;
    }

    public void setThresholdDistance(Integer thresholdDistance) {
        this.thresholdDistance = thresholdDistance;
    }

    public String getQrCodeUrl() {
        return qrCodeUrl;
    }

    public void setQrCodeUrl(String qrCodeUrl) {
        this.qrCodeUrl = qrCodeUrl;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }
}
