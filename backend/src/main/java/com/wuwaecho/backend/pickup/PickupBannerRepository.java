package com.wuwaecho.backend.pickup;

import java.time.OffsetDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface PickupBannerRepository extends JpaRepository<PickupBanner, String> {

    /** 지금 노출 기간 안에 있는 ACTIVE 픽업 배너. */
    @Query("""
            SELECT p FROM PickupBanner p
            WHERE p.status = 'ACTIVE' AND p.startsAt <= :now AND p.endsAt > :now
            ORDER BY p.sortOrder, p.startsAt
            """)
    List<PickupBanner> findShowing(OffsetDateTime now);
}
