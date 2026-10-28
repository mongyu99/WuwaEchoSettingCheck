package com.wuwaecho.backend.patchnote;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDate;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** 사이트 업데이트 기록. 등록·수정은 관리자 페이지(JdbcClient)에서 하고, 여기서는 읽기만 합니다. */
@Entity
@Table(name = "patch_notes")
@Getter
@NoArgsConstructor
public class PatchNote {

    @Id
    private String id;

    @Column(nullable = false)
    private String version;

    @Column(name = "published_date", nullable = false)
    private LocalDate publishedDate;

    @Column(nullable = false)
    private String content;

    @Column(nullable = false)
    private String status;
}
