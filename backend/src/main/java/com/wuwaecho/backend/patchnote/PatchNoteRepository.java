package com.wuwaecho.backend.patchnote;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PatchNoteRepository extends JpaRepository<PatchNote, String> {

    /** 노출 상태(ACTIVE)인 게시물을 최신 날짜부터. 같은 날이면 나중에 등록한 것(id가 큰 것)이 먼저. */
    Page<PatchNote> findByStatusOrderByPublishedDateDescIdDesc(String status, Pageable pageable);
}
