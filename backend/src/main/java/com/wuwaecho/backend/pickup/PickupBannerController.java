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

    /** 진행 중인 픽업이 있으면 그것만, 없으면 예정 픽업을 돌려줍니다(화면에 "예정" 표시). */
    @GetMapping
    public List<PickupBannerResponse> showing() {
        OffsetDateTime now = OffsetDateTime.now();
        List<PickupBanner> showing = repository.findShowing(now);
        if (showing.isEmpty()) {
            showing = repository.findUpcoming(now);
        }
        return showing.stream().map(p -> PickupBannerResponse.from(p, now)).toList();
    }
}
