package com.wuwaecho.backend.event;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** 버전별 공식 이벤트 노트 이미지. 관리자 페이지에서 등록합니다. */
@Entity
@Table(name = "event_notes")
@Getter
@NoArgsConstructor
public class EventNote {

    /** 관리자 페이지가 등록 시각으로 만드는 글자 ID(eventnote_1761550000000). */
    @Id
    private String id;

    @Column(nullable = false, length = 20)
    private String version;

    @Column(length = 1024)
    private String image;

    @Column(nullable = false, length = 10)
    private String status;
}
