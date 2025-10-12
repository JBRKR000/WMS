package com.kozimor.wms.Database.Repository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

import com.kozimor.wms.Database.Model.Item;

public interface ItemRepository extends JpaRepository<Item, Long> 
{
    Optional<Item> findByQrCode(String qrCode);

    @EntityGraph(attributePaths = {"category", "keywords"})
    @Query("select i from Item i")
    Page<Item> findAllWithCategory(Pageable pageable);
}
