# 🔍 Wyszukiwanie Wielokryterialne - WMS

## 📌 Przegląd

Endpoint `/api/items/search` umożliwia zaawansowane wyszukiwanie itemów w bazie danych z użyciem wielu kryteriów filtrowania. Wszystkie parametry są **opcjonalne**, co pozwala na elastyczne wyszukiwanie od prostego do zaawansowanego.

---

## 🌐 Endpoint

```http
GET /api/items/search
```

---

## 📋 Query Parameters

| Parametr | Typ | Wymagany | Opis | Przykład |
|----------|-----|----------|------|---------|
| `itemType` | String | ❌ | Typ itemu: `PRODUCT`, `COMPONENT`, `MATERIAL` | `PRODUCT` |
| `categoryId` | Long | ❌ | ID kategorii | `5` |
| `unit` | String | ❌ | Jednostka miary: `PCS`, `KG`, `LITER`, `METER` | `KG` |
| `minQuantity` | Integer | ❌ | Minimalna ilość | `10` |
| `maxQuantity` | Integer | ❌ | Maksymalna ilość | `100` |
| `keywords` | String | ❌ | Słowa kluczowe (jedno lub więcej) | `metal` |
| `page` | Integer | ❌ | Numer strony (default: 0) | `0` |
| `size` | Integer | ❌ | Rozmiar strony (default: 10) | `10` |

---

## 🔥 Przykłady Użycia

### Przykład 1: Produkty KG między 10-100 kg

```http
<!-- markdownlint-disable -->
GET /api/items/search?itemType=PRODUCT&unit=KG&minQuantity=10&maxQuantity=100&page=0&size=10
```

**Response:**
```json
{
  "content": [
    {
      "id": 1,
      "name": "Stal węglowa",
      "description": "Wysokiej jakości stal",
      "categoryName": "Materiały",
      "unit": "KG",
      "currentQuantity": 45,
      "qrCode": "abc123...",
      "itemType": "PRODUCT",
      "createdAt": "2025-10-18 10:30:00",
      "updatedAt": "2025-10-18 12:00:00",
      "keywords": ["metal", "stal"]
    }
  ],
  "totalElements": 1,
  "totalPages": 1,
  "number": 0,
  "size": 10
}
```

### Przykład 2: Komponenty z keywordem "metal" w kategorii 5

```http
GET /api/items/search?itemType=COMPONENT&categoryId=5&keywords=metal&page=0&size=10
```

### Przykład 3: Wszystkie itemy z słowem kluczowym "narzędzie"

```http
GET /api/items/search?keywords=narzędzie&page=0&size=10
```

### Przykład 4: Sztuki z ilością maksymalnie 50

```http
GET /api/items/search?unit=PCS&maxQuantity=50&page=0&size=10
```

### Przykład 5: Litry między 5-20 na drugiej stronie

```http
GET /api/items/search?unit=LITER&minQuantity=5&maxQuantity=20&page=1&size=20
```

### Przykład 6: Wszystkie itemy (bez filtrów)

```http
GET /api/items/search?page=0&size=10
```

---

## 📊 Response Format

### Sukces (200 OK)

```json
{
  "content": [
    {
      "id": 1,
      "name": "Złączka metalowa",
      "description": "Przechylona złączka do rur",
      "categoryName": "Akcesoria",
      "unit": "PCS",
      "currentQuantity": 150,
      "qrCode": "uuid-string",
      "itemType": "COMPONENT",
      "createdAt": "2025-10-01 08:15:30",
      "updatedAt": "2025-10-18 14:45:00",
      "keywords": ["metal", "złączka", "rury"]
    },
    {
      "id": 2,
      "name": "Śruba M12",
      "description": "Śruba nierdzewna M12x60",
      "categoryName": "Akcesoria",
      "unit": "PCS",
      "currentQuantity": 500,
      "qrCode": "uuid-string-2",
      "itemType": "COMPONENT",
      "createdAt": "2025-10-02 09:20:15",
      "updatedAt": "2025-10-18 13:30:00",
      "keywords": ["śruba", "nierdzewna", "hardware"]
    }
  ],
  "pageable": {
    "sort": {
      "empty": false,
      "sorted": true,
      "unsorted": false
    },
    "offset": 0,
    "pageNumber": 0,
    "pageSize": 10,
    "paged": true,
    "unpaged": false
  },
  "totalPages": 3,
  "totalElements": 25,
  "last": false,
  "size": 10,
  "number": 0,
  "sort": {
    "empty": false,
    "sorted": true,
    "unsorted": false
  },
  "numberOfElements": 10,
  "first": true,
  "empty": false
}
```

### Błąd (400 Bad Request)

```json
{
  "timestamp": "2025-10-18T14:30:00.000+00:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Invalid itemType value",
  "path": "/api/items/search"
}
```

