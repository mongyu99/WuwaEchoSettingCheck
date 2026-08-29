package com.wuwaecho.backend.patchnote;

import java.time.LocalDate;

public record PatchNoteResponse(Long id, String title, LocalDate date, String url) {

    static PatchNoteResponse from(PatchNote entity) {
        return new PatchNoteResponse(entity.getId(), entity.getTitle(), entity.getPublishedDate(), entity.getUrl());
    }
}
