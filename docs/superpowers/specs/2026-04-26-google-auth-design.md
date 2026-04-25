# Design: Google-only Authentication

**Date:** 2026-04-26
**Status:** Approved

## Summary

Replace the existing email/password + verification-code auth system with Google OAuth as the sole authentication method. Drop ASP.NET Core Identity entirely. Merge `IdentityUser` and `UserProfile` into a single `User` table. New users pick a username in an onboarding step after their first Google sign-in.

---

## Approach

**Frontend-initiated ID token flow (Option A):**

1. React frontend uses `@react-oauth/google` SDK — Google handles the popup and returns a signed ID token.
2. Frontend sends `{ idToken }` to `POST /api/auth/google`.
3. Backend validates the token with `Google.Apis.Auth`, finds or creates the user, returns a Kino JWT.
4. From that point the session is identical to today (JWT in localStorage, Bearer header on every request).

---

## Data Model

Drop ASP.NET Core Identity and `UserProfile`. Replace both with a single `User` table.

```
User
├── Id           int, PK, auto-increment
├── GoogleId     string, unique, NOT NULL   ← stable lookup key from Google's `sub` claim
├── Email        string, unique, NOT NULL
├── Username     string, unique, NOT NULL   ← URL-safe, chosen at onboarding, used in /u/:username
├── DisplayName  string, NOT NULL           ← shown in UI (feed, profile header); seeded from Google name
├── AvatarUrl    string, NOT NULL           ← defaults to "https://placehold.co/400"
├── Bio          string, NOT NULL           ← defaults to "No bio yet."
├── DateJoined   DateTime, NOT NULL
└── TopMovies    → navigation to UserTopMovie[]

UserTopMovie
├── Id           int, PK, auto-increment
├── UserId       int, FK → User.Id
├── Rank         int, NOT NULL              ← 1–10; unique per user
├── TmdbId       int, NOT NULL
├── Title        string, NOT NULL
└── PosterPath   string, nullable
```

`FavoriteMovie` (single string) is removed. `UserTopMovie` allows up to 10 ranked entries per user. Unique constraint on `(UserId, Rank)` prevents duplicate ranks.

`Review.UserId` and `ReviewLike.UserId` change from `string` to `int`, FK to `User.Id`.

All existing migrations are deleted. A single clean migration is generated from scratch.

---

## Backend Changes

### Removed
- ASP.NET Core Identity NuGet packages (`Microsoft.AspNetCore.Identity.EntityFrameworkCore`, etc.)
- `UserManager`, `SignInManager`, `RoleManager` DI registrations in `Program.cs`
- `IdentityDbContext` base class on `AppDbContext`
- All existing auth endpoints: `POST /register`, `POST /login`, `POST /verify-email`, `POST /resend-verification`
- `EmailService` and `IEmailService` (no longer needed)
- `UserProfileDto`, `RegisterDto`, `LoginDto`, `VerifyEmailDto`, `ResendDto`

### Added

**`Google.Apis.Auth` NuGet package** — for server-side ID token validation.

**`User` entity** — replaces `IdentityUser` + `UserProfile`.

**`TokenService`** — updated to accept `User` instead of `IdentityUser`. Claims unchanged: `sub` = `user.Id`, `unique_name` = `user.Username`, `email` = `user.Email`, `jti` = new GUID.

**Three new endpoints on `AuthController`:**

`POST /api/auth/google`
- Body: `{ idToken: string }`
- Validates ID token with `GoogleJsonWebSignature.ValidateAsync(idToken, new ValidationSettings { Audience = [GOOGLE_CLIENT_ID] })`
- Looks up `User` by `GoogleId` (payload `sub` claim)
- **Returning user:** returns `{ token: string }` (Kino JWT)
- **New user:** returns `{ isNewUser: true, googleId: string, email: string, displayName: string }` — no user is created yet
- Rate-limited ("auth" policy)

`POST /api/auth/complete-profile`
- Body: `{ googleId: string, email: string, displayName: string, username: string }`
- Validates username server-side: regex `^[a-zA-Z0-9_-]{3,20}$`, not already taken
- Creates `User` row with `AvatarUrl = "https://placehold.co/400"`, `Bio = "No bio yet."`, `DateJoined = UtcNow`
- Returns `{ token: string }` (Kino JWT)
- Rate-limited ("auth" policy)

`GET /api/auth/check-username?username=`
- Returns `{ available: bool }`
- Used for live validation during onboarding
- Rate-limited ("auth" policy)

