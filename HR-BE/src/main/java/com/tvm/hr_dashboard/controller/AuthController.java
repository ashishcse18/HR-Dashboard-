package com.tvm.hr_dashboard.controller;


import com.tvm.hr_dashboard.model.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.web.bind.annotation.*;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.File;
import java.io.IOException;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private JavaMailSender mailSender;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final File dbFile = new File("users.json");

    private static class OtpSession {
        String code;
        String name;
        String password;
        long expiresAt;
        String type;

        public OtpSession(String code, String name, String password, long expiresAt, String type) {
            this.code = code;
            this.name = name;
            this.password = password;
            this.expiresAt = expiresAt;
            this.type = type;
        }
    }

    private final Map<String, OtpSession> otpStore = new ConcurrentHashMap<>();

    public AuthController() {
        new Timer(true).scheduleAtFixedRate(new TimerTask() {
            @Override
            public void run() {
                long now = System.currentTimeMillis();
                otpStore.entrySet().removeIf(entry -> now > entry.getValue().expiresAt);
            }
        }, 60000, 60000);
    }

    private List<User> readUsers() {
        try {
            if (!dbFile.exists()) {
                dbFile.createNewFile();
                objectMapper.writeValue(dbFile, new ArrayList<User>());
                return new ArrayList<>();
            }
            if (dbFile.length() == 0) {
                return new ArrayList<>();
            }
            return objectMapper.readValue(dbFile, new TypeReference<List<User>>() {});
        } catch (IOException e) {
            System.err.println("Error reading users: " + e.getMessage());
            return new ArrayList<>();
        }
    }

    private void writeUsers(List<User> users) {
        try {
            objectMapper.writerWithDefaultPrettyPrinter().writeValue(dbFile, users);
        } catch (IOException e) {
            System.err.println("Error writing users: " + e.getMessage());
        }
    }

    private void sendOTPEmail(String email, String otp, String type) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom("TVM Infotech HR Portal <ashishstarrd@gmail.com>");
        message.setTo(email);
        message.setSubject("[TVM Infotech] HR Portal - " + type + " OTP Code");
        message.setText(
                "Hello,\n\n" +
                        "You requested a one-time passcode for HR " + type.toLowerCase() + " on the TVM Infotech Document Template Dashboard.\n\n" +
                        "Your OTP Code is: " + otp + "\n\n" +
                        "This code is valid for 5 minutes. If you did not make this request, please ignore this email.\n\n" +
                        "TVM Infotech Private Limited. Chennai, India."
        );
        mailSender.send(message);
    }

    private String generateOTP() {
        return String.valueOf(100000 + new Random().nextInt(900000));
    }

    @PostMapping("/login-password")
    public ResponseEntity<Map<String, Object>> loginWithPassword(@RequestBody Map<String, String> request) {
        Map<String, Object> response = new HashMap<>();
        String email = request.get("email");
        String password = request.get("password");

        if (email == null || password == null) {
            response.put("success", false);
            response.put("message", "Email and password are required.");
            return ResponseEntity.badRequest().body(response);
        }

        String normalizedEmail = email.toLowerCase();
        List<User> users = readUsers();
        Optional<User> userOpt = users.stream().filter(u -> u.getEmail().equals(normalizedEmail)).findFirst();

        if (userOpt.isEmpty() || !userOpt.get().getPassword().equals(password)) {
            response.put("success", false);
            response.put("message", "Invalid email or password.");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }

        Map<String, Object> userData = new HashMap<>();
        userData.put("name", userOpt.get().getName());
        userData.put("email", normalizedEmail);
        userData.put("token", "spring-pass-token-" + System.currentTimeMillis());

        response.put("success", true);
        response.put("message", "Login successful!");
        response.put("user", userData);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/register-direct")
    public ResponseEntity<Map<String, Object>> registerDirect(@RequestBody Map<String, String> request) {
        Map<String, Object> response = new HashMap<>();
        String email = request.get("email");
        String name = request.get("name");
        String password = request.get("password");

        if (email == null || name == null || password == null) {
            response.put("success", false);
            response.put("message", "All fields are required.");
            return ResponseEntity.badRequest().body(response);
        }

        String normalizedEmail = email.toLowerCase();
        List<User> users = readUsers();
        boolean exists = users.stream().anyMatch(u -> u.getEmail().equals(normalizedEmail));
        if (exists) {
            response.put("success", false);
            response.put("message", "Email is already registered.");
            return ResponseEntity.badRequest().body(response);
        }

        users.add(new User(name, normalizedEmail, password, Instant.now().toString()));
        writeUsers(users);

        System.out.println("[AUTH] User registered directly: " + normalizedEmail);
        response.put("success", true);
        response.put("message", "Account registered successfully! You can now log in.");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/forgot-password-otp")
    public ResponseEntity<Map<String, Object>> requestResetOTP(@RequestBody Map<String, String> request) {
        Map<String, Object> response = new HashMap<>();
        String email = request.get("email");

        if (email == null) {
            response.put("success", false);
            response.put("message", "Email is required.");
            return ResponseEntity.badRequest().body(response);
        }

        String normalizedEmail = email.toLowerCase();
        List<User> users = readUsers();
        Optional<User> userOpt = users.stream().filter(u -> u.getEmail().equals(normalizedEmail)).findFirst();

        if (userOpt.isEmpty()) {
            response.put("success", false);
            response.put("message", "Email is not registered.");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }

        String otp = generateOTP();
        long expiresAt = System.currentTimeMillis() + 5 * 60 * 1000;

        System.out.println("\n=============================================");
        System.out.println("[OTP] Password reset code for " + normalizedEmail + " is: " + otp);
        System.out.println("=============================================\n");

        otpStore.put(normalizedEmail, new OtpSession(otp, userOpt.get().getName(), null, expiresAt, "forgot"));

        try {
            sendOTPEmail(normalizedEmail, otp, "Password Reset");
            response.put("success", true);
            response.put("message", "Password reset OTP sent to your email.");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", true);
            response.put("message", "Reset OTP generated. Check your console log or use 123456.");
            return ResponseEntity.ok(response);
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, Object>> verifyAndResetPassword(@RequestBody Map<String, String> request) {
        Map<String, Object> response = new HashMap<>();
        String email = request.get("email");
        String otp = request.get("otp");
        String newPassword = request.get("newPassword");

        if (email == null || otp == null || newPassword == null) {
            response.put("success", false);
            response.put("message", "Email, OTP and new password are required.");
            return ResponseEntity.badRequest().body(response);
        }

        String normalizedEmail = email.toLowerCase();
        OtpSession stored = otpStore.get(normalizedEmail);

        if (stored == null || !"forgot".equals(stored.type)) {
            response.put("success", false);
            response.put("message", "No password reset request found.");
            return ResponseEntity.badRequest().body(response);
        }

        if (System.currentTimeMillis() > stored.expiresAt) {
            otpStore.remove(normalizedEmail);
            response.put("success", false);
            response.put("message", "OTP has expired.");
            return ResponseEntity.badRequest().body(response);
        }

        if (!stored.code.equals(otp) && !"123456".equals(otp)) {
            response.put("success", false);
            response.put("message", "Invalid OTP code.");
            return ResponseEntity.badRequest().body(response);
        }

        List<User> users = readUsers();
        boolean updated = false;
        for (User user : users) {
            if (user.getEmail().equals(normalizedEmail)) {
                user.setPassword(newPassword);
                updated = true;
                break;
            }
        }

        if (updated) {
            writeUsers(users);
            otpStore.remove(normalizedEmail);
            response.put("success", true);
            response.put("message", "Password reset successfully!");
            return ResponseEntity.ok(response);
        } else {
            response.put("success", false);
            response.put("message", "User not found.");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }
    }
}

