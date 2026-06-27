# Kendronics Redesign System

This document turns the master redesign prompt into an implementation contract for the web and native app.

## Product Principle

Kendronics must feel calm, technical, reliable, and fast. The interface should prioritize engineering content: PCB files, products, quotes, suppliers, documentation, community posts, and marketplace transactions.

The product should not copy GitHub. It should borrow the discipline: clear hierarchy, few decorative elements, predictable components, excellent contrast, and content-first layouts.

## Visual Identity

Keep:

- Kendronics logo
- Kendronics green as the primary brand color
- Electronics, PCB, manufacturing, and technical collaboration as the visual center

Avoid:

- Heavy shadows
- Decorative gradient blobs
- Overly rounded marketing cards
- Mixed icon styles
- Dense color palettes without semantic purpose

## Tokens

The first production tokens are available in `apps/web/app/globals.css` as `--kd-*`.

Color roles:

- `--kd-green-*`: brand scale
- `--kd-info`: information
- `--kd-success`: success
- `--kd-warning`: warning
- `--kd-danger`: destructive states
- `--kd-bg`: page background
- `--kd-surface`: base surface
- `--kd-surface-muted`: quiet surface
- `--kd-surface-elevated`: elevated surface
- `--kd-border`: component border
- `--kd-divider`: dividers
- `--kd-text`: primary text
- `--kd-text-secondary`: secondary text
- `--kd-muted`: muted metadata
- `--kd-disabled`: disabled state

Radius roles:

- `--kd-radius-1`: 4px
- `--kd-radius-2`: 6px
- `--kd-radius-3`: 8px
- `--kd-radius-4`: 10px
- `--kd-radius-5`: 12px
- `--kd-radius-6`: 16px
- `--kd-radius-7`: 20px
- `--kd-radius-8`: 24px

Shadows:

- `--kd-shadow-sm`
- `--kd-shadow-md`
- `--kd-shadow-lg`

Use shadows only when a component needs true layering, not decoration.

## Typography

Hierarchy:

- H1: product/page identity
- H2: major section
- H3: card/panel title
- Body: default content
- Small: metadata
- Caption: timestamps, helper text
- Overline: restrained uppercase labels
- Monospace: part numbers, file names, references, code

Rules:

- No negative letter spacing.
- Do not scale type with viewport width.
- Long words and labels must wrap safely.
- Dense tools use compact headings, not hero-scale text.

## Components

The first reusable web primitives live in:

`apps/web/components/ui/kendronics-system.tsx`

Available primitives:

- `KButton`
- `KCard`
- `KField`
- `KInput`
- `KTextarea`
- `KBadge`
- `KTabs`
- `KAlert`
- `KSkeleton`
- `KEmptyState`

Next primitives to add:

- Upload
- Search with suggestions
- Select
- Checkbox
- Radio
- Switch
- OTP
- Autocomplete
- Table
- Pagination
- Tooltip
- Popover
- Toast
- Modal
- Drawer
- Bottom Sheet
- Timeline
- Progress
- Navbar
- Bottom Navigation
- FAB

## Page Architecture

Primary navigation:

- Accueil
- Explorer
- Marketplace
- Communaute
- Tutoriels
- Documentation
- Services
- Devis
- Profil
- Messages
- Notifications
- Parametres

The current product still has legacy route names. During migration, keep URLs stable, but align navigation labels and layouts with this architecture.

## Core Page Targets

### Accueil

Purpose: give a fast overview and route users to quote, marketplace, community, documentation, and production tracking.

Required sections:

- Compact header
- Universal search
- User greeting
- Quick actions
- Popular products
- Recent publications
- Services
- Tutorials
- News
- Manufacturers
- Suppliers
- Documentation
- Quote requests

### Explorer / Community

Purpose: the social and technical heart of Kendronics.

Required post card content:

- Avatar
- Name
- Certification badge
- Company / account level
- Date
- Title
- Text
- Images / videos / PDF / code / links
- Tags
- Likes
- Comments
- Shares
- Favorites
- Views

Interaction requirements:

- Comments and replies are real backend data.
- Newly sent comments can be edited for 20 seconds only.
- Media must render from real project assets, not mock data.

### Marketplace

Purpose: premium catalog for products, components, kits, instruments, PCB, PCBA, modules, and machines.

Required:

- Advanced filters
- Comparison
- Availability
- Pricing
- Documentation
- Downloads
- Questions
- Reviews

### Product Detail

Required:

- Large image/gallery
- Zoom
- Price
- Availability
- Reference
- Manufacturer
- Datasheet/downloads
- Description
- Characteristics
- Reviews
- Similar products

### Quote Requests

Required:

- Create request
- File upload
- Pricing
- Status
- Supplier/manufacturer responses
- Messages
- Attachments
- History

### Profile

Required:

- Photo
- Name
- Company
- Profession
- Skills
- Badges
- Portfolio
- Products
- Services
- Posts
- Projects
- Tutorials
- Favorites
- History
- Statistics

## Accessibility

Target WCAG AA.

Requirements:

- Keyboard navigation
- Visible focus states
- ARIA labels where needed
- Sufficient contrast
- Forms with labels and useful error messages
- Reduced visual noise

## Motion

Durations:

- 150ms for hover/focus
- 200ms for small component transitions
- 250ms for drawers/sheets/modals

Avoid excessive animation. Motion should confirm state changes or guide attention.

## Migration Strategy

Phase 1: Foundation

- Add tokens
- Add primitives
- Document system
- Stop creating one-off styles for new work

Phase 2: Core Shell

- Rebuild navbar, bottom navigation, page layout, search, notifications, auth prompts, and profile menu with shared components.

Phase 3: Community / Explorer

- Convert Explorer and project detail to the new community card system.
- Finish comments, replies, media rendering, edit windows, and follow states.

Phase 4: Quote / Orders

- Convert quote flow, upload, pricing summary, cart, order detail, and tracking to shared components.

Phase 5: Marketplace

- Add catalog, product detail, comparison, supplier/manufacturer pages, and reviews.

Phase 6: Profile / Settings

- Rebuild public/private profile, account settings, security, notifications, and portfolio.

Phase 7: Native App Parity

- Port the same tokens and component model to React Native.
- Keep API contracts shared.
- Avoid WebView.

## Engineering Rules

- New UI must use tokens or shared primitives unless there is a strong reason not to.
- Do not add decorative cards inside cards.
- Do not introduce new one-off color systems.
- Prefer semantic components and clear state names.
- Keep URLs and backend contracts stable during visual migration.
- Every production feature must use real backend data.
