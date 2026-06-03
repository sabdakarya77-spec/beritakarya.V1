# BeritaKarya Architecture Documentation

**Tanggal:** 30 Mei 2026  
**Versi:** 1.0

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Multi-Tenant Architecture](#multi-tenant-architecture)
3. [Role-Based Access Control (RBAC)](#role-based-access-control-rbac)
4. [Authentication & Authorization](#authentication--authorization)
5. [API Structure](#api-structure)
6. [Frontend Architecture](#frontend-architecture)
7. [Article Editorial Workflow](#article-editorial-workflow)
8. [Database Schema](#database-schema)
9. [Environment Configuration](#environment-configuration)

---

## Overview

BeritaKarya adalah sistem manajemen konten (CMS) multi-tenant untuk media berita dengan fitur:

- **Multi-Tenant:** Mendukung banyak situs berita (pusat, bandung, surabaya, dll)
- **Role-Based:** Sistem role dan permission yang kompleks
- **Editorial Workflow:** Proses publish artikel dari draft hingga terbit
- **AI Integration:** Tools AI untuk optimize dan validate konten

### Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14 (App Router), React, Zustand, Tiptap |
| Backend | Node.js, Express.js, TypeScript |
| Database | PostgreSQL, Prisma ORM |
| Auth | JWT + Refresh Token (httpOnly cookies) |
| Search | Meilisearch |
| Cache | Redis |
| AI | OpenAI GPT-4 |

---

## Multi-Tenant Architecture

### Site Model

Setiap tenant (situs berita) memiliki:
- **Site ID** - identifier unik (e.g., `pusat`, `bandung`, `surabaya`)
- **Domain** - domain sendiri (e.g., `beritakarya.co`)
- **Branding** - logo, warna, footer, dll
- **Data Isolation** - users, articles, categories terikat ke site

### Site Access Pattern

Site di-identifikasi melalui 3 cara (priority order):

```
1. Cookie: siteId=<site_id>
2. Header: X-Site-ID: <site_id>
3. Query: ?site=<site_id>
```

### Site Middleware (`site.middleware.ts`)

```typescript
// Validasi site ID
const siteId = req.query.site || req.headers['x-site-id']

// Caching: valid site IDs di-cache 5 menit
const validSiteCache = new Set<string>(KNOWN_SITE_IDS)

// Special IDs:
// - 'pusat' = Editor pusat (akses semua site)
// - 'all' = Query all sites
```

### Data Isolation

| Resource | Site Scoped | Notes |
|-----------|-------------|-------|
| Users | ✅ | Terikat ke 1 site (kecuali superadmin) |
| Articles | ✅ | Semua article milik 1 site |
| Categories | ✅ | Bisa global (siteId=null) |
| Media | ✅ | Upload per site |
| Advertisements | ✅ | Slot per site |
| Comments | ✅ | Comment terikat site |
| AI Usage | ✅ | Tracking per site |

---

## Role-Based Access Control (RBAC)

### Roles Overview

| Role | Deskripsi | Site Access | Editorial |
|------|-----------|-------------|-----------|
| `reader` | Pembaca biasa | Public read | - |
| `reporter` | Reporter lapangan | Site sendiri | Draft & submit |
| `kontributor` | Kontributor | Site sendiri | Draft & submit |
| `wapimred` | Merah/Wartawan Editor | Site sendiri | Full editorial |
| `superadmin` | Super Admin | Semua site | Full access |
| `advertiser` | Advertiser | Site sendiri | Ad booking |

### Role Definitions (`schema.prisma`)

```prisma
enum Role {
  reader
  reporter
  kontributor
  wapimred
  superadmin
  advertiser
}
```

### Permission Rules

#### Site Access Restriction (`site.middleware.ts`)

```typescript
// Roles dengan siteId terikat tidak bisa cross-site
if (
  ['reporter', 'kontributor', 'wapimred'].includes(req.user.role) &&
  req.user.siteId !== req.site
) {
  return res.status(403).json({
    error: { code: 'SITE_FORBIDDEN', message: 'Anda hanya bisa mengakses site Anda sendiri' }
  })
}
```

#### Role Middleware (`auth.middleware.ts`)

```typescript
// requireAuth - cek user sudah login
export function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({...})
  next()
}

// requireRole - cek role tertentu
export function requireRole(roles: string[]) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({...})
    }
    next()
  }
}

// requireSuperadmin - khusus superadmin
export function requireSuperadmin(req, res, next) {
  if (req.user.role !== 'superadmin') {
    return res.status(403).json({...})
  }
  next()
}
```

### AI Quota by Role

| Role | Daily Limit | Monthly Budget | Features |
|------|-------------|---------------|----------|
| reporter | 50 | $10 | rewrite, expand, grammar, readability, caption |
| kontributor | 50 | $10 | +seo_audit, +image_caption |
| wapimred | 100 | $50 | All features |
| superadmin | Unlimited | Unlimited | All features |

---

## Authentication & Authorization

### Token Structure (JWTPayload)

```typescript
interface JWTPayload {
  userId: string      // User ID dari database
  role: UserRole      // Salah satu dari 6 roles
  siteId: string | null // Site ID (null = superadmin/pusat)
  iat: number         // Issued at timestamp
  exp: number         // Expiration timestamp
}
```

### Authentication Flow

```
┌──────────┐     POST /auth/login      ┌──────────────┐
│  Client  │ ────────────────────────→ │  Backend API  │
│          │                           │              │
│          │ ←──────────────────────── │  1. Validate │
│          │     Set-Cookie:           │  2. Generate │
│          │     accessToken (JWT)     │     JWT      │
│          │     refreshToken (UUID)   │  3. Store    │
└──────────┘                           │     Refresh  │
                                       └──────────────┘
```

### Token Lifecycle

1. **Login** → Generate accessToken (JWT) + refreshToken (UUID)
2. **Access Token** → 1 hour validity (configurable)
3. **Refresh Token** → 7 days validity, stored in database
4. **Refresh Token Rotation** → Old token di-blacklist, generate new pair

### Token Storage

- **Access Token:** JWT, di-set sebagai httpOnly cookie
- **Refresh Token:** UUID, stored in `RefreshToken` table + httpOnly cookie
- **Tokens tidak di localStorage** (aman dari XSS)

### Middleware Chain

```
Request → helmet (security headers) 
       → cors (cross-origin)
       → cookieParser
       → jwtVerify (OPTIONAL - set req.user jika ada token)
       → [route handlers]
       → requireAuth (REQUIRED - cek login)
       → requireRole (REQUIRED - cek permission)
       → siteMiddleware (REQUIRED - validasi site)
       → requireSiteAccess (REQUIRED - cek site access)
```

### CSRF Protection & Cookie Security

Untuk keamanan terhadap serangan CSRF (Cross-Site Request Forgery), sistem mengandalkan kebijakan cookie modern **SameSite: 'lax'**:

- **SameSite: 'lax'**: Pada lingkungan produksi dan pengembangan, cookie autentikasi (`accessToken` & `refreshToken`) selalu disetel dengan atribut `sameSite: 'lax'`.
- Atribut ini mencegah browser mengirimkan cookie autentikasi pada sub-request lintas-situs (*cross-site mutations* seperti POST/PUT/DELETE dari domain luar).
- Dengan kebijakan ini, sistem aman dari ancaman CSRF secara default melalui perlindungan bawaan browser tanpa memerlukan overhead token CSRF tambahan.

---

## API Structure

### Base URL Structure

```
/api/v1/
├── /auth/          # Authentication
│   ├── POST /login
│   ├── POST /register
│   ├── POST /refresh
│   ├── POST /logout
│   └── GET  /me
├── /users/         # User management
├── /articles/      # Article CRUD
├── /categories/    # Category management
├── /sites/          # Site management
├── /media/          # Media upload
├── /ai/             # AI features
├── /ads/            # Advertisements
├── /newsletter/     # Newsletter
├── /comments/       # Comments
├── /kyc/            # KYC verification
├── /analytics/      # Analytics
├── /audit/          # Audit logs
└── /admin/          # Admin routes
```

### Middleware Application

```typescript
// Contoh route dengan full middleware chain
app.post('/api/v1/articles',
  requireAuth,           // 1. Wajib login
  siteMiddleware,        // 2. Wajib site ID
  requireSiteAccess,     // 3. Cek akses site
  asyncHandler(articleController.create)
)
```

### Rate Limiting

| Endpoint | Rate | Window |
|----------|------|--------|
| `/api/v1/auth/*` | 10 requests | per minute |
| `/api/v1/*` (other) | 100 requests | per minute |

---

## Frontend Architecture

### State Management (Zustand)

```typescript
// authStore.ts - Auth state
interface AuthState {
  user: AuthUser | null
  isLoading: boolean
  login: (email, password) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
}
```

### API Client (Axios)

```typescript
// apps/web/lib/api.ts
export const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  withCredentials: true  // Send cookies
})
```

### API Interceptors

1. **Request Interceptor:**
   - Inject `X-Site-ID` header dari cookie

2. **Response Interceptor:**
   - Handle 401 → Auto refresh token
   - Retry limit: 3 attempts max

### Auth Initialization

```typescript
// AuthInit.tsx - Initial auth check + heartbeat
useEffect(() => {
  checkAuth()  // Cek session saat mount
}, [])

useEffect(() => {
  const interval = setInterval(sendHeartbeat, 30000)  // Heartbeat 30 detik
  return () => clearInterval(interval)
}, [user])
```

---

## Article Editorial Workflow

### Status Flow

```
                    ┌─────────────┐
                    │   draft     │ ← Reporter/Kontributor buat
                    └──────┬──────┘
                           │ submit()
                           ▼
                    ┌─────────────┐
                    │  submitted  │ → Notifikasi ke wapimred dan superadmin
                    └──────┬──────┘
                           │ review()
                           ▼
                    ┌─────────────┐
              ┌─────│   review    │─────┐
              │     └─────────────┘     │
              │                         │
          revision()              approve()
              │                         │
              ▼                         ▼
      ┌─────────────┐           ┌─────────────┐
      │  revision   │           │  approved   │
      └──────┬──────┘           └──────┬──────┘
             │                         │
             │ submit()                 │ publish() / schedule()
             ▼                         ▼
      ┌─────────────┐           ┌─────────────┐
      │  submitted   │           │ published   │
      └─────────────┘           └─────────────┘
```

### Article Statuses

| Status | Deskripsi | Allowed Transitions |
|--------|-----------|-------------------|
| `draft` | Artikel belum submit | → submitted |
| `submitted` | Menunggu review | → review, rejected |
| `review` | Sedang direview editor | → revision, approved, rejected |
| `revision` | Butuh revisi | → submitted |
| `approved` | Sudah disetujui | → published, scheduled |
| `scheduled` | Ditunda terbit | → published |
| `published` | Sudah terbit | → archived |
| `archived` | Diarsipkan | - |
| `rejected` | Ditolak editor | - |

### Article Flags

```typescript
interface ArticleFlags {
  isBreaking: boolean   // Berita terkini/urgent
  isExclusive: boolean  // Berita eksklusif
  isFeatured: boolean  // Tampilkan di homepage
}
```

---

## Database Schema

### Core Models

```
Site (1) ──── (N) User
  │                  │
  │                  │
  └─── (N) Article ──┘
          │
          ├── (N) Comment
          ├── (N) PageView
          └── (1) Category
```

### Key Tables

| Table | Purpose |
|-------|---------|
| `Site` | Multi-tenant container |
| `User` | Users dengan role & KYC |
| `Article` | Artikel dengan metadata & versions |
| `Category` | Kategori (bisa global atau site-specific) |
| `RefreshToken` | Valid refresh tokens |
| `BlacklistedToken` | Invalidated tokens |
| `AIUsage` | Tracking AI quota usage |
| `AuditLog` | Semua aksi redaksi |
| `Invitation` | Invite user dengan predefined role |

### Indexes

```prisma
// Optimized indexes untuk common queries
@@index([siteId, status])
@@index([authorId])
@@index([scheduledAt])
@@index([publishedAt, viewCount])

// User queries
@@index([siteId, isVerified, kycSubmittedAt])
@@index([kycStatus])
@@index([deletedAt])
```

---

## Environment Configuration

### Environment Files

| File | Environment | Purpose |
|------|-------------|---------|
| `apps/api/.env` | Local Dev | Development overrides |
| `apps/web/.env` | Local Dev | Frontend config |
| `infra/docker/.env` | Production | Docker deployment |
| `.env.production.example` | Production | Vercel deployment |

### Key Variables

```bash
# JWT Configuration
JWT_SECRET=<64-char-random-string>
JWT_ACCESS_EXPIRES=1h  # Access token lifetime

# Cookie Configuration
COOKIE_DOMAIN=.beritakarya.co  # For subdomain sharing

# CORS
CORS_ORIGIN=https://beritakarya.co,https://www.beritakarya.co
```

### Production vs Development

| Setting | Development | Production |
|---------|-------------|------------|
| NODE_ENV | development | production |
| API_URL | localhost:3001 | api.beritakarya.co |
| JWT Access | 1h | 1h |
| Cookie Domain | (empty) | .beritakarya.co |
| CORS | localhost:3000 | beritakarya.co |

---

## Security Best Practices

### Implemented

1. **HttpOnly Cookies** - Tokens tidak accessible via JavaScript
2. **CSRF Mitigation** - Cookie-level security (SameSite: 'lax')
3. **Refresh Token Rotation** - Old tokens di-blacklist
4. **Rate Limiting** - Prevent brute force
5. **Input Sanitization** - Prevent XSS
6. **Security Headers** - helmet middleware
7. **Trust Proxy** - Untuk Nginx/Load Balancer

### Data Isolation

- Site-scoped queries di semua endpoint
- Site middleware validation
- requireSiteAccess untuk role-restricted routes

---

## Troubleshooting

### Common Issues

#### 401 Unauthorized
- Token expired → Auto refresh atau login ulang
- Token invalid → Clear cookies, login ulang


#### SITE_FORBIDDEN
- User tidak punya akses ke site tersebut
- Reporter/Kontributor/Wapimred hanya bisa akses site mereka sendiri

---

**Document by:** Cline AI Assistant  
**Last Updated:** 30 Mei 2026