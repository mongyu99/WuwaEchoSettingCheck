package com.wuwaecho.backend.build;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.List;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "build_echoes")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class BuildEcho {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "build_id", nullable = false)
    private CharacterBuild build;

    @Column(nullable = false)
    private short slot;

    private Short cost;

    @OneToMany(mappedBy = "echo", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("kind ASC, slot ASC")
    private List<EchoStat> stats = new ArrayList<>();

    public BuildEcho(short slot, Short cost) {
        this.slot = slot;
        this.cost = cost;
    }

    public void addStat(EchoStat stat) {
        stat.setEcho(this);
        stats.add(stat);
    }
}
