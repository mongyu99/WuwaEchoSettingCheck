package com.wuwaecho.backend.broadcast;

import java.time.OffsetDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/broadcasts")
@RequiredArgsConstructor
public class BroadcastController {

    private final BroadcastRepository repository;

    @GetMapping
    public List<BroadcastResponse> showing() {
        return repository.findShowing(OffsetDateTime.now()).stream().map(BroadcastResponse::from).toList();
    }
}
