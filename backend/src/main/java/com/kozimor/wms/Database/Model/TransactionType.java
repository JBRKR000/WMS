package com.kozimor.wms.Database.Model;

public enum TransactionType {
    RECEIPT,                // PRZYJĘCIE
    ISSUE_TO_PRODUCTION,    // WYDANIE NA PRODUKCJĘ
    ISSUE_TO_SALES,         // WYDANIE NA SPRZEDAŻ
    ORDER,                  // ZAMÓWIENIE
    RETURN                  // ZWROT
}
