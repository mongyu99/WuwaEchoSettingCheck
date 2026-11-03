package com.wuwaecho.backend.broadcast;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** 홈 방송 소식. 등록·수정은 관리자 페이지(JdbcClient)에서 하고, 여기서는 읽기만 합니다. */
@Entity
@Table(name = "broadcasts")
@Getter
@NoArgsConstructor
public class Broadcast {

    @Id
    private String id;

    @Column(nullable = false)
    private String title;

    @Column(name = "image_path")
    private String imagePath;

    private String url;

    @Column(name = "ends_at", nullable = false)
    private OffsetDateTime endsAt;

    @Column(nullable = false)
    private String status;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;
}
