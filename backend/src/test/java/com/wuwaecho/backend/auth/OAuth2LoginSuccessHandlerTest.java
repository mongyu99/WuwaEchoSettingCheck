package com.wuwaecho.backend.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.wuwaecho.backend.config.FrontendProperties;
import com.wuwaecho.backend.user.User;
import com.wuwaecho.backend.user.UserRepository;
import java.io.IOException;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;

class OAuth2LoginSuccessHandlerTest {

    private final UserRepository userRepository = mock(UserRepository.class);
    private final JwtService jwtService = mock(JwtService.class);
    private final FrontendProperties frontendProperties = mock(FrontendProperties.class);
    private final OAuth2AuthenticationToken token = mock(OAuth2AuthenticationToken.class);
    private final MockHttpServletResponse response = new MockHttpServletResponse();

    private OAuth2LoginSuccessHandler handler;

    @BeforeEach
    void setUp() {
        OAuth2User principal = mock(OAuth2User.class);
        when(principal.getName()).thenReturn("provider-id");
        when(principal.getAttribute("email")).thenReturn("new@example.com");
        when(principal.getAttribute("name")).thenReturn("새 닉네임");
        when(token.getAuthorizedClientRegistrationId()).thenReturn("google");
        when(token.getPrincipal()).thenReturn(principal);
        when(frontendProperties.redirectUri()).thenReturn("https://example.com/");
        when(jwtService.issue(any())).thenReturn("issued-token");
        handler = new OAuth2LoginSuccessHandler(userRepository, jwtService, frontendProperties);
    }

    @Test
    @DisplayName("처음 로그인하면 사용자를 저장하고 토큰을 붙여 리다이렉트한다")
    void newUserIsSaved() throws IOException {
        when(userRepository.findByProviderAndProviderUserId("google", "provider-id")).thenReturn(Optional.empty());
        when(userRepository.save(any())).thenAnswer(call -> call.getArgument(0));

        handler.onAuthenticationSuccess(new MockHttpServletRequest(), response, token);

        verify(userRepository).save(any());
        assertThat(response.getRedirectedUrl()).isEqualTo("https://example.com/?token=issued-token");
    }

    @Test
    @DisplayName("이미 있는 사용자는 새로 저장하지 않고 로그인 정보만 갱신한다")
    void existingUserIsNotSavedAgain() throws IOException {
        User existing = User.register("google", "provider-id", "old@example.com", "옛 닉네임");
        when(userRepository.findByProviderAndProviderUserId("google", "provider-id")).thenReturn(Optional.of(existing));

        handler.onAuthenticationSuccess(new MockHttpServletRequest(), response, token);

        verify(userRepository, never()).save(any());
        assertThat(existing.getEmail()).isEqualTo("new@example.com");
        assertThat(existing.getNickname()).isEqualTo("새 닉네임");
        assertThat(response.getRedirectedUrl()).contains("token=issued-token");
    }
}
