package com.wuwaecho.backend.patchnote;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PatchNoteRepository extends JpaRepository<PatchNote, Long> {

    Page<PatchNote> findByTitleContainingIgnoreCaseOrderByPublishedDateDescIdDesc(String query, Pageable pageable);
}
