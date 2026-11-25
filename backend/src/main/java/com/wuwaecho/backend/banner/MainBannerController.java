package com.wuwaecho.backend.banner;

import java.net.URI;
import java.time.OffsetDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/banners")
@RequiredArgsConstructor
public class MainBannerController {

    private final MainBannerRepository repository;

    @GetMapping
    public List<MainBannerResponse> showing() {
        return repository.findShowing(OffsetDateTime.now()).stream().map(MainBannerResponse::from).toList();
    }

    /**
     * 지금 맨 앞에 보이는 배너 이미지로 보내는 주소(302).
     * index.html이 JS를 기다리지 않고 이 주소로 첫 배너를 미리 받아 두게 해서, 처음 방문한 사람의 LCP를 줄입니다.
     * 보여 줄 배너가 없으면 204(내용 없음).
     */
    @GetMapping("/first-image")
    public ResponseEntity<Void> firstImage() {
        return repository.findShowing(OffsetDateTime.now()).stream()
                .map(MainBanner::getImagePath)
                .filter(path -> path != null && !path.isBlank())
                .findFirst()
                .<ResponseEntity<Void>>map(path -> ResponseEntity.status(HttpStatus.FOUND)
                        .location(URI.create("/" + path.replaceFirst("^/+", "")))
                        .build())
                .orElseGet(() -> ResponseEntity.noContent().build());
    }
}
