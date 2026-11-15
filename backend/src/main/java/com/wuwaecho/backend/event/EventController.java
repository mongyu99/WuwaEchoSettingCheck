package com.wuwaecho.backend.event;

import java.time.OffsetDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class EventController {

    private final EventItemRepository repository;

    @GetMapping
    public List<EventResponse> list() {
        // UPCOMING으로 등록한 이벤트도 보여 주고, 화면에서 "예정"으로 표시합니다.
        OffsetDateTime now = OffsetDateTime.now();
        return repository.findByStatusInOrderByStartsAtAsc(List.of("ACTIVE", "UPCOMING")).stream()
                .map(e -> EventResponse.from(e, now))
                .toList();
    }
}
