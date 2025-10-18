<!-- markdownlint-disable -->
# 📊 Pełny Przepływ Autentykacji - WMS

## 🔐 CZĘŚĆ 1: LOGOWANIE

```
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND: User wpisuje credentials                          │
└─────────────────────────────────────────────────────────────┘
   ↓
   authService.login({ username, password })
   ↓
   POST /api/auth/login { username, password }
   ↓
┌─────────────────────────────────────────────────────────────┐
│ BACKEND: AuthController.login()                             │
├─────────────────────────────────────────────────────────────┤
│ 1. authenticationManager.authenticate()                     │
│    └─ Sprawdza username w UserRepository                    │
│    └─ Porównuje password (passwordEncoder)                  │
│    └─ Jeśli OK → vraca Authentication object z rolami      │
│    └─ Jeśli błąd → AuthenticationException                  │
│                                                              │
│ 2. jwtService.generateToken(authentication)                │
│    └─ Tworzysz ACCESS TOKEN                                 │
│    └─ Zawiera: { sub: username, roles, tokenType: "access" }
│    └─ Wygasa za: 15 minut (jwt.expiration-ms)              │
│                                                              │
│ 3. jwtService.generateRefreshToken(authentication)         │
│    └─ Tworzysz REFRESH TOKEN                                │
│    └─ Zawiera: { sub: username, tokenType: "refresh" }     │
│    └─ Wygasa za: 7 dni (jwt.refresh-expiration-ms)         │
│                                                              │
│ 4. return LoginResponse {                                   │
│     token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ...",      │
│     refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ...",
│     expiresInMs: 900000,      (15 minut)                    │
│     refreshExpiresInMs: 604800000  (7 dni)                 │
│    }                                                         │
└─────────────────────────────────────────────────────────────┘
   ↓
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND: authService.login() zwraca                        │
└─────────────────────────────────────────────────────────────┘
   ↓
   localStorage.setItem('authToken', response.token)
   localStorage.setItem('refreshToken', response.refreshToken)
   localStorage.setItem('tokenExpiry', Date.now() + 900000)
   localStorage.setItem('refreshTokenExpiry', Date.now() + 604800000)
   ↓
   AuthContext: setIsAuthenticated(true)
   ↓
   ✅ USER ZALOGOWANY
```

---

## 🌐 CZĘŚĆ 2: ZWYKŁY REQUEST (Access Token Ważny)

```
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND: User klika "Pobierz produkty"                    │
└─────────────────────────────────────────────────────────────┘
   ↓
   fetchApi('/api/items', { method: 'GET' })
   ↓
┌─────────────────────────────────────────────────────────────┐
│ INTERCEPTOR WARSTWA 1: PROACTIVE REFRESH                   │
├─────────────────────────────────────────────────────────────┤
│ authService.isTokenExpiringSoon() {                         │
│   const expiry = localStorage.getItem('tokenExpiry')        │
│   const now = Date.now()                                    │
│   const timeLeft = expiry - now                             │
│                                                              │
│   if (timeLeft < 60000) {  // < 1 minuta                    │
│     return true                                             │
│   }                                                          │
│   return false                                              │
│ }                                                            │
│                                                              │
│ ✅ W naszym przypadku: false (token jeszcze ważny)         │
└─────────────────────────────────────────────────────────────┘
   ↓ (token OK, idę dalej)
   ↓
┌─────────────────────────────────────────────────────────────┐
│ INTERCEPTOR WARSTWA 2: GET TOKEN                            │
├─────────────────────────────────────────────────────────────┤
│ authService.getToken() {                                    │
│   const token = localStorage.getItem('authToken')           │
│   const expiry = localStorage.getItem('tokenExpiry')        │
│                                                              │
│   if (token && expiry && Date.now() < expiry) {             │
│     return token  // ✅ Token WAŻNY                          │
│   }                                                          │
│   return null                                               │
│ }                                                            │
│                                                              │
│ ✅ Zwraca: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ..."        │
└─────────────────────────────────────────────────────────────┘
   ↓
   Header Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ...
   ↓
   POST /api/items
   ├─ Authorization: Bearer {accessToken}
   └─ Body: { ... }
   ↓
┌─────────────────────────────────────────────────────────────┐
│ BACKEND: SecurityConfig - JwtAuthenticationFilter          │
├─────────────────────────────────────────────────────────────┤
│ 1. Wyodrębni token z headera Authorization                 │
│                                                              │
│ 2. jwtService.validateToken(token) {                        │
│    └─ Sprawdza podpis JWT                                   │
│    └─ Sprawdza wygaśnięcie                                  │
│    └─ ✅ Poprawny!                                           │
│    }                                                         │
│                                                              │
│ 3. String username = jwtService.getUsernameFromToken()     │
│    └─ username = "john_doe"                                │
│                                                              │
│ 4. JwtGrantedAuthoritiesConverter sprawdza rolę            │
│    └─ tokenType == "access"? ✅ TAK                         │
│    └─ Pobiera role z tokena                                 │
│    └─ Tworzy Authentication object                          │
│                                                              │
│ 5. SecurityContext.setAuthentication(auth)                 │
│    └─ User jest AUTHENTICATED ✅                            │
│                                                              │
│ 6. Realizuje request (ItemController.getAllPaginated())    │
│    └─ SELECT * FROM items LIMIT 10 OFFSET 0                │
│    └─ return ResponseEntity.ok(items)                       │
│                                                              │
│ 7. Status 200 OK ✅                                         │
└─────────────────────────────────────────────────────────────┘
   ↓
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND: Response OK                                       │
└─────────────────────────────────────────────────────────────┘
   ↓
   Wyświetl produkty na stronie ✅
```

