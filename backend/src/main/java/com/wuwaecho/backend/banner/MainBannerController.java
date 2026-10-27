package com.wuwaecho.backend.banner;

import java.time.OffsetDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/banners")
@RequiredArgsConstructor
public class MainBannerController {

    private final MainBannerRepository repository;

    @GetMapping
    public List<MainBannerResponse> showing() {
        return repository.findShowing(OffsetDateTime.now()).stream().map(MainBannerResponse::from).toList();
    }
}
