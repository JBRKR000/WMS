package com.kozimor.wms.Security;

import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.security.core.Authentication;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class JwtService {

    private final JwtEncoder jwtEncoder;
    private final long expirationMs;
    private final String issuer;

    public JwtService(JwtEncoder jwtEncoder,
                      @Value("${jwt.expiration-ms}") long expirationMs,
                      @Value("${jwt.issuer}") String issuer) {
        this.jwtEncoder = jwtEncoder;
        this.expirationMs = expirationMs;
        this.issuer = issuer;
    }

    public String generateToken(Authentication authentication) {
        Instant now = Instant.now();
        Instant exp = now.plusMillis(expirationMs);

        List<String> roles = authentication.getAuthorities()
                .stream()
                .map(a -> {
                    String auth = a.getAuthority();
                    if (auth == null) return "";
                    return auth.startsWith("ROLE_") ? auth.substring(5) : auth;
                })
                .filter(s -> !s.isBlank())
                .collect(Collectors.toList());

        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer(issuer)
                .issuedAt(now)
                .expiresAt(exp)
                .subject(authentication.getName())
                .claim("roles", roles)
                .build();

        JwsHeader jwsHeader = JwsHeader.with(() -> "HS256").build();
        JwtEncoderParameters params = JwtEncoderParameters.from(jwsHeader, claims);
        Jwt jwt = jwtEncoder.encode(params);
        return jwt.getTokenValue();
    }
}