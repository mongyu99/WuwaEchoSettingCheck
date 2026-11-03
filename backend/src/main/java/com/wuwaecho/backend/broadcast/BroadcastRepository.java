package com.wuwaecho.backend.broadcast;

import java.time.OffsetDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface BroadcastRepository extends JpaRepository<Broadcast, String> {

    /** 아직 종료되지 않은 ACTIVE 방송 소식. */
    @Query("""
            SELECT b FROM Broadcast b
            WHERE b.status = 'ACTIVE' AND b.endsAt > :now
            ORDER BY b.sortOrder, b.endsAt
            """)
    List<Broadcast> findShowing(OffsetDateTime now);
}
