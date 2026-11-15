package com.wuwaecho.backend.event;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EventNoteRepository extends JpaRepository<EventNote, String> {

    /** 이미지가 있는 노출 상태(ACTIVE) 노트 중 가장 최근에 등록한 것. ID에 등록 시각이 들어 있어 ID 역순이 최신순입니다. */
    Optional<EventNote> findFirstByStatusAndImageIsNotNullOrderByIdDesc(String status);
}
