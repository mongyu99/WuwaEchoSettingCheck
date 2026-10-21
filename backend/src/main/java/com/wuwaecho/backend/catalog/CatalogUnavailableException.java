package com.wuwaecho.backend.catalog;

// 전부 죽었을때를 상정한 에러 페이지
public class CatalogUnavailableException extends RuntimeException {

    public CatalogUnavailableException(String message, Throwable cause) {
        super(message, cause);
    }
}
