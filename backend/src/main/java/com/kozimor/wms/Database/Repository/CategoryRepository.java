package com.kozimor.wms.Database.Repository;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

import com.kozimor.wms.Database.Model.Category;

public interface CategoryRepository extends JpaRepository<Category, Long> 
{
    Optional<Category> findByName(String name);
}
