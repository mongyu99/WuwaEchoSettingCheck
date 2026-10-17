package com.wuwaecho.backend.config;

import io.netty.resolver.DefaultAddressResolverGroup;
import org.springframework.boot.data.redis.autoconfigure.ClientResourcesBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Redis 재시작으로 컨테이너 IP가 바뀌어도 다시 붙을 수 있게 합니다.
 * <p>
 * Lettuce는 netty-resolver-dns가 있으면 자체 DNS 캐시를 쓰는데, Docker DNS가 주는 TTL(600초) 동안 예전 IP를 계속 씁니다.
 * 그래서 Redis가 새 IP로 살아나도 최대 10분간 예전 IP로만 재접속을 시도합니다. JVM 기본 resolver(캐시 30초)로 바꿔서
 * 재접속할 때 이름을 새로 확인하게 합니다.
 */
@Configuration
public class RedisClientConfig {

    @Bean
    ClientResourcesBuilderCustomizer jvmAddressResolver() {
        return builder -> builder.addressResolverGroup(DefaultAddressResolverGroup.INSTANCE);
    }
}
