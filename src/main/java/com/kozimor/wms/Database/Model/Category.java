package com.kozimor.wms.Database.Model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Entity
@Table(name = "categories",
       uniqueConstraints = @UniqueConstraint(columnNames = "category_name"),
       indexes = @Index(name = "idx_categories_name", columnList = "category_name"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Category {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "category_id")
    private Long id;

    @NotBlank
    @Column(name = "category_name", nullable = false, length = 150)
    private String name;

    @Column(name = "category_description", columnDefinition = "text")
    private String description;
}