---

## ⏰ CZĘŚĆ 3: ACCESS TOKEN WYGASA (< 1 MINUTA)

```
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND: User przywraca laptopa po 14 minutach            │
└─────────────────────────────────────────────────────────────┘
   ↓
   User klika "Pobierz zamówienia"
   ↓
   fetchApi('/api/orders', { method: 'GET' })
   ↓
┌─────────────────────────────────────────────────────────────┐
│ INTERCEPTOR WARSTWA 1: PROACTIVE REFRESH                   │
├─────────────────────────────────────────────────────────────┤
│ authService.isTokenExpiringSoon() {                         │
│   const expiry = localStorage.getItem('tokenExpiry')        │
│   const now = Date.now()                                    │
│   const timeLeft = expiry - now                             │
│                                                              │
│   if (timeLeft < 60000) {  // < 1 minuta                    │
│     return true  // ✅ TOKEN BĘDZIE WYGASNIĘTY!             │
│   }                                                          │
│   return false                                              │
│ }                                                            │
│                                                              │
│ ✅ Zwraca: true                                              │
└─────────────────────────────────────────────────────────────┘
   ↓
   Natychmiast odśwież token!
   ↓
   authService.refreshToken()
   ↓
┌─────────────────────────────────────────────────────────────┐
│ REFRESH FLOW                                                │
├─────────────────────────────────────────────────────────────┤
│ 1. isRefreshingToken = true                                 │
│    (Inne requesty będą czekać w refreshQueue)              │
│                                                              │
│ 2. Pobierz refresh token z localStorage                    │
│    └─ refreshToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ..."
│                                                              │
│ 3. Sprawdź czy refresh token jest ważny                     │
│    └─ refreshTokenExpiry = 604800000 (7 dni)              │
│    └─ ✅ WAŻNY                                              │
│                                                              │
│ 4. POST /api/auth/refresh { refreshToken }                │
│                                                              │
│    BACKEND:                                                 │
│    ├─ jwtService.validateRefreshToken(refreshToken)        │
│    │  └─ Sprawdza podpis                                    │
│    │  └─ Sprawdza wygaśnięcie                              │
│    │  └─ ✅ Poprawny!                                       │
│    │                                                         │
│    ├─ String username = jwtService.getUsernameFromToken()  │
│    │  └─ username = "john_doe"                             │
│    │                                                         │
│    ├─ User user = userRepository.findByUsername("john_doe")│
│    │  └─ ✅ Istnieje                                        │
│    │                                                         │
│    ├─ Authentication auth = new UsernamePasswordAuthenticationToken(
│    │    username, null, authorities)                        │
│    │                                                         │
│    ├─ String newToken = jwtService.generateToken(auth)     │
│    │  └─ Nowy ACCESS TOKEN                                 │
│    │  └─ Zawiera: { sub: "john_doe", roles, ... }         │
│    │  └─ Wygasa za: 15 minut (od TERAZ)                   │
│    │                                                         │
│    └─ return RefreshResponse {                              │
│        token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ...",   │
│        expiresInMs: 900000                                  │
│       }                                                      │
│                                                              │
│ 5. FRONTEND: Zapisz nowy token                             │
│    ├─ localStorage.setItem('authToken', newToken)          │
│    ├─ localStorage.setItem('tokenExpiry', Date.now() + 900000)
│    └─ ✅ Stary token USUNIĘTY, nowy token ZAPISANY         │
│                                                              │
│ 6. isRefreshingToken = false                                │
│    Odblokuj refreshQueue - wszystkie czekające requesty    │
│    dostaną nowy token!                                      │
│                                                              │
│ 7. return newToken                                          │
└─────────────────────────────────────────────────────────────┘
   ↓
   Kontynuuj oryginalny request z NOWYM tokenem!
   ↓
   POST /api/orders
   ├─ Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ... (NOWY)
   └─ Body: { ... }
   ↓
   ✅ Response 200 OK
```

