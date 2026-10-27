package com.wuwaecho.backend.pickup;

import java.time.OffsetDateTime;

public record PickupBannerResponse(
        String id, String title, String imagePath, OffsetDateTime startsAt, OffsetDateTime endsAt) {

    static PickupBannerResponse from(PickupBanner entity) {
        return new PickupBannerResponse(
                entity.getId(),
                entity.getTitle(),
                entity.getImagePath(),
                entity.getStartsAt(),
                entity.getEndsAt());
    }
}
