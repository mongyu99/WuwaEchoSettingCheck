package com.wuwaecho.backend.broadcast;

public record BroadcastResponse(String id, String title, String imagePath, String url) {

    static BroadcastResponse from(Broadcast entity) {
        return new BroadcastResponse(entity.getId(), entity.getTitle(), entity.getImagePath(), entity.getUrl());
    }
}