---

## 💥 CZĘŚĆ 4: REFRESH TOKEN WYGASŁ (Po 8 dniach)

```
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND: User był offline przez 8 dni                     │
└─────────────────────────────────────────────────────────────┘
   ↓
   User klika "Pobierz raporty"
   ↓
   fetchApi('/api/reports', { method: 'GET' })
   ↓
┌─────────────────────────────────────────────────────────────┐
│ INTERCEPTOR WARSTWA 1: PROACTIVE REFRESH                   │
├─────────────────────────────────────────────────────────────┤
│ isTokenExpiringSoon() → true                                │
│ authService.refreshToken()                                 │
│                                                              │
│ PROBLEM:                                                    │
│ refreshTokenExpiry = Date.now() + 604800000 (7 dni temu)   │
│ refreshTokenExpiry < Date.now() → ❌ WYGASŁ!               │
│                                                              │
│ if (!refreshToken || !refreshExpiry || 
│     Date.now() >= refreshExpiry) {                          │
│   AuthService.logout()  // WYLOGUJ                          │
│   return null                                               │
│ }                                                            │
│                                                              │
│ ❌ Refresh token WYGASŁ                                      │
└─────────────────────────────────────────────────────────────┘
   ↓
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND: authService.logout()                              │
├─────────────────────────────────────────────────────────────┤
│ localStorage.removeItem('authToken')                        │
│ localStorage.removeItem('refreshToken')                     │
│ localStorage.removeItem('tokenExpiry')                      │
│ localStorage.removeItem('refreshTokenExpiry')               │
│                                                              │
│ AuthContext:                                                │
│ ├─ setIsAuthenticated(false)                                │
│ ├─ setUsername(null)                                        │
│ └─ setIsAdmin(false)                                        │
│                                                              │
│ Router.push('/auth')  // Redirect do logowania             │
└─────────────────────────────────────────────────────────────┘
   ↓
   ❌ USER WYLOGOWANY - Musi się zalogować ponownie
```

---

## 🎯 CZĘŚĆ 5: INTERCEPTOR - ERROR 401 (Fallback)

```
┌─────────────────────────────────────────────────────────────┐
│ SCENARIUSZ: Coś poszło nie tak...                          │
│ Token wygasł POMIĘDZY requestami                           │
└─────────────────────────────────────────────────────────────┘
   ↓
   fetchApi('/api/items', { method: 'GET' })
   ↓
   POST /api/items
   ├─ Authorization: Bearer {stary_token}
   └─ Body: { ... }
   ↓
┌─────────────────────────────────────────────────────────────┐
│ BACKEND: Token wygasł                                       │
├─────────────────────────────────────────────────────────────┤
│ JwtAuthenticationFilter:                                    │
│ ├─ jwtService.validateToken(token) → false (wygasł)       │
│ ├─ Nie potrafisz wyodrębnić username                       │
│ └─ throw JwtException                                       │
│                                                              │
│ SecurityConfig catch (JwtException):                        │
│ └─ response.sendError(401, "Unauthorized")                │
│                                                              │
│ ❌ Response 401 Unauthorized                                │
└─────────────────────────────────────────────────────────────┘
   ↓
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND INTERCEPTOR: REACTIVE REFRESH (Fallback)          │
├─────────────────────────────────────────────────────────────┤
│ if (response.status === 401) {                              │
│   // Token wygasł, spróbuj refresh                          │
│   authService.isAuthenticated() {                           │
│     const refreshToken = localStorage.getItem('refreshToken')
│     const refreshExpiry = localStorage.getItem('refreshTokenExpiry')
│                                                              │
│     return refreshToken && 
│            refreshExpiry && 
│            Date.now() < refreshExpiry  // ✅ WAŻNY            │
│   }                                                          │
│                                                              │
│   ✅ Refresh token WAŻNY                                     │
│   → authService.refreshToken()                              │
│   → POST /api/auth/refresh                                 │
│   → Otrzymaj nowy token                                    │
│   → Retry oryginalny request                               │
│   → ✅ OK!                                                  │
└─────────────────────────────────────────────────────────────┘
   ↓
   ✅ Request się powiedzie z nowym tokenem
```

