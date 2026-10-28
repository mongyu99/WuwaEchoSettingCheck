package com.wuwaecho.backend.patchnote;

import java.time.LocalDate;

public record PatchNoteResponse(String id, String version, LocalDate date, String content) {

    static PatchNoteResponse from(PatchNote entity) {
        return new PatchNoteResponse(
                entity.getId(), entity.getVersion(), entity.getPublishedDate(), entity.getContent());
    }
}
