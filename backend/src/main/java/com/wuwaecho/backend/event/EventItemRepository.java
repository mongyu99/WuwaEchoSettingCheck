package com.wuwaecho.backend.event;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EventItemRepository extends JpaRepository<EventItem, String> {

    /** 노출 상태(ACTIVE)인 이벤트를 시작일 순으로. */
    List<EventItem> findByStatusOrderByStartsAtAsc(String status);
}
