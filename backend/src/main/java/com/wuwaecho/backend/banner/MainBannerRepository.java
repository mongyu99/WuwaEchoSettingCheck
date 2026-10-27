package com.wuwaecho.backend.banner;

import java.time.OffsetDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface MainBannerRepository extends JpaRepository<MainBanner, String> {

    /** 지금 노출 기간 안에 있는 ACTIVE 배너. */
    @Query("""
            SELECT b FROM MainBanner b
            WHERE b.status = 'ACTIVE' AND b.startsAt <= :now AND b.endsAt > :now
            ORDER BY b.sortOrder, b.startsAt
            """)
    List<MainBanner> findShowing(OffsetDateTime now);
}
