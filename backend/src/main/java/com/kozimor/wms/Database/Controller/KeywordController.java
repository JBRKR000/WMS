package com.kozimor.wms.Database.Controller;

import com.kozimor.wms.Database.Model.Keyword;
import com.kozimor.wms.Database.Model.DTO.KeywordResponseDTO;
import com.kozimor.wms.Database.Service.KeywordService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/keywords")
public class KeywordController {

    private final KeywordService keywordService;

    public KeywordController(KeywordService keywordService) {
        this.keywordService = keywordService;
    }

    @PostMapping
    public ResponseEntity<Keyword> createKeyword(@Valid @RequestBody Keyword keyword) {
        Keyword createdKeyword = keywordService.createKeyword(keyword);
        return new ResponseEntity<>(createdKeyword, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<KeywordResponseDTO>> getAllKeywords() {
        List<Keyword> keywords = keywordService.getAllKeywords();
        List<KeywordResponseDTO> response = keywords.stream()
                .map(KeywordResponseDTO::fromKeyword)
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Keyword> getKeywordById(@PathVariable Long id) {
        return keywordService.getKeywordById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/value/{value}")
    public ResponseEntity<Keyword> getKeywordByValue(@PathVariable String value) {
        return keywordService.getKeywordByValue(value)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/search")
    public ResponseEntity<List<Keyword>> searchKeywords(@RequestParam String query) {
        List<Keyword> keywords = keywordService.findKeywordsByValueContaining(query);
        return ResponseEntity.ok(keywords);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Keyword> updateKeyword(@PathVariable Long id, @Valid @RequestBody Keyword keyword) {
        try {
            Keyword updatedKeyword = keywordService.updateKeyword(id, keyword);
            return ResponseEntity.ok(updatedKeyword);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteKeyword(@PathVariable Long id) {
        try {
            keywordService.deleteKeyword(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/count")
    public ResponseEntity<Long> getKeywordCount() {
        long count = keywordService.getKeywordCount();
        return ResponseEntity.ok(count);
    }
}