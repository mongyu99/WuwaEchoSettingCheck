package com.wuwaecho.backend.config;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.wuwaecho.backend.IntegrationTest;
import com.wuwaecho.backend.auth.JwtService;
import com.wuwaecho.backend.user.User;
import com.wuwaecho.backend.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@IntegrationTest
@AutoConfigureMockMvc
@Transactional
class SecurityConfigTest {

    @Autowired
    MockMvc mockMvc;

    @Autowired
    JwtService jwtService;

    @Autowired
    UserRepository userRepository;

    @Test
    void publicEndpointsDoNotNeedLogin() throws Exception {
        mockMvc.perform(get("/api/patch-notes")).andExpect(status().isOk());
        mockMvc.perform(get("/api/events")).andExpect(status().isOk());
    }

    @Test
    void protectedEndpointsReturn401InsteadOfLoginRedirect() throws Exception {
        mockMvc.perform(get("/api/me")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/state")).andExpect(status().isUnauthorized());
    }

    @Test
    void invalidTokenIsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/me").header("Authorization", "Bearer not-a-jwt"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void validTokenReturnsCurrentUser() throws Exception {
        User user = userRepository.save(User.register("google", "sub-" + System.nanoTime(), "me@test.dev", "몽규"));

        mockMvc.perform(get("/api/me").header("Authorization", bearer(user.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("me@test.dev"))
                .andExpect(jsonPath("$.nickname").value("몽규"));
    }

    @Test
    void tokenForDeletedUserIsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/me").header("Authorization", bearer(Long.MAX_VALUE)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void stateCanBeSavedAndLoadedThroughApi() throws Exception {
        User user = userRepository.save(User.register("google", "sub-" + System.nanoTime(), null, null));
        String auth = bearer(user.getId());

        mockMvc.perform(put("/api/state").header("Authorization", auth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"data\": \"{\\\"jiyan\\\": {\\\"echoes\\\": [], \\\"weapon\\\": \\\"w1\\\"}}\"}"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/state").header("Authorization", auth))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").value(org.hamcrest.Matchers.containsString("\"weapon\":\"w1\"")));
    }

    @Test
    void savingWithoutDataIsBadRequest() throws Exception {
        User user = userRepository.save(User.register("google", "sub-" + System.nanoTime(), null, null));

        mockMvc.perform(put("/api/state").header("Authorization", bearer(user.getId()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }

    private String bearer(Long userId) {
        return "Bearer " + jwtService.issue(userId);
    }
}
