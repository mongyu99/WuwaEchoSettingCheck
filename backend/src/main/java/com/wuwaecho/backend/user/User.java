package com.wuwaecho.backend.user;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "users")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 20)
    private String provider;

    @Column(name = "provider_user_id", nullable = false, length = 255)
    private String providerUserId;

    @Column(length = 320)
    private String email;

    @Column(length = 100)
    private String nickname;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "last_login_at", nullable = false)
    private OffsetDateTime lastLoginAt;

    public static User register(String provider, String providerUserId, String email, String nickname) {
        User user = new User();
        user.provider = provider;
        user.providerUserId = providerUserId;
        user.email = email;
        user.nickname = nickname;
        OffsetDateTime now = OffsetDateTime.now();
        user.createdAt = now;
        user.lastLoginAt = now;
        return user;
    }

    public void recordLogin(String email, String nickname) {
        this.email = email;
        this.nickname = nickname;
        this.lastLoginAt = OffsetDateTime.now();
    }
}