---

## 🎯 Logika Filtrowania

### Typ Itemu (itemType)

```
Akceptowane wartości:
- PRODUCT    → Produkt
- COMPONENT  → Komponent
- MATERIAL   → Materiał
- null/empty → Ignoruje filtr (zwraca wszystkie)
```

### Jednostka Miary (unit)

```
Akceptowane wartości:
- PCS    → Sztuki
- KG     → Kilogramy
- LITER  → Litry
- METER  → Metry
- null   → Ignoruje filtr
```

### Ilość (minQuantity / maxQuantity)

```
Jeśli podane:
- minQuantity=10    → currentQuantity >= 10
- maxQuantity=100   → currentQuantity <= 100
- obie              → 10 <= currentQuantity <= 100
```

### Słowa Kluczowe (keywords)

```
Wyszukiwanie case-insensitive:
- keywords=metal     → Szuka itemów z keywordem zawierającym "metal"
- keywords=narzędzie → Szuka itemów z keywordem zawierającym "narzędzie"

Uwaga: Obecnie wspiera jedno słowo kluczowe.
Dla wielu słów użyj wielu requestów lub zmodyfikuj API.
```

### Paginacja (page / size)

```
- page=0, size=10  → Zwróci elementy 1-10
- page=1, size=10  → Zwróci elementy 11-20
- page=2, size=10  → Zwróci elementy 21-30

Defaults:
- page=0 (pierwsza strona)
- size=10 (10 elementów na stronę)
```

---

## 🏗️ Architektura Backend

### ItemRepository

```java
@EntityGraph(attributePaths = {"category", "keywords"})
@Query("SELECT DISTINCT i FROM Item i " +
       "LEFT JOIN i.category c " +
       "LEFT JOIN i.keywords k " +
       "WHERE (:itemType IS NULL OR i.type = :itemType) " +
       "AND (:categoryId IS NULL OR c.id = :categoryId) " +
       "AND (:unit IS NULL OR i.unit = :unit) " +
       "AND (:minQuantity IS NULL OR i.currentQuantity >= :minQuantity) " +
       "AND (:maxQuantity IS NULL OR i.currentQuantity <= :maxQuantity) " +
       "AND (:keywordValue IS NULL OR LOWER(k.value) LIKE LOWER(CONCAT('%', :keywordValue, '%'))) " +
       "ORDER BY i.id DESC")
Page<Item> searchItems(
    @Param("itemType") ItemType itemType,
    @Param("categoryId") Long categoryId,
    @Param("unit") String unit,
    @Param("minQuantity") Integer minQuantity,
    @Param("maxQuantity") Integer maxQuantity,
    @Param("keywordValue") String keywordValue,
    Pageable pageable
);
```

**Kluczowe cechy:**
- ✅ `DISTINCT` aby uniknąć duplikatów (LEFT JOIN keywords)
- ✅ `@EntityGraph` dla eager loading kategorii i słów kluczowych
- ✅ Nullable parameters - jeśli null, filtr jest ignorowany
- ✅ Case-insensitive LIKE dla keywords
- ✅ `ORDER BY i.id DESC` - najnowsze najpierw

### ItemService

```java
Page<ItemDTO> searchItems(
    String itemType,
    Long categoryId,
    String unit,
    Integer minQuantity,
    Integer maxQuantity,
    String keywords,
    int page,
    int size
);
```

**Logika:**
1. Konwertuje `itemType` string na `ItemType` enum
2. Waliduje typ - jeśli invalid, ustawia na null
3. Wywołuje repository query
4. Konwertuje `Item` → `ItemDTO`

### ItemController

```java
@GetMapping("/search")
public ResponseEntity<Page<ItemDTO>> searchItems(
    @RequestParam(required = false) String itemType,
    @RequestParam(required = false) Long categoryId,
    @RequestParam(required = false) String unit,
    @RequestParam(required = false) Integer minQuantity,
    @RequestParam(required = false) Integer maxQuantity,
    @RequestParam(required = false) String keywords,
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "10") int size
)
```

**Route:** `GET /api/items/search?...`

---

## 🖥️ Frontend Integration

### Fetch API Call

```typescript
const searchItems = async (filters: {
  itemType?: string
  categoryId?: number
  unit?: string
  minQuantity?: number
  maxQuantity?: number
  keywords?: string
  page?: number
  size?: number
}) => {
  const params = new URLSearchParams()
  
  if (filters.itemType) params.append('itemType', filters.itemType)
  if (filters.categoryId) params.append('categoryId', String(filters.categoryId))
  if (filters.unit) params.append('unit', filters.unit)
  if (filters.minQuantity) params.append('minQuantity', String(filters.minQuantity))
  if (filters.maxQuantity) params.append('maxQuantity', String(filters.maxQuantity))
  if (filters.keywords) params.append('keywords', filters.keywords)
  if (filters.page !== undefined) params.append('page', String(filters.page))
  if (filters.size !== undefined) params.append('size', String(filters.size))
  
  const response = await fetchApi<Page<ItemDTO>>(`/items/search?${params.toString()}`)
  return response
}
```

