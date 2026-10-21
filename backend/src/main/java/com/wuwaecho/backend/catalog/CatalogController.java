package com.wuwaecho.backend.catalog;

import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/api/catalog")
@RequiredArgsConstructor
public class CatalogController {

    private final CatalogService catalogService;

    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public String catalog() {
        return catalogService.getJson();
    }

    /** 전부 실패 시 503 반환 */
    @ExceptionHandler(CatalogUnavailableException.class)
    @ResponseStatus(HttpStatus.SERVICE_UNAVAILABLE)
    public Map<String, String> unavailable(CatalogUnavailableException e) {
        log.error("catalog 응답 불가: {}", e.getMessage(), e);
        return Map.of("message", "점검 중입니다. 잠시 후 다시 접속해 주세요.");
    }
}
