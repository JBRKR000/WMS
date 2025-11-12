package com.kozimor.wms.Database.Model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.OffsetDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "transactions",
       indexes = {
           @Index(name = "idx_transactions_item", columnList = "item_id"),
           @Index(name = "idx_transactions_user", columnList = "user_id"),
           @Index(name = "idx_transactions_location", columnList = "location_id"),
           @Index(name = "idx_transactions_item_location", columnList = "item_id,location_id")
       })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Transaction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "transaction_id")
    private Long id;

    @CreationTimestamp
    @Column(name = "transaction_date", updatable = false)
    private OffsetDateTime transactionDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "transaction_type", nullable = false, length = 50)
    private TransactionType transactionType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id")
    private Item item;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "location_id")
    private Location location; // LOKACJA gdzie przybyła/wybyła ilość

    @Min(0)
    @Column(name = "quantity", nullable = false)
    private Integer quantity; // ILOŚĆ

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "transaction_status", nullable = true, length = 50)
    private TransactionStatus transactionStatus;

    @Column(name = "description", columnDefinition = "text")
    private String description;

    @OneToMany(mappedBy = "transaction", cascade = CascadeType.REMOVE, fetch = FetchType.LAZY)
    @Builder.Default
    private Set<OrderLine> orderLines = new HashSet<>();
}
