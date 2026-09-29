package com.wuwaecho.backend.build;

import com.wuwaecho.backend.user.User;
import com.wuwaecho.backend.user.UserRepository;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/** 사용자별 characterData를 DB에 저장/조회합니다. JSON ↔ 엔티티 변환은 CharacterStateMapper가 맡습니다. */
@Service
@RequiredArgsConstructor
public class CharacterStateService {

    private final CharacterBuildRepository buildRepository;
    private final UserRepository userRepository;
    private final CharacterStateMapper mapper;

    @Transactional(readOnly = true)
    public String load(Long userId) {
        List<CharacterBuild> builds = buildRepository.findByUserIdOrderByCharacterIdAsc(userId);
        return builds.isEmpty() ? null : mapper.toJson(builds);
    }

    @Transactional
    public void save(Long userId, String dataJson) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        Map<String, CharacterStatePayload.Record> incoming = mapper.parse(dataJson);

        Map<String, CharacterBuild> existing = buildRepository.findByUserIdOrderByCharacterIdAsc(userId).stream()
                .collect(Collectors.toMap(CharacterBuild::getCharacterId, Function.identity()));

        // Hibernate는 flush 때 INSERT를 DELETE보다 먼저 실행해서, 같은 (build_id, slot)을 바로 다시 넣으면
        // 유니크 제약에 걸립니다. 그래서 기존 자식 행을 먼저 지우고 flush한 뒤에 새로 채웁니다.
        existing.forEach((characterId, build) -> {
            if (incoming.containsKey(characterId)) {
                build.getEchoes().clear();
                build.getEchoSets().clear();
            } else {
                buildRepository.delete(build);
            }
        });
        buildRepository.flush();

        OffsetDateTime now = OffsetDateTime.now();
        incoming.forEach((characterId, record) -> {
            CharacterBuild build = existing.get(characterId);
            if (build == null) {
                build = new CharacterBuild(user, characterId);
            }
            mapper.applyRecord(build, record);
            build.setUpdatedAt(now);
            buildRepository.save(build);
        });
    }
}
