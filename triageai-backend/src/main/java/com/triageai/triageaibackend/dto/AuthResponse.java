package com.triageai.triageaibackend.dto;

public class AuthResponse {
    private String token;
    private String userId;
    private String role;
    private String name;

    public AuthResponse(String token, String userId, String role, String name) {
        this.token = token; this.userId = userId; this.role = role; this.name = name;
    }
    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
}
