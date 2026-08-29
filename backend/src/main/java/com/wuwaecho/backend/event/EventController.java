package com.wuwaecho.backend.event;

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
        return repository.findAllByOrderByStartsAtAsc().stream().map(EventResponse::from).toList();
    }
}
