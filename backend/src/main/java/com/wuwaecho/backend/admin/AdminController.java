package com.wuwaecho.backend.admin;

import com.wuwaecho.backend.admin.AdminCatalog.Column;
import com.wuwaecho.backend.admin.AdminCatalog.Table;
import java.io.IOException;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/** 게임 기준 데이터 관리 API. admin 프로필에서만 생성되므로 운영 서버에는 이 주소가 존재하지 않습니다. */
@Profile("admin")
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private static final Set<String> STATUSES = Set.of("ACTIVE", "HIDDEN", "UPCOMING");
    private static final Pattern SAFE_ID = Pattern.compile("[A-Za-z0-9_-]{1,80}");
    private static final int MAX_IMAGE_BYTES = 5 * 1024 * 1024;

    private final JdbcClient jdbc;

    /** 프론트 프로젝트의 public 폴더. backend 폴더에서 실행하는 기준으로 ../public 입니다. */
    @Value("${app.admin.public-dir:../public}")
    private String publicDir;

    @GetMapping("/tables")
    public Map<String, Table> tables() {
        return AdminCatalog.TABLES;
    }

    @GetMapping("/{kind}")
    public List<Map<String, Object>> list(@PathVariable String kind) {
        Table table = table(kind);
        return jdbc.sql("SELECT * FROM " + table.name() + " ORDER BY sort_order, id").query().listOfRows();
    }

    @PutMapping("/{kind}/{id}")
    public Map<String, Object> upsert(@PathVariable String kind, @PathVariable String id,
            @RequestBody Map<String, Object> body) {
        Table table = table(kind);
        Map<String, Object> values = new LinkedHashMap<>();
        for (Column column : table.columns()) {
            Object value = column.name().equals("id") ? id : convert(column, body.get(column.name()));
            if (column.required() && value == null) {
                throw badRequest(column.label() + "은(는) 필수입니다.");
            }
            values.put(column.name(), value);
        }
        String cols = String.join(", ", values.keySet());
        String params = values.keySet().stream().map(c -> ":" + c).collect(Collectors.joining(", "));
        String updates = values.keySet().stream().filter(c -> !c.equals("id"))
                .map(c -> c + " = EXCLUDED." + c).collect(Collectors.joining(", "));
        jdbc.sql("INSERT INTO " + table.name() + " (" + cols + ") VALUES (" + params + ")"
                        + " ON CONFLICT (id) DO UPDATE SET " + updates)
                .params(values)
                .update();
        return values;
    }

    /**
     * 브라우저에서 webp로 변환한 이미지를 받아 프론트 public/{폴더}/{id}.webp 에 저장하고 경로를 DB에 기록합니다.
     * webp 파일 머리(RIFF....WEBP)를 확인해서 다른 형식은 거부합니다.
     */
    @PostMapping(value = "/{kind}/{id}/image", consumes = "image/webp")
    public Map<String, String> uploadImage(@PathVariable String kind, @PathVariable String id,
            @RequestBody byte[] image) throws IOException {
        Table table = table(kind);
        if (!SAFE_ID.matcher(id).matches()) {
            throw badRequest("ID는 영문·숫자·_·- 만 쓸 수 있습니다.");
        }
        if (image.length > MAX_IMAGE_BYTES) {
            throw badRequest("이미지가 너무 큽니다(최대 5MB).");
        }
        if (!isWebp(image)) {
            throw badRequest("webp 이미지가 아닙니다.");
        }
        Path folder = Path.of(publicDir, table.imageFolder()).toAbsolutePath().normalize();
        Files.createDirectories(folder);
        Files.write(folder.resolve(id + ".webp"), image);

        String path = table.imageFolder() + "/" + id + ".webp";
        jdbc.sql("UPDATE " + table.name() + " SET " + table.imageColumn() + " = :path WHERE id = :id")
                .param("path", path)
                .param("id", id)
                .update();
        return Map.of("path", path);
    }

    private static boolean isWebp(byte[] b) {
        return b.length > 12
                && new String(b, 0, 4, StandardCharsets.US_ASCII).equals("RIFF")
                && new String(b, 8, 4, StandardCharsets.US_ASCII).equals("WEBP");
    }

    @DeleteMapping("/{kind}/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String kind, @PathVariable String id) {
        jdbc.sql("DELETE FROM " + table(kind).name() + " WHERE id = :id").param("id", id).update();
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, String> constraintViolation(DataIntegrityViolationException e) {
        return Map.of("message", "DB 제약 조건 위반: " + e.getMostSpecificCause().getMessage());
    }

    private static Table table(String kind) {
        Table table = AdminCatalog.TABLES.get(kind);
        if (table == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
        return table;
    }

    private static Object convert(Column column, Object raw) {
        if (raw == null || raw.toString().isBlank()) {
            return null;
        }
        String text = raw.toString().trim();
        try {
            return switch (column.type()) {
                case TEXT -> text;
                case INT -> Integer.valueOf(text);
                case NUMBER -> new BigDecimal(text);
                case STATUS -> {
                    if (!STATUSES.contains(text)) {
                        throw badRequest("노출 상태는 ACTIVE / HIDDEN / UPCOMING 중 하나여야 합니다.");
                    }
                    yield text;
                }
            };
        } catch (NumberFormatException e) {
            throw badRequest(column.label() + "은(는) 숫자여야 합니다.");
        }
    }

    private static ResponseStatusException badRequest(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }
}