### Użycie w Komponencie (Search/index.tsx)

```typescript
const handleSearch = async () => {
  const results = await searchItems({
    itemType: undefined,  // Wszystkie typy
    categoryId: category ? Number(category) : undefined,
    unit: unit || undefined,
    minQuantity: minQty ? Number(minQty) : undefined,
    maxQuantity: maxQty ? Number(maxQty) : undefined,
    keywords: keywords || undefined,
    page: 0,
    size: 10
  })
  
  setResults(results.content)
}
```

---

## ⚙️ Domyślne Wartości

| Parametr | Default | Opis |
|----------|---------|------|
| `page` | `0` | Pierwsza strona |
| `size` | `10` | 10 elementów na stronę |
| `itemType` | `null` | Wszystkie typy |
| `categoryId` | `null` | Wszystkie kategorie |
| `unit` | `null` | Wszystkie jednostki |
| `minQuantity` | `null` | Bez limitu dolnego |
| `maxQuantity` | `null` | Bez limitu górnego |
| `keywords` | `null` | Bez filtrowania |

---

## 🔒 Bezpieczeństwo

- ✅ Wymaga autentykacji JWT (token w `Authorization` header)
- ✅ Role-based access control (ROLE_USER, ROLE_ADMIN)
- ✅ Parametry walidowane na backendzie
- ✅ SQL injection protection (JPA parametry)
- ✅ Case-insensitive search jest bezpieczny

---

## 📈 Performance

### Indeksy Bazy

Zalecane indeksy dla optymalnej wydajności:

```sql
CREATE INDEX idx_item_type ON items(type);
CREATE INDEX idx_item_category_id ON items(category_id);
CREATE INDEX idx_item_unit ON items(unit);
CREATE INDEX idx_item_quantity ON items(current_quantity);
CREATE INDEX idx_keyword_value ON keywords(value);
CREATE INDEX idx_item_keyword ON item_keywords(item_id, keyword_id);
```

### @EntityGraph

```java
@EntityGraph(attributePaths = {"category", "keywords"})
```

- ✅ Eager loading dla `category` i `keywords`
- ✅ Unika N+1 query problem
- ✅ Jedna query zamiast 1 + N zapytań

---

## 🧪 Testy

### Test 1: Wyszukiwanie po typie

```bash
curl "http://localhost:8080/api/items/search?itemType=PRODUCT&page=0&size=5"
```

### Test 2: Wyszukiwanie po jednostce i ilości

```bash
curl "http://localhost:8080/api/items/search?unit=KG&minQuantity=10&maxQuantity=100&page=0&size=10"
```

### Test 3: Wyszukiwanie po keywords

```bash
curl "http://localhost:8080/api/items/search?keywords=metal&page=0&size=10"
```

### Test 4: Kombinacja filtrów

```bash
curl "http://localhost:8080/api/items/search?itemType=COMPONENT&categoryId=5&unit=PCS&keywords=narzędzie&page=0&size=20"
```

### Test 5: Brak filtrów (wszystko)

```bash
curl "http://localhost:8080/api/items/search?page=0&size=10"
```

---

## 🚀 Przyszłe Rozszerzenia

- [ ] Wyszukiwanie po wielu słowach kluczowych (AND/OR logic)
- [ ] Wyszukiwanie po nazwie/opisie (fulltext search)
- [ ] Sortowanie po różnych polach (name, quantity, date)
- [ ] Filtrowanie po datach (createdAt, updatedAt)
- [ ] Filtry low stock threshold
- [ ] Eksport wyników (CSV, PDF)
- [ ] Saved searches / ulubione wyszukiwania

---

## 📝 Notatki

1. **Wszystkie parametry opcjonalne** - brak żadnego powoduje zwrócenie wszystkich itemów
2. **Case-insensitive** - "METAL", "metal", "Metal" są równoważne
3. **Paginacja obowiązkowa** - zawsze zwraca `Page<ItemDTO>`, nawet jeśli tylko 1 element
4. **DISTINCT query** - unika duplikatów spowodowanych LEFT JOIN keywords
5. **Performance** - dzięki @EntityGraph wszystko ładuje się w jednej query

---

## 📞 Więcej Informacji

- 📄 [API Documentation](./auth.md)
- 🔐 [Authentication Flow](./auth.md)
- 📚 [Database Schema](../backend/README.md)
