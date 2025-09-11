package com.kozimor.wms.Database.Repository;
import org.springframework.data.jpa.repository.JpaRepository;

import com.kozimor.wms.Database.Model.Category;

public interface CategoryRepository extends JpaRepository<Category, Long> 
{
    
}
