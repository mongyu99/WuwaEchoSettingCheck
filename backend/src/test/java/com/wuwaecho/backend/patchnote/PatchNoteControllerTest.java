package com.wuwaecho.backend.patchnote;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.mockito.ArgumentCaptor;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

class PatchNoteControllerTest {

    private final PatchNoteRepository repository = mock(PatchNoteRepository.class);
    private final PatchNoteController controller = new PatchNoteController(repository);

    @BeforeEach
    void setUp() {
        when(repository.findByStatusOrderByPublishedDateDescIdDesc(eq("ACTIVE"), any()))
                .thenReturn(new PageImpl<>(List.of()));
    }

    @ParameterizedTest
    @CsvSource({"0,10,0,10", "-1,10,0,10", "2,0,2,1", "0,-5,0,1", "0,50,0,50", "0,51,0,50", "999,10,999,10"})
    @DisplayName("페이지와 크기를 허용 범위로 맞춰 조회한다")
    void clampsPaging(int page, int size, int expectedPage, int expectedSize) {
        controller.list(page, size);

        ArgumentCaptor<Pageable> captor = ArgumentCaptor.forClass(Pageable.class);
        verify(repository).findByStatusOrderByPublishedDateDescIdDesc(eq("ACTIVE"), captor.capture());
        assertThat(captor.getValue().getPageNumber()).isEqualTo(expectedPage);
        assertThat(captor.getValue().getPageSize()).isEqualTo(expectedSize);
    }
}
