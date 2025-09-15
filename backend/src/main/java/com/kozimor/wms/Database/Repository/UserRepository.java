package com.kozimor.wms.Database.Repository;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

import com.kozimor.wms.Database.Model.User;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
}
