package com.kozimor.wms.Database.Model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "users",
       uniqueConstraints = {
         @UniqueConstraint(columnNames = "username"),
         @UniqueConstraint(columnNames = "email")
       },
       indexes = {
         @Index(name = "idx_users_username", columnList = "username"),
         @Index(name = "idx_users_email", columnList = "email")
       })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = "password")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Long id;

    @NotBlank
    @Column(nullable = false, length = 100)
    private String username;

    @NotBlank
    @JsonIgnore
    @Column(nullable = false, length = 255)
    private String password; // Hashed password

    @Email
    @NotBlank
    @Column(nullable = false, length = 200)
    private String email;

    @Column(name = "first_name", length = 100)
    private String firstName;

    @Column(name = "last_name", length = 100)
    private String lastName;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "role_id")
    private Role role;
}
