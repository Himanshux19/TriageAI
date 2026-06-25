package com.triageai.triageaibackend;

import com.triageai.triageaibackend.entity.ClinicEntity;
import com.triageai.triageaibackend.entity.DoctorEntity;
import com.triageai.triageaibackend.repository.ClinicRepository;
import com.triageai.triageaibackend.repository.DoctorRepository;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;

@SpringBootTest
class TriageaiBackendApplicationTests {

    @BeforeAll
    static void loadEnv() {
        try {
            java.io.InputStream is = TriageaiBackendApplicationTests.class.getClassLoader().getResourceAsStream(".env");
            if (is == null) {
                java.io.File file = new java.io.File(".env");
                if (file.exists()) {
                    is = new java.io.FileInputStream(file);
                }
            }
            if (is != null) {
                try (java.io.BufferedReader reader = new java.io.BufferedReader(new java.io.InputStreamReader(is))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        line = line.trim();
                        if (line.isEmpty() || line.startsWith("#")) continue;
                        int idx = line.indexOf('=');
                        if (idx > 0) {
                            String key = line.substring(0, idx).trim();
                            String value = line.substring(idx + 1).trim();
                            if (value.startsWith("\"") && value.endsWith("\"") && value.length() >= 2) {
                                value = value.substring(1, value.length() - 1);
                            } else if (value.startsWith("'") && value.endsWith("'") && value.length() >= 2) {
                                value = value.substring(1, value.length() - 1);
                            }
                            if (System.getProperty(key) == null) {
                                System.setProperty(key, value);
                            }
                        }
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Warning: Could not load .env file in test: " + e.getMessage());
        }
    }

    @Autowired
    private DoctorRepository doctorRepo;

    @Autowired
    private ClinicRepository clinicRepo;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    void resetDoctorAndClinicPasswords() {
        // Doctors
        List<DoctorEntity> doctors = doctorRepo.findAll();
        for (DoctorEntity doc : doctors) {
            String defaultPwd = "Doc@" + doc.getDoctorId();
            doc.setPassword(passwordEncoder.encode(defaultPwd));
            doctorRepo.save(doc);
            System.out.println("Reset password for doctor: " + doc.getDoctorId() + " to " + defaultPwd);
        }
        
        // Clinic
        clinicRepo.findByUsername("shreenh11").ifPresent(c -> {
            c.setPassword(passwordEncoder.encode("clinic123"));
            clinicRepo.save(c);
            System.out.println("Reset password for clinic shreenh11 to clinic123");
        });
    }
}