---

## 📋 Podsumowanie: 3 Warstwy Ochrony

| # | Warstwa | Kiedy? | Akcja | Stan |
|---|---------|--------|-------|------|
| 1️⃣ | **PROACTIVE** | PRZED requestem | Jeśli token wygaśnie za < 1 min | Odśwież TERAZ |
| 2️⃣ | **REACTIVE** | Przy 401 | Jeśli access token wygasł | Refresh + Retry |
| 3️⃣ | **LOGOUT** | Refresh wygasł | Jeśli refresh token wygasł | Wyloguj + /auth |

---

## 🚀 Przepływ w Pigułce

```
┌──────────────────┐
│  Login           │
│  ↓               │
│  Access Token ✅  │ (15 minut)
│  Refresh Token ✅ │ (7 dni)
└──────────────────┘
        ↓
┌──────────────────────────────────────────┐
│ Request Loop                             │
│                                          │
│ Proactive Refresh?                       │
│ ├─ Token wygaśnie za < 1 min? → Refresh │
│ └─ Token OK? → Continue                  │
│                                          │
│ Send Request                             │
│ ├─ 200? → Success ✅                     │
│ ├─ 401? → Reactive Refresh               │
│ │   ├─ Refresh token OK? → Refresh + Retry
│ │   └─ Refresh token wygasł? → Logout ❌ │
│ └─ Other? → Error                        │
└──────────────────────────────────────────┘
```

---

## 🏗️ Architektura Systemu

### Backend
- **AuthController**: Login, Logout, Refresh
- **JwtService**: Generowanie i walidacja tokenów
- **SecurityConfig**: Filtrowanie i autoryzacja requestów
- **JwtAuthenticationFilter**: Ekstraktowanie tokena z headera

### Frontend
- **authService.ts**: Login, Logout, Refresh, Token Management
- **api.ts**: Interceptor z 3 warstwami ochrony
- **AuthContext.tsx**: Zarządzanie stanem auth w aplikacji

### Tokeny
- **Access Token**: 15 minut, typ: "access", zawiera role
- **Refresh Token**: 7 dni, typ: "refresh", brak rol

### localStorage
```javascript
{
  'authToken': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ...',
  'refreshToken': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ...',
  'tokenExpiry': 1729252800000,
  'refreshTokenExpiry': 1729857600000
}
```

---

## ✅ Checklist Implementacji

- ✅ Backend: `/api/auth/login` - Generuje access + refresh token
- ✅ Backend: `/api/auth/refresh` - Waliduje refresh token, zwraca nowy access token
- ✅ Backend: `/api/auth/register` - Rejestracja użytkownika
- ✅ Backend: SecurityConfig - Filtrowanie i autoryzacja
- ✅ Frontend: `authService.login()` - Logowanie i zapis tokenów
- ✅ Frontend: `authService.refreshToken()` - Pobieranie nowego access tokena
- ✅ Frontend: `authService.isTokenExpiringSoon()` - Proactive refresh check
- ✅ Frontend: `api.ts` - Interceptor z queue system
- ✅ Frontend: `AuthContext.tsx` - Zarządzanie stanem auth

---

## 🎉 Gotowe do Produkcji

System autentykacji jest **production-ready** z:
- ✅ Wielowarstwową ochroną
- ✅ Automatic token refresh
- ✅ Queue system dla concurrent requests
- ✅ Proactive refresh (aby uniknąć wygaśnięcia)
- ✅ Fallback refresh (jeśli coś poszło nie tak)
- ✅ Proper logout flow
