package com.kozimor.wms.Database.Repository;
import org.springframework.data.jpa.repository.JpaRepository;
import com.kozimor.wms.Database.Model.Item;

public interface ItemRepository extends JpaRepository<Item, Long> 
{
    
}
