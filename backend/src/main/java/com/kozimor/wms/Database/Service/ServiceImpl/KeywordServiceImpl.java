package com.kozimor.wms.Database.Service.ServiceImpl;

import com.kozimor.wms.Database.Model.Keyword;
import com.kozimor.wms.Database.Repository.KeywordRepository;
import com.kozimor.wms.Database.Service.KeywordService;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class KeywordServiceImpl implements KeywordService {

    private final KeywordRepository keywordRepository;

    public KeywordServiceImpl(KeywordRepository keywordRepository) {
        this.keywordRepository = keywordRepository;
    }

    @Override
    public Keyword createKeyword(Keyword keyword) {
        return keywordRepository.save(keyword);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Keyword> getAllKeywords() {
        return keywordRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Keyword> getKeywordById(Long id) {
        return keywordRepository.findById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Keyword> getKeywordByValue(String value) {
        return keywordRepository.findByValue(value);
    }

    @Override
    public Keyword updateKeyword(Long id, Keyword keywordDetails) {
        Keyword keyword = keywordRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Keyword not found with id: " + id));

        keyword.setValue(keywordDetails.getValue());

        return keywordRepository.save(keyword);
    }

    @Override
    public void deleteKeyword(Long id) {
        if (!keywordRepository.existsById(id)) {
            throw new EntityNotFoundException("Keyword not found with id: " + id);
        }
        keywordRepository.deleteById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public long getKeywordCount() {
        return keywordRepository.count();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Keyword> findKeywordsByValueContaining(String value) {
        return keywordRepository.findByValueContainingIgnoreCase(value);
    }
}