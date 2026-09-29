package com.wuwaecho.backend.auth;

import com.wuwaecho.backend.config.FrontendProperties;
import com.wuwaecho.backend.user.User;
import com.wuwaecho.backend.user.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.util.UriComponentsBuilder;

/** 소셜 로그인 성공 시 사용자를 가입/갱신하고, JWT를 붙여 프론트로 되돌려 보냅니다. */
@Component
@RequiredArgsConstructor
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final FrontendProperties frontendProperties;

    @Override
    @Transactional
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
            Authentication authentication) throws IOException {
        OAuth2AuthenticationToken token = (OAuth2AuthenticationToken) authentication;
        String provider = token.getAuthorizedClientRegistrationId();
        OAuth2User principal = token.getPrincipal();
        String providerUserId = principal.getName();
        String email = principal.getAttribute("email");
        String nickname = principal.getAttribute("name");

        User user = userRepository.findByProviderAndProviderUserId(provider, providerUserId)
                .map(existing -> {
                    existing.recordLogin(email, nickname);
                    return existing;
                })
                .orElseGet(() -> userRepository.save(User.register(provider, providerUserId, email, nickname)));

        String redirectUrl = UriComponentsBuilder.fromUriString(frontendProperties.redirectUri())
                .queryParam("token", jwtService.issue(user.getId()))
                .build()
                .toUriString();
        response.sendRedirect(redirectUrl);
    }
}