### `Program.cs` changes
- Remove all Identity-related service registrations
- Remove `EmailService` registration
- Add `GOOGLE_CLIENT_ID` config mapping from environment variable
- Keep: JWT auth, rate limiter, CORS, EF Core, `TokenService`

---

## Frontend Changes

### New dependency
`@react-oauth/google`

### New environment variable
`VITE_GOOGLE_CLIENT_ID` in `kino-client/.env`

### `main.tsx`
Wrap `<App />` in `<GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>`.

### `AuthContext.tsx`
Remove all email/password state and functions. New interface:

```ts
interface AuthContextType {
  user: { id: string; username: string; email: string } | null;
  token: string | null;
  pendingGoogle: { googleId: string; email: string; displayName: string } | null;
  loginWithGoogle: (idToken: string) => Promise<void>;
  completeProfile: (username: string) => Promise<void>;
  logout: () => void;
  // existing: openAuthModal, closeAuthModal, isAuthModalOpen
}
```

- `loginWithGoogle` — POSTs to `/api/auth/google`. On `isNewUser: true`, sets `pendingGoogle` state (triggers `UsernameModal`). On JWT response, stores token and decodes user as before.
- `completeProfile` — POSTs to `/api/auth/complete-profile` using data from `pendingGoogle`. On success, clears `pendingGoogle`, stores JWT.
- `logout` — unchanged.

### `AuthModal.tsx`
Remove login/register tabs and all form fields. Replace body with a single `<GoogleLogin>` component:
```tsx
<GoogleLogin
  onSuccess={({ credential }) => loginWithGoogle(credential!)}
  onError={() => console.error('Google login failed')}
  text="continue_with"
  shape="rectangular"
/>
```

### New `UsernameModal.tsx`
Shown when `pendingGoogle !== null` in context. Cannot be dismissed without completing onboarding.

- Username text input (3–20 chars, alphanumeric/underscores/hyphens)
- Debounced availability check (300ms) against `GET /api/auth/check-username`
- Shows "available" / "taken" inline feedback
- Google `displayName` shown as read-only ("Your display name: Drexler Reyes")
- Submit calls `completeProfile(username)` from context
- Rendered at the `App.tsx` level (alongside `AuthModal`), controlled by `pendingGoogle` state

### `Navbar.tsx`
No changes needed — already reads from `AuthContext`.

---

## Auth Flow Summary

```
New user:
  Click "Continue with Google"
    → Google popup
    → POST /api/auth/google  { idToken }
    → { isNewUser: true, googleId, email, displayName }
    → UsernameModal shown
    → User picks username
    → POST /api/auth/complete-profile
    → JWT returned → stored in localStorage → user is logged in

Returning user:
  Click "Continue with Google"
    → Google popup
    → POST /api/auth/google  { idToken }
    → JWT returned → stored in localStorage → user is logged in
```

---

## Environment Variables

**`Kino.Server/.env`** — add:
```
GOOGLE_CLIENT_ID=<OAuth 2.0 Web Client ID from Google Cloud Console>
```

**`kino-client/.env`** — add:
```
VITE_GOOGLE_CLIENT_ID=<same value>
```

**Google Cloud Console (one-time setup):**
- Create OAuth 2.0 Client ID → Web application
- Authorized JavaScript origins: `http://localhost:5173`, `https://<your-vercel-url>`
- No redirect URIs required for the ID token flow

---

## What Is Not Changing

- JWT structure and validation (`TokenService` claims, 7-day expiry, HMAC SHA512)
- `Review`, `ReviewLike`, `Movie` entities (except FK type `string` → `int` on userId fields)
- `MoviesController`, `TmdbController` — no changes
- `ReviewsController` — logic unchanged; `GetUserReviews(string userId)` parameter type changes to `int`
- `UsersController` — logic unchanged; `GetUser(string userId)` parameter type changes to `int`
- Avatar upload endpoint (`POST /api/auth/upload-avatar`)
- Profile update endpoint (`PUT /api/auth/profile`) — `FavoriteMovie` field removed from DTO
- New endpoint: `PUT /api/auth/top-movies` [Authorize] — accepts `{ movies: [{ rank, tmdbId, title, posterPath }] }`, replaces the user's full top movies list (delete all + re-insert). Max 10 entries enforced server-side.
- New endpoint included in `GET /api/auth/profile` response as `topMovies: [{ rank, tmdbId, title, posterPath }]`
- `GET /api/users/{userId}` (public profile) also returns `topMovies`
- Frontend routing, pages, feed, diary, public profiles
- Deployment setup (Docker/Render/Vercel/Neon)
