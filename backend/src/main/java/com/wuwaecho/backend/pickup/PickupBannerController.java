package com.wuwaecho.backend.pickup;

import java.time.OffsetDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/pickups")
@RequiredArgsConstructor
public class PickupBannerController {

    private final PickupBannerRepository repository;

    @GetMapping
    public List<PickupBannerResponse> showing() {
        return repository.findShowing(OffsetDateTime.now()).stream().map(PickupBannerResponse::from).toList();
    }
}
