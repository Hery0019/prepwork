package com.example.inventory.common;

import java.util.List;
import org.springframework.data.domain.Page;

/**
 * Single shape of paginated responses (CORE-014): content, page, size, totalElements.
 */
public record PageResponse<T>(List<T> content, int page, int size, long totalElements) {

    public static <T> PageResponse<T> from(Page<T> page) {
        return new PageResponse<>(page.getContent(), page.getNumber(), page.getSize(), page.getTotalElements());
    }
}
