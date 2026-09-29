package com.wuwaecho.backend.build;

import com.wuwaecho.backend.user.User;
import jakarta.persistence.CascadeType;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
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
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "character_builds")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CharacterBuild {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, updatable = false)
    private User user;

    @Column(name = "character_id", nullable = false, updatable = false, length = 50)
    private String characterId;

    @Column(name = "weapon_id", length = 50)
    private String weaponId;

    @Column(name = "main_echo_id", length = 50)
    private String mainEchoId;

    @Column(name = "echo_sets_customized", nullable = false)
    private boolean echoSetsCustomized;

    @Column(name = "base_char_atk", precision = 10, scale = 2)
    private BigDecimal baseCharAtk;

    @Column(name = "base_weapon_atk", precision = 10, scale = 2)
    private BigDecimal baseWeaponAtk;

    @Column(name = "base_hp", precision = 10, scale = 2)
    private BigDecimal baseHp;

    @Column(name = "base_def", precision = 10, scale = 2)
    private BigDecimal baseDef;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @ElementCollection
    @CollectionTable(name = "build_echo_sets", joinColumns = @JoinColumn(name = "build_id"))
    private List<EchoSetPart> echoSets = new ArrayList<>();

    @OneToMany(mappedBy = "build", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("slot ASC")
    private List<BuildEcho> echoes = new ArrayList<>();

    public CharacterBuild(User user, String characterId) {
        this.user = user;
        this.characterId = characterId;
        OffsetDateTime now = OffsetDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    public void addEcho(BuildEcho echo) {
        echo.setBuild(this);
        echoes.add(echo);
    }
}
