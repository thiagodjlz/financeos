package br.com.financeos.shared;

import java.util.UUID;

import org.eclipse.microprofile.jwt.JsonWebToken;

import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;

@RequestScoped
public class CurrentUser {

    @Inject
    JsonWebToken jwt;

    public UUID id() {
        return UUID.fromString(jwt.getSubject());
    }
}
