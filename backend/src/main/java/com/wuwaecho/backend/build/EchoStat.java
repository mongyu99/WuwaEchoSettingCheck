package com.wuwaecho.backend.build;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "echo_stats")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class EchoStat {

    public enum Kind { MAIN, SUB }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "echo_id", nullable = false)
    private BuildEcho echo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 4)
    private Kind kind;

    @Column(nullable = false)
    private short slot;

    /** stat_labels 화이트리스트에 있는 값만 들어갑니다. 비어 있거나 목록에 없던 옵션은 null. */
    @Column(length = 50)
    private String label;

    @Column(precision = 8, scale = 2)
    private BigDecimal value;

    @Column(name = "is_percent", nullable = false)
    private boolean percent;

    @Column(nullable = false)
    private boolean highlighted;

    public EchoStat(Kind kind, short slot, String label, BigDecimal value, boolean percent, boolean highlighted) {
        this.kind = kind;
        this.slot = slot;
        this.label = label;
        this.value = value;
        this.percent = percent;
        this.highlighted = highlighted;
    }
}
