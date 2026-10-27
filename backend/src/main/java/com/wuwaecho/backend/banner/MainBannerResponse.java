package com.wuwaecho.backend.banner;

import java.time.OffsetDateTime;

public record MainBannerResponse(
        String id, String title, String imagePath, String url, OffsetDateTime startsAt, OffsetDateTime endsAt) {

    static MainBannerResponse from(MainBanner entity) {
        return new MainBannerResponse(
                entity.getId(),
                entity.getTitle(),
                entity.getImagePath(),
                entity.getUrl(),
                entity.getStartsAt(),
                entity.getEndsAt());
    }
}
