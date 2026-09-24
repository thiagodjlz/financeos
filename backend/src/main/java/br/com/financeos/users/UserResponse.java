package br.com.financeos.users;

import java.util.UUID;

public record UserResponse(UUID id, String name, String email, boolean active, UUID profileId, String profileName) {

    public static UserResponse from(AppUser user) {
        return from(user, user.profileName);
    }

    public static UserResponse from(AppUser user, String profileName) {
        return new UserResponse(user.id, user.name, user.email, user.active, user.profileId, profileName);
    }
}
