package br.com.financeos.auth;

public record AuthResponse(String token, long expiresIn) {
}
