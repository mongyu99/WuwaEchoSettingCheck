package com.wuwaecho.backend.pickup;

import java.time.OffsetDateTime;

public record PickupBannerResponse(
        String id, String title, String imagePath, OffsetDateTime startsAt, OffsetDateTime endsAt, boolean upcoming) {

    /** upcoming: UPCOMING으로 등록했거나 아직 시작 전이면 true(화면에 "예정" 표시). */
    static PickupBannerResponse from(PickupBanner entity, OffsetDateTime now) {
        return new PickupBannerResponse(
                entity.getId(),
                entity.getTitle(),
                entity.getImagePath(),
                entity.getStartsAt(),
                entity.getEndsAt(),
                "UPCOMING".equals(entity.getStatus()) || entity.getStartsAt().isAfter(now));
    }
}
