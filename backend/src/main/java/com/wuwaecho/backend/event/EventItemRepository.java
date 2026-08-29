package com.wuwaecho.backend.event;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EventItemRepository extends JpaRepository<EventItem, Long> {

    List<EventItem> findAllByOrderByStartsAtAsc();
}
