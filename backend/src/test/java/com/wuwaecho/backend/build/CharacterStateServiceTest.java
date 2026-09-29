package com.wuwaecho.backend.build;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.wuwaecho.backend.IntegrationTest;
import com.wuwaecho.backend.user.User;
import com.wuwaecho.backend.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.transaction.annotation.Transactional;

/** DB가 있어야만 확인되는 것만 검사합니다. JSON ↔ 엔티티 변환은 CharacterStateMapperTest(단위 테스트)에서. */
@IntegrationTest
@Transactional
class CharacterStateServiceTest {

    @Autowired
    CharacterStateService service;

    @Autowired
    UserRepository userRepository;

    @Autowired
    JdbcClient jdbc;

    Long userId;

    @BeforeEach
    void createUser() {
        userId = newUser();
    }

    @Test
    void resavingSameSlotsDoesNotViolateUniqueConstraint() {
        service.save(userId, "{\"jiyan\": {\"echoes\": [{\"cost\": 4}, {\"cost\": 3}]}, \"encore\": {\"echoes\": []}}");
        // 같은 (build_id, slot)을 다시 저장: 삭제보다 INSERT가 먼저 나가면 유니크 위반.
        service.save(userId, "{\"jiyan\": {\"echoes\": [{\"cost\": 1}]}}");

        String json = service.load(userId);
        assertThat(json).contains("\"cost\":1").doesNotContain("\"cost\":4", "encore");
    }

    @Test
    void usersDoNotSeeEachOthersData() {
        service.save(userId, "{\"jiyan\": {\"echoes\": []}}");

        assertThat(service.load(newUser())).isNull();
    }

    @Test
    void databaseRejectsLabelOutsideWhitelist() {
        service.save(userId, "{\"jiyan\": {\"echoes\": [{}]}}");

        assertThatThrownBy(() -> jdbc.sql("""
                        INSERT INTO echo_stats (echo_id, kind, slot, label)
                        SELECT e.id, 'SUB', 9, '해킹된 옵션' FROM build_echoes e
                        JOIN character_builds b ON b.id = e.build_id WHERE b.user_id = ?
                        """).param(userId).update())
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void deletingUserCascadesToAllChildRows() {
        service.save(userId, """
                {"jiyan": {"echoes": [{"subStats": [{"label": "HP", "valueText": "430"}]}],
                  "echoParts": [{"setId": "sierra-gale", "pieceCount": 5}]}}
                """);
        Long buildId = jdbc.sql("SELECT id FROM character_builds WHERE user_id = ?").param(userId)
                .query(Long.class).single();

        jdbc.sql("DELETE FROM users WHERE id = ?").param(userId).update();

        assertThat(count("SELECT count(*) FROM character_builds WHERE id = ?", buildId)).isZero();
        assertThat(count("SELECT count(*) FROM build_echo_sets WHERE build_id = ?", buildId)).isZero();
        assertThat(count("SELECT count(*) FROM build_echoes WHERE build_id = ?", buildId)).isZero();
    }

    @Test
    void whitelistSeedDataIsComplete() {
        assertThat(count("SELECT count(*) FROM stat_labels WHERE kind = 'MAIN'")).isEqualTo(18);
        assertThat(count("SELECT count(*) FROM stat_labels WHERE kind = 'SUB'")).isEqualTo(13);
        assertThat(count("SELECT count(DISTINCT label) FROM sub_stat_tiers")).isEqualTo(13);
        assertThat(count("SELECT count(*) FROM sub_stat_tiers")).isEqualTo(8 * 10 + 5 + 8 + 5);
    }

    private Long newUser() {
        return userRepository.save(User.register("google", "sub-" + System.nanoTime(), null, null)).getId();
    }

    private long count(String sql, Object... params) {
        var spec = jdbc.sql(sql);
        for (Object p : params) {
            spec = spec.param(p);
        }
        return spec.query(Long.class).single();
    }
}
