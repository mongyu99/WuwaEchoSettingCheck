package com.wuwaecho.backend.banner;

import java.time.OffsetDateTime;

public record MainBannerResponse(
        String id, String title, String imagePath, OffsetDateTime startsAt, OffsetDateTime endsAt) {

    static MainBannerResponse from(MainBanner entity) {
        return new MainBannerResponse(
                entity.getId(),
                entity.getTitle(),
                entity.getImagePath(),
                entity.getStartsAt(),
                entity.getEndsAt());
    }
}
