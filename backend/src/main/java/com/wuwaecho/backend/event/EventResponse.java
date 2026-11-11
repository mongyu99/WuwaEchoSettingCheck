package com.wuwaecho.backend.event;

import java.time.OffsetDateTime;

public record EventResponse(
        String id, String title, String image, OffsetDateTime startsAt, OffsetDateTime endsAt, String url,
        boolean upcoming) {

    /** upcoming: UPCOMING으로 등록했거나 아직 시작 전이면 true(화면에 "예정" 표시). */
    static EventResponse from(EventItem entity, OffsetDateTime now) {
        return new EventResponse(
                entity.getId(),
                entity.getTitle(),
                entity.getImage(),
                entity.getStartsAt(),
                entity.getEndsAt(),
                entity.getUrl(),
                "UPCOMING".equals(entity.getStatus()) || entity.getStartsAt().isAfter(now));
    }
}
