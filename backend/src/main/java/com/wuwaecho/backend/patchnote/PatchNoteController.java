package com.wuwaecho.backend.patchnote;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/patch-notes")
@RequiredArgsConstructor
public class PatchNoteController {

    private static final int MAX_PAGE_SIZE = 50;

    private final PatchNoteRepository repository;

    @GetMapping
    public PatchNotePageResponse list(
            @RequestParam(defaultValue = "") String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        int cappedSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
        int safePage = Math.max(page, 0);
        Page<PatchNote> result = repository.findByTitleContainingIgnoreCaseOrderByPublishedDateDescIdDesc(
                query, PageRequest.of(safePage, cappedSize));
        return PatchNotePageResponse.from(result);
    }
}
