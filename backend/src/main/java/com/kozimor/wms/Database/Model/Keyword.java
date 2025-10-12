package com.kozimor.wms.Database.Model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "keywords",
       uniqueConstraints = @UniqueConstraint(columnNames = "keyword_value"),
       indexes = @Index(name = "idx_keywords_value", columnList = "keyword_value"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Keyword {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "keyword_id")
    private Long id;

    @NotBlank
    @Column(name = "keyword_value", nullable = false, length = 150)
    private String value;
    
    @ManyToMany(mappedBy = "keywords", fetch = FetchType.LAZY)
    @Builder.Default
    private Set<Item> items = new HashSet<>();
}
