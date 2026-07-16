
# Phase 6 — Experience Expansion, Admin & Polish

A comprehensive round covering: theme correctness, landing page expansion with real imagery, dashboard redesign with a sidebar shell, a new Admin panel with full CRUD, live chat, motion polish, and cleanup of the hero.

## 1. Theme system fixes (light/dark parity)

- Audit every route and component for hard-coded palette classes (`bg-navy-deep`, `text-cream`, `bg-white`, `text-black`) that don't flip in dark mode. Replace with semantic tokens (`bg-background`, `bg-card`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-primary`, etc.).
- Priority files: `SiteHeader`, `SiteFooter`, `MobileTabBar`, `PageHero`, homepage sections, tracking pages, dashboard sub-routes, auth pages, `CommandPalette`.
- Ensure `useTheme` applies the `.dark` class on `<html>` and that the initial theme is set before hydration (avoid flash) by injecting a small no-flash script in `__root.tsx` head.
- Verify Leaflet map, charts, and shadcn overrides in both themes.
- Add a visible theme toggle (light / dark / system) in the header user menu and in the new sidebar footer.

## 2. Homepage hero + landing expansion

- Remove the "New — AI delivery predictions" pill from the homepage hero.
- Add a real hero background image (generated via imagegen, logistics/aerial cargo theme, saved to `src/assets/hero-bg.jpg`) with a navy gradient overlay preserving text contrast in both themes.
- Expand landing content with new sections:
  - **Featured services grid** — expand from current set to 8 cards (Express Overnight, International Priority, Freight & LTL, Same-Day, Cold Chain, White-Glove, E-commerce Fulfillment, Returns). Each card gets a generated illustration/photo, hover motion, and a "Learn more" link.
  - **Industries we serve** — 6 industry tiles (Healthcare, Retail, Manufacturing, Automotive, Aerospace, Tech).
  - **How it works** — 4-step animated flow (Quote → Book → Ship → Track).
  - **Live network stats** — animated counters for parcels/day, countries, warehouses, on-time %.
  - **Testimonials carousel** — 3–5 customer quotes with logos.
  - **Trust & compliance strip** — ISO/IATA/C-TPAT/GDP badges.
  - **CTA band** — "Get a quote" + "Talk to sales".
- Each section wrapped in `ScrollReveal` with staggered motion.

## 3. Motion & transitions

- Introduce a shared `motion` preset file (`src/lib/motion.ts`) with `fadeInUp`, `stagger`, `hoverLift`, `tapScale` variants.
- Apply hover-lift and tap-scale to all cards (services, industries, dashboard KPIs, invoice rows).
- Smooth route transitions already exist in `__root.tsx`; extend with skeleton loaders on dashboard queries.
- Respect `prefers-reduced-motion` (already in styles.css).

## 4. Dashboard redesign with sidebar shell

- Replace the current in-page sidebar in `src/routes/dashboard.tsx` with the shadcn `Sidebar` component (`SidebarProvider`, `Sidebar`, `SidebarInset`, `SidebarTrigger`) using `collapsible="icon"`.
- Nav items: Overview, Shipments, Address Book, Invoices, Notifications, Settings, and (for admin users) Admin.
- Sidebar footer: user card with avatar/initials, theme toggle, sign-out.
- Redesign each dashboard sub-page with a consistent page header (`h1`, description, action button), KPI row, and card grid.
- Add a `Settings` sub-route (`dashboard.settings.tsx`) for display name, theme preference, notification preferences, and password change.
- Use `w-[var(--sidebar-width)]` syntax per Tailwind v4 fix.

## 5. Admin panel with full CRUD

- Add `app_role` enum + `user_roles` table via migration with `has_role(uuid, app_role)` SECURITY DEFINER function (per user-roles rules). GRANT SELECT to authenticated, ALL to service_role. RLS: users can read their own roles; only admins (via `has_role`) can write.
- Add server functions in `src/lib/admin.functions.ts` guarded by `requireSupabaseAuth` + `has_role(_, 'admin')` check. All privileged reads/writes via `supabaseAdmin` loaded inside handler.
  - Users: list/search, promote/demote role, deactivate.
  - Shipments: list all, edit status, add event, delete.
  - Pickups: list all, update status, reassign slot.
  - Invoices: list all, mark paid/overdue, void.
  - Notifications: broadcast to a user or all users.
  - Addresses: read-only inspection.
  - Analytics: totals per table.
- New routes under `src/routes/admin.*.tsx` gated by `beforeLoad` that verifies the caller is admin (redirect to `/dashboard` otherwise):
  - `/admin` — dashboard with counts and recent activity.
  - `/admin/users` — table with search, role management, drawer for detail.
  - `/admin/shipments` — table with filters, inline edit dialog.
  - `/admin/pickups` — daily view with slot heatmap.
  - `/admin/invoices` — table with status filter, mark-paid action.
  - `/admin/notifications` — broadcast composer.
- Sidebar shows "Admin" link only if `has_role` returns true (query on mount).
- Provide a one-off seed step (documented) for the first admin: run an `insert` on `user_roles` for the current user.

## 6. Live chat

- Build an in-app widget: floating bottom-right button that opens a chat panel (`src/components/chat/ChatWidget.tsx`) mounted in `__root.tsx`.
- Backend: `chat_conversations` + `chat_messages` tables (RLS: user reads/writes own; admins read/write all). GRANTs included.
- Realtime: enable `supabase_realtime` publication on `chat_messages`; subscribe per conversation.
- Guest mode: unauthenticated visitors get an ephemeral conversation stored in localStorage until they sign in (then optionally merged); for scope simplicity, require sign-in to chat and show a "Sign in to chat with support" state for guests.
- Admins get an `/admin/chat` inbox listing conversations with unread counts and a two-pane reader.
- Auto-reply seed message from "SwiftArc Support" on first user message.

## 7. Housekeeping

- Delete or refactor legacy sidebar markup in dashboard.
- Update `SiteHeader` account menu to link to `/dashboard` and `/admin` (conditional).
- Run typecheck; fix any errors introduced by refactor.
- Verify build passes and preview renders in both themes.

## Technical notes

- Images: use `imagegen--generate_image` (standard quality) for hero (1920x1080 jpg), service card thumbnails (768x512 jpg × 8), industry tiles (512x512 jpg × 6). Store under `src/assets/` and reference via ES6 import.
- Motion: keep durations 150–400ms; use `ease-out`.
- All new tables follow the four-step migration structure (CREATE → GRANT → ENABLE RLS → POLICY) with `service_role` grants for admin edge paths.
- Admin server functions authorize via `has_role` before any privileged read/write; never a bare `createServerFn` for admin work.
- Chat realtime channel is torn down on unmount in `useEffect` per realtime rules.
- Sidebar uses `w-[var(--sidebar-width)]` explicit syntax.

## Out of scope for this round

- Payment processing / Stripe.
- Email delivery for notifications (kept in-app only).
- Voice/video in chat.
- Multi-language i18n.
