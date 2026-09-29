package com.wuwaecho.backend.user;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequiredArgsConstructor
public class MeController {

    private final UserRepository userRepository;

    public record MeResponse(Long id, String email, String nickname) {
    }

    @GetMapping("/api/me")
    public MeResponse me(@AuthenticationPrincipal Long userId) {
        // 토큰은 유효한데 사용자 행이 지워진 경우 401을 줘서 프론트가 토큰을 버리게 합니다.
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        return new MeResponse(user.getId(), user.getEmail(), user.getNickname());
    }
}
