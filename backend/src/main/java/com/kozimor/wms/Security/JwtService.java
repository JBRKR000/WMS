package com.kozimor.wms.Security;

import org.springframework.stereotype.Service;

import com.kozimor.wms.Database.Model.User;
import com.kozimor.wms.Database.Repository.UserRepository;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.security.core.Authentication;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class JwtService {

    private final JwtEncoder jwtEncoder;
    private final JwtDecoder jwtDecoder;
    private final long expirationMs;
    private final long refreshExpirationMs;
    private final String issuer;
    private final UserRepository userRepository;

    public JwtService(JwtEncoder jwtEncoder,
                      JwtDecoder jwtDecoder,
                      @Value("${jwt.expiration-ms}") long expirationMs,
                      @Value("${jwt.refresh-expiration-ms}") long refreshExpirationMs,
                      @Value("${jwt.issuer}") String issuer,
                      UserRepository userRepository) {
        this.jwtEncoder = jwtEncoder;
        this.jwtDecoder = jwtDecoder;
        this.expirationMs = expirationMs;
        this.refreshExpirationMs = refreshExpirationMs;
        this.issuer = issuer;
        this.userRepository = userRepository;
    }

    public String generateToken(Authentication authentication) {
        return generateToken(authentication, false);
    }

    public String generateRefreshToken(Authentication authentication) {
        return generateToken(authentication, true);
    }

    private String generateToken(Authentication authentication, boolean isRefreshToken) {
        Instant now = Instant.now();
        long expiration = isRefreshToken ? refreshExpirationMs : expirationMs;
        Instant exp = now.plusMillis(expiration);

        User user = userRepository.findByUsername(authentication.getName()).orElseThrow();

        JwtClaimsSet.Builder claimsBuilder = JwtClaimsSet.builder()
                .issuer(issuer)
                .issuedAt(now)
                .expiresAt(exp)
                .subject(authentication.getName())
                .claim("userId", user.getId())
                .claim("tokenType", isRefreshToken ? "refresh" : "access");

        if (!isRefreshToken) {
            List<String> roles = authentication.getAuthorities()
                    .stream()
                    .map(a -> {
                        String auth = a.getAuthority();
                        if (auth == null) return "";
                        return auth.startsWith("ROLE_") ? auth.substring(5) : auth;
                    })
                    .filter(s -> !s.isBlank())
                    .collect(Collectors.toList());
            claimsBuilder.claim("roles", roles);
        }

        JwtClaimsSet claims = claimsBuilder.build();
        JwsHeader jwsHeader = JwsHeader.with(() -> "HS256").build();
        JwtEncoderParameters params = JwtEncoderParameters.from(jwsHeader, claims);
        Jwt jwt = jwtEncoder.encode(params);
        return jwt.getTokenValue();
    }

    public boolean validateRefreshToken(String token) {
        try {
            Jwt jwt = jwtDecoder.decode(token);
            String tokenType = jwt.getClaimAsString("tokenType");
            Instant expiresAt = jwt.getExpiresAt();
            return "refresh".equals(tokenType) && 
                   expiresAt != null && 
                   expiresAt.isAfter(Instant.now());
        } catch (Exception e) {
            return false;
        }
    }

    public String getUsernameFromToken(String token) {
        try {
            Jwt jwt = jwtDecoder.decode(token);
            return jwt.getSubject();
        } catch (Exception e) {
            return null;
        }
    }
}