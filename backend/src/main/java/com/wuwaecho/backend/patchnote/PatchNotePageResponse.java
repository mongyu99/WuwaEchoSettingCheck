package com.wuwaecho.backend.patchnote;

import java.util.List;
import org.springframework.data.domain.Page;

public record PatchNotePageResponse(
        List<PatchNoteResponse> items,
        int page,
        int size,
        long totalElements,
        int totalPages,
        boolean hasNext) {

    static PatchNotePageResponse from(Page<PatchNote> result) {
        return new PatchNotePageResponse(
                result.getContent().stream().map(PatchNoteResponse::from).toList(),
                result.getNumber(),
                result.getSize(),
                result.getTotalElements(),
                result.getTotalPages(),
                result.hasNext());
    }
}
