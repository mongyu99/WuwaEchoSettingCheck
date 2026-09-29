package com.wuwaecho.backend.build;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Embeddable
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
public class EchoSetPart {

    @Column(name = "set_id", nullable = false, length = 50)
    private String setId;

    @Column(name = "piece_count", nullable = false)
    private short pieceCount;
}
