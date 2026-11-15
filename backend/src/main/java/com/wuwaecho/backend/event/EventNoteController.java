package com.wuwaecho.backend.event;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/event-notes")
@RequiredArgsConstructor
public class EventNoteController {

    private final EventNoteRepository repository;

    public record EventNoteResponse(String version, String image) {
    }

    /** 최신 이벤트 노트 이미지. 없으면 204. */
    @GetMapping("/latest")
    public ResponseEntity<EventNoteResponse> latest() {
        return repository.findFirstByStatusAndImageIsNotNullOrderByIdDesc("ACTIVE")
                .map(n -> ResponseEntity.ok(new EventNoteResponse(n.getVersion(), n.getImage())))
                .orElseGet(() -> ResponseEntity.noContent().build());
    }
}
