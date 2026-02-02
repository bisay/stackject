# Stackject - AI Coding Agent Instructions

## Architecture Overview

Stackject is a **monorepo** with three Next.js/NestJS applications:

| App | Port | Purpose |
|-----|------|---------|
| `backend/` | 3001 | NestJS API + Prisma ORM (PostgreSQL) |
| `frontend/` | 3000 | Next.js 14 public-facing app |
| `admin/` | 3002 | Next.js 14 admin dashboard |

**Data Flow:** Frontend/Admin → Axios (`lib/api.ts`) → NestJS Controllers → Services → Prisma → PostgreSQL

## Development Commands

```bash
# 1. Backend Setup (from /backend)
npm install                # Install dependencies
npx prisma generate        # Generate Prisma client
npx prisma migrate dev     # Apply DB migrations
npm run start:dev          # Dev server with hot reload (port 3001)

# 2. Frontend (from /frontend) 
npm install                # Install dependencies
npm run dev                # Next.js dev server (port 3000)

# 3. Admin (from /admin)
npm install                # Install dependencies  
npm run dev                # Next.js dev server (port 3002)

# Database commands (from /backend)
npx prisma studio          # Open Prisma Studio GUI
npx prisma db push         # Push schema changes without migration
```

## Key Patterns & Conventions

### Backend (NestJS)

- **Module structure:** Each feature in `src/modules/{feature}/` contains:
  - `{feature}.module.ts`, `controllers/`, `services/`, `dto/`
- **Auth:** JWT via HttpOnly cookies (`Authentication` cookie), extracted in [jwt.strategy.ts](backend/src/modules/auth/strategies/jwt.strategy.ts)
- **Validation:** Use `ZodValidationPipe` with Zod schemas (see [zod-validation.pipe.ts](backend/src/common/pipes/zod-validation.pipe.ts))
- **Guards:** Apply `@UseGuards(JwtAuthGuard)` for protected routes
- **File uploads:** Use `@UseInterceptors(FileInterceptor(...))` with `diskStorage`, files go to `uploads/`

### Frontend (Next.js 14)

- **App Router:** All pages in `app/` directory, dynamic routes use `[param]` folders
- **Styling:** CSS variables in `globals.css`, NO external CSS framework. Use `style={{}}` inline or `<style jsx>` for component styles
- **Glass morphism:** Use classes `glass-card`, `nav-glass`, `btn-primary` for consistent UI
- **Theming:** `data-theme="dark|light"` attribute on `<html>`, managed by `ThemeContext`
- **Auth state:** Access via `useAuth()` hook from `context/auth-context.tsx`
- **API calls:** Always use `api` from `lib/api.ts` (pre-configured Axios with credentials)

### Routing Conventions

- User profiles: `/c/[username]`
- Project detail: `/c/[username]/project/[slug]`
- Projects owned by user have unique constraint on `(ownerId, slug)`

### Database (Prisma)

- Schema in [backend/prisma/schema.prisma](backend/prisma/schema.prisma)
- UUIDs for all IDs
- Key models: `User`, `Project`, `FileNode` (virtual file system), `Discussion`, `Comment`, `Message`
- Relations use `@@map("table_name")` for snake_case table names

## Component Patterns

```tsx
// Standard page component structure
"use client";
import { useAuth } from '@/context/auth-context';
import api from '@/lib/api';

export default function PageName() {
    const { user, loading } = useAuth();
    // Redirect if not authenticated
    useEffect(() => {
        if (!loading && !user) router.push('/login');
    }, [user, loading]);
}
```

## File Upload Pattern

Backend handles multipart via Multer. Frontend uses `react-dropzone`:
```tsx
const form = new FormData();
form.append('file', file);
form.append('filePath', relativePath);
await api.post(`/files/projects/${projectId}/upload`, form);
```

## Environment Variables

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing key (fallback exists for dev)
- `NEXT_PUBLIC_API_URL` - Backend URL (default: `http://localhost:3001`)
- `FRONTEND_URL` - For CORS (default: `http://localhost:3000`)

## Important Notes

- Static files served from `backend/uploads/` at `/uploads/*`
- Rich text editor uses TipTap (`@tiptap/react`)
- Icons from `lucide-react`
- Toasts via `sonner` library (`<Toaster />` in providers)
Jangan sesekali menghapus kodingan yang tidak seharusnya di hapus


