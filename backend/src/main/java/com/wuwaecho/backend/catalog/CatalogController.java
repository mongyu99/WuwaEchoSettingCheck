package com.wuwaecho.backend.catalog;

import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 사이트가 처음 열릴 때 한 번 받아가는 게임 기준 데이터 전체입니다. 테이블별 행 목록을 그대로 돌려주고,
 * 화면에서 쓰는 모양으로 묶는 건 프론트(src/config/catalog.js)가 합니다. 숨김(HIDDEN) 항목은 뺍니다.
 * Redis에 캐시된 JSON 문자열을 그대로 내려보내서, 요청마다 DB 조회나 JSON 변환을 하지 않습니다.
 */
@RestController
@RequestMapping("/api/catalog")
@RequiredArgsConstructor
public class CatalogController {

    private final CatalogService catalogService;

    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public String catalog() {
        return catalogService.getJson();
    }
}
