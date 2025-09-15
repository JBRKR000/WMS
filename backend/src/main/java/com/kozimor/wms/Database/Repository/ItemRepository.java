package com.kozimor.wms.Database.Repository;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

import com.kozimor.wms.Database.Model.Item;

public interface ItemRepository extends JpaRepository<Item, Long> 
{
    Optional<Item> findByQrCode(String qrCode);
}
