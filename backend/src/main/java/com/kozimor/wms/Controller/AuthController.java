package com.kozimor.wms.Controller;

import com.kozimor.wms.Security.JwtService;
import com.kozimor.wms.Database.Model.User;
import com.kozimor.wms.Database.Model.Role;
import com.kozimor.wms.Database.Repository.UserRepository;
import com.kozimor.wms.Database.Repository.RoleRepository;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import java.util.regex.Pattern;

record LoginRequest(String username, String password) {
}

record LoginResponse(String token, long expiresInMs) {
}

record RegisterRequest(String username, String password, String role, String email, String firstName, String lastName) {
}

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final long expirationMs;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthController(AuthenticationManager authenticationManager,
            JwtService jwtService,
            @org.springframework.beans.factory.annotation.Value("${jwt.expiration-ms}") long expirationMs,
            UserRepository userRepository,
            RoleRepository roleRepository,
            PasswordEncoder passwordEncoder) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.expirationMs = expirationMs;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.username(), request.password()));
        String token = jwtService.generateToken(authentication);
        return ResponseEntity.status(HttpStatus.OK)
                .body(new LoginResponse(token, expirationMs));
    }

    @PostMapping("/register")
    @Transactional
    public ResponseEntity<?> register(@RequestBody RegisterRequest req) {
        if (req.username() == null || req.username().isBlank() || req.password() == null || req.password().isBlank()) {
            return ResponseEntity.badRequest().body("username and password must be provided");
        }
        if (req.email() == null || req.email().isBlank()) {
            return ResponseEntity.badRequest().body("email must be provided");
        }
        if (req.firstName() == null || req.firstName().isBlank()) {
            return ResponseEntity.badRequest().body("firstName must be provided");
        }
        if (req.lastName() == null || req.lastName().isBlank()) {
            return ResponseEntity.badRequest().body("lastName must be provided");
        }
        Pattern EMAIL = Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");
        if (!EMAIL.matcher(req.email()).matches()) {
            return ResponseEntity.badRequest().body("email format is invalid");
        }
        if (userRepository.findByUsername(req.username()).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Username already exists");
        }
        String roleName = (req.role() == null || req.role().isBlank()) ? "ROLE_USER" : req.role();
        if (!roleName.startsWith("ROLE_")) {
            roleName = "ROLE_" + roleName;
        }
        var roleOpt = roleRepository.findByRoleName(roleName);
        if (roleOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Requested role does not exist: " + roleName);
        }
        Role role = roleOpt.get();

        User user = User.builder()
                .username(req.username())
                .password(passwordEncoder.encode(req.password()))
                .email(req.email())
                .firstName(req.firstName())
                .lastName(req.lastName())
                .role(role)
                .build();

        userRepository.save(user);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }
}