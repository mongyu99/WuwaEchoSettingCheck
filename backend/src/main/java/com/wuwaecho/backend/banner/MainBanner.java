package com.wuwaecho.backend.banner;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** 홈 메인 배너. 등록·수정은 관리자 페이지(JdbcClient)에서 하고, 여기서는 읽기만 합니다. */
@Entity
@Table(name = "main_banners")
@Getter
@NoArgsConstructor
public class MainBanner {

    @Id
    private String id;

    @Column(nullable = false)
    private String title;

    @Column(name = "image_path")
    private String imagePath;

    @Column(name = "starts_at", nullable = false)
    private OffsetDateTime startsAt;

    @Column(name = "ends_at", nullable = false)
    private OffsetDateTime endsAt;

    @Column(nullable = false)
    private String status;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;
}
