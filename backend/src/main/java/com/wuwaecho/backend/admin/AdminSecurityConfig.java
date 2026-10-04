package com.wuwaecho.backend.admin;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.net.InetAddress;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.context.SecurityContextHolderFilter;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * /api/admin/** 전용 보안 설정. admin 프로필에서만 켜지고, 같은 PC(루프백 주소)에서 온 요청만 통과시킵니다.
 * 프로필을 실수로 켜더라도 다른 기기나 Docker 네트워크를 거친 요청은 403으로 막힙니다.
 */
@Profile("admin")
@Configuration
public class AdminSecurityConfig {

    @Bean
    @Order(0)
    public SecurityFilterChain adminSecurityFilterChain(HttpSecurity http,
            @Qualifier("corsConfigurationSource") CorsConfigurationSource cors)
            throws Exception {
        http.securityMatcher("/api/admin/**")
                .csrf(AbstractHttpConfigurer::disable)
                .cors(c -> c.configurationSource(cors))
                .authorizeHttpRequests(auth -> auth.anyRequest().permitAll())
                .addFilterBefore(new LoopbackOnlyFilter(), SecurityContextHolderFilter.class);
        return http.build();
    }

    static class LoopbackOnlyFilter extends OncePerRequestFilter {
        @Override
        protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
                throws ServletException, IOException {
            if (!InetAddress.getByName(request.getRemoteAddr()).isLoopbackAddress()) {
                response.sendError(HttpServletResponse.SC_FORBIDDEN, "관리자 API는 로컬에서만 사용할 수 있습니다.");
                return;
            }
            chain.doFilter(request, response);
        }
    }
}
