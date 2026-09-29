package com.wuwaecho.backend.build;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.function.Supplier;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;
import org.springframework.util.function.SingletonSupplier;

/** stat_labels / sub_stat_tiers 화이트리스트입니다. 마이그레이션으로만 바뀌므로 처음 한 번 읽어 캐시합니다. */
@Component
public class StatCatalog {

    private record Snapshot(Map<EchoStat.Kind, Set<String>> labels, Map<String, Set<BigDecimal>> subTiers) {
    }

    private final Supplier<Snapshot> snapshot;

    @Autowired
    public StatCatalog(JdbcClient jdbc) {
        this.snapshot = SingletonSupplier.of(() -> load(jdbc));
    }

    /** DB 없이 고정 목록으로 만듭니다(단위 테스트용). */
    StatCatalog(Map<EchoStat.Kind, Set<String>> labels, Map<String, Set<BigDecimal>> subTiers) {
        Map<String, Set<BigDecimal>> normalized = new HashMap<>();
        subTiers.forEach((label, values) -> normalized.put(label,
                values.stream().map(BigDecimal::stripTrailingZeros).collect(java.util.stream.Collectors.toSet())));
        Snapshot fixed = new Snapshot(labels, normalized);
        this.snapshot = () -> fixed;
    }

    public boolean isAllowedLabel(EchoStat.Kind kind, String label) {
        return snapshot.get().labels().getOrDefault(kind, Set.of()).contains(label);
    }

    /** 서브옵션 수치가 그 라벨의 단계값 중 하나인지 봅니다(6.40과 6.4는 같은 값으로 취급). */
    public boolean isAllowedSubValue(String label, BigDecimal value) {
        return snapshot.get().subTiers().getOrDefault(label, Set.of()).contains(value.stripTrailingZeros());
    }

    private static Snapshot load(JdbcClient jdbc) {
        Map<EchoStat.Kind, Set<String>> labels = new HashMap<>();
        jdbc.sql("SELECT kind, label FROM stat_labels")
                .query((rs, n) -> Map.entry(EchoStat.Kind.valueOf(rs.getString("kind")), rs.getString("label")))
                .list()
                .forEach(e -> labels.computeIfAbsent(e.getKey(), k -> new HashSet<>()).add(e.getValue()));

        Map<String, Set<BigDecimal>> subTiers = new HashMap<>();
        jdbc.sql("SELECT label, value FROM sub_stat_tiers")
                .query((rs, n) -> Map.entry(rs.getString("label"), rs.getBigDecimal("value").stripTrailingZeros()))
                .list()
                .forEach(e -> subTiers.computeIfAbsent(e.getKey(), k -> new HashSet<>()).add(e.getValue()));

        return new Snapshot(labels, subTiers);
    }
}
