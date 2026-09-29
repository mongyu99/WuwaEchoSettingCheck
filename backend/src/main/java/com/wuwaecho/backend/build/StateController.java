package com.wuwaecho.backend.build;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/state")
@RequiredArgsConstructor
public class StateController {

    private final CharacterStateService stateService;

    /** data는 프론트 characterData를 JSON.stringify한 문자열입니다(저장된 게 없으면 null). */
    public record StateBody(String data) {
    }

    @GetMapping
    public StateBody load(@AuthenticationPrincipal Long userId) {
        return new StateBody(stateService.load(userId));
    }

    @PutMapping
    public StateBody save(@AuthenticationPrincipal Long userId, @RequestBody StateBody body) {
        if (body == null || body.data() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "data가 비어 있어요.");
        }
        stateService.save(userId, body.data());
        return body;
    }
}
