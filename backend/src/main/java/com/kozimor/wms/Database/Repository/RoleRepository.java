package com.kozimor.wms.Database.Repository;
import org.springframework.data.jpa.repository.JpaRepository;
import com.kozimor.wms.Database.Model.Role;

public interface RoleRepository extends JpaRepository<Role, Long> 
{
    
}
