package com.wuwaecho.backend.banner;

import java.time.OffsetDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface MainBannerRepository extends JpaRepository<MainBanner, String> {

    /** 아직 끝나지 않은 배너. 시작 전인 다음 버전 배너(ACTIVE·UPCOMING)도 미리 보여 줍니다(타이머는 "버전 시작 전"으로 표시). */
    @Query("""
            SELECT b FROM MainBanner b
            WHERE b.status IN ('ACTIVE', 'UPCOMING') AND b.endsAt > :now
            ORDER BY b.sortOrder, b.startsAt
            """)
    List<MainBanner> findShowing(OffsetDateTime now);
}
