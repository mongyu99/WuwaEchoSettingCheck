package com.wuwaecho.backend.event;

import java.time.OffsetDateTime;

public record EventResponse(
        Long id, String title, String image, OffsetDateTime startsAt, OffsetDateTime endsAt, String url) {

    static EventResponse from(EventItem entity) {
        return new EventResponse(
                entity.getId(),
                entity.getTitle(),
                entity.getImage(),
                entity.getStartsAt(),
                entity.getEndsAt(),
                entity.getUrl());
    }
}
