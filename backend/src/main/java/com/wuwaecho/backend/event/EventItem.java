package com.wuwaecho.backend.event;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "events")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EventItem {

    /** 관리자 페이지가 등록 시각으로 만드는 글자 ID(event_1761550000000). */
    @Id
    private String id;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(length = 1024)
    private String image;

    @Column(name = "starts_at", nullable = false)
    private OffsetDateTime startsAt;

    @Column(name = "ends_at", nullable = false)
    private OffsetDateTime endsAt;

    @Column(length = 2048)
    private String url;

    @Column(nullable = false, length = 10)
    private String status;
}
