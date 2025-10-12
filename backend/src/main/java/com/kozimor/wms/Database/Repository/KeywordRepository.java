package com.kozimor.wms.Database.Repository;

import com.kozimor.wms.Database.Model.Keyword;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface KeywordRepository extends JpaRepository<Keyword, Long> {
    Optional<Keyword> findByValue(String value);
    
    @Query("SELECT k FROM Keyword k WHERE LOWER(k.value) LIKE LOWER(CONCAT('%', :value, '%'))")
    List<Keyword> findByValueContainingIgnoreCase(@Param("value") String value);
}
