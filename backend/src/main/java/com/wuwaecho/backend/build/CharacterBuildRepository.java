package com.wuwaecho.backend.build;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CharacterBuildRepository extends JpaRepository<CharacterBuild, Long> {

    List<CharacterBuild> findByUserIdOrderByCharacterIdAsc(Long userId);
}
