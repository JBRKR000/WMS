package com.kozimor.wms.Database.Repository;
import org.springframework.data.jpa.repository.JpaRepository;
import com.kozimor.wms.Database.Model.User;

public interface UserRepository extends JpaRepository<User, Long> {
    
}
