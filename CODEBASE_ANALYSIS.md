# BuyPhones / BYU Codebase Analysis Report

## High-level Overview

**BuyPhones / BYU** is a device buyback/e-commerce web service for purchasing Korean-market, SIM-free, unopened electronics. The system supports iPhone 17 series, PlayStation 5, and Nintendo Switch devices.

The project is a **monorepo** with:

- **Backend**: NestJS + TypeScript + MongoDB (RESTful API)
- **Frontend**: React + TypeScript + Vite (SPA with React Router)

The service operates in two modes:

1. **Public UI**: Users can browse device prices and submit buy requests
2. **Admin UI**: Administrators manage buy requests and model prices

---

## Repository Structure

```
byu-temp/
├── backend/              # NestJS backend application
│   ├── src/             # Source code
│   │   ├── auth/        # Email-based authentication (magic link style with codes)
│   │   ├── buy-requests/# Buy request management (CRUD + status workflow)
│   │   ├── model-prices/# Device model pricing management
│   │   ├── users/       # User management
│   │   ├── me/          # User's own requests endpoint
│   │   ├── common/      # Shared guards and utilities
│   │   └── scripts/     # Seed scripts and utilities
│   ├── dist/            # Compiled JavaScript output
│   └── package.json     # Dependencies and scripts
│
├── frontend/            # React frontend application
│   ├── src/
│   │   ├── pages/       # Page components (PublicBuyRequest, AdminDashboard, etc.)
│   │   ├── api/         # API client modules (buyRequests, modelPrices, auth, etc.)
│   │   ├── auth/        # Auth state management (localStorage-based token)
│   │   ├── types/       # TypeScript type definitions
│   │   ├── styles/      # Design system CSS variables
│   │   └── utils/       # Utility functions (adminAuth, etc.)
│   ├── public/          # Static assets (device images, category images)
│   └── package.json     # Dependencies and scripts
│
└── README.md            # Project documentation (Korean)
```

---

## Backend Architecture

### Tech Stack

- **Framework**: NestJS 10.x (Node.js)
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (Passport.js)
- **Validation**: class-validator + class-transformer
- **Language**: TypeScript

### Key Modules

#### 1. **Model Prices Module** (`model-prices/`)

- **Purpose**: Manages device pricing catalog
- **Schema**: `ModelPrice`
  - `category`: "iphone" | "ps5" | "switch"
  - `modelCode`: Internal model identifier
  - `modelName`: Display name
  - `storageGb`: Optional storage capacity
  - `color`: Optional color variant
  - `buyPrice`: Purchase price (KRW)
  - `isActive`: Whether price is currently available
- **Endpoints**:
  - `GET /model-prices` - Public: Get all prices (supports `?activeOnly=true`)
  - `GET /model-prices/:id` - Public: Get single price
  - `POST /model-prices` - Admin: Create price
  - `PATCH /model-prices/:id` - Admin: Update price
  - `DELETE /model-prices/:id` - Admin: Delete price
- **Notable**: Compound unique index on `(modelCode, color)` to support multiple colors per model

#### 2. **Buy Requests Module** (`buy-requests/`)

- **Purpose**: Manages customer buy requests and workflow
- **Schema**: `BuyRequest`
  - Customer info: `customerName`, `customerPhone`, `customerEmail`
  - Device info: `modelPriceId` (reference), `deviceCategory`, `modelCode`, `modelName`, `storageGb`, `color`
  - Pricing: `buyPrice`, `currency`, `finalPrice` (admin-adjusted)
  - Status: `status` ("pending" | "approved" | "rejected" | "completed" | "paid")
  - Device details: `imeiSerial`, `hasReceipt`, `photoUrls` (base64 array)
  - Payment/shipping: `bankName`, `bankAccount`, `bankHolder`, `shippingMethod`, `shippingTrackingCode`, `shippingTrackingUrl`
  - Metadata: `notes`, `adminNotes`, `statusHistory[]`
- **Endpoints**:
  - `POST /buy-requests` - **Public**: Create buy request (no auth required)
  - `GET /buy-requests` - Admin: List all (supports `?status=pending`)
  - `GET /buy-requests/:id` - Admin: Get single request
  - `PATCH /buy-requests/:id` - Admin: Update status/notes/finalPrice
  - `PATCH /buy-requests/:id/mark-paid` - Admin: Mark as paid (requires bank + shipping info)
  - `DELETE /buy-requests/:id` - Admin: Delete request
- **Business Logic**:
  - On creation, fetches `ModelPrice` and copies device details into request (denormalization)
  - Validates that `ModelPrice` exists and is active
  - Status changes are tracked in `statusHistory`
  - `markPaid` enforces: status must be "approved", and both bank info and shipping info must be present

#### 3. **Auth Module** (`auth/`)

- **Purpose**: Email-based authentication with magic code
- **Flow**:
  1. User requests code via `POST /auth/request-code` (email)
  2. Backend generates 6-digit code, hashes it, stores in `LoginCode` collection
  3. Code is logged to console (MVP - should be emailed in production)
  4. User verifies code via `POST /auth/verify-code`
  5. Backend returns JWT token
- **Schema**: `LoginCode` (temporary, expires after 10 minutes)
- **Security**: Codes are hashed with SHA-256 + secret before storage

#### 4. **Users Module** (`users/`)

- **Purpose**: User account management
- **Schema**: `User` (minimal: just `email`, unique index)
- **Service**: Auto-creates users on first login attempt

#### 5. **Me Module** (`me/`)

- **Purpose**: User's own requests management
- **Endpoints**: Allows users to view/update their own requests (by email matching)
- **Validation**: Users can only update requests with status "approved" (for bank/shipping info)

### Public Buy Flow (Backend)

The public buy flow is represented by a single endpoint:

**`POST /buy-requests`** (no authentication required)

- Accepts `CreateBuyRequestDto`:
  - `customerName`, `customerPhone`, `customerEmail` (required)
  - `modelPriceId` (required, must reference active ModelPrice)
  - `notes` (optional)
  - `imeiSerial` (optional, validated on frontend)
  - `hasReceipt` (optional boolean)
  - `photoUrls` (optional string array, base64-encoded images)
- **Validation**:
  - Email format validation
  - ModelPrice must exist and be active
- **Processing**:
  - Fetches ModelPrice and denormalizes device info into BuyRequest
  - Sets initial status to "pending"
  - Creates statusHistory entry

**Note**: No IMEI/serial validation on backend (handled on frontend). No device condition validation (assumes all devices are unopened).

---

## Frontend Architecture

### Tech Stack

- **Framework**: React 18.x + TypeScript
- **Build Tool**: Vite 5.x
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **State Management**: React hooks + localStorage (for auth token)

### Entry Point & Routing

**Entry**: `main.tsx` → wraps app in `BrowserRouter` → renders `App.tsx`

**Routes** (defined in `App.tsx`):

- `/` → `PublicBuyRequest` (device selection page)
- `/sell` → `PublicBuyRequest` (alias)
- `/sell/new` → `PublicBuyRequestForm` (buy request form)
- `/guide` → `GuidePage` (information page)
- `/login` → `LoginPage` (email code authentication)
- `/my-requests` → `MyRequestsPage` (user's request history)
- `/admin` → `AdminLogin` (admin authentication)
- `/admin/dashboard` → `AdminDashboard` (protected, admin-only)

### API Client Structure

**Base Clients**:

- `apiClient` (`api/client.ts`): Public API client (baseURL from env, no auth headers)
- `adminApiClient` (`api/adminClient.ts`): Admin API client (adds JWT token from localStorage)

**API Modules**:

- `api/modelPrices.ts`: Model price operations
- `api/buyRequests.ts`: Buy request operations
- `api/auth.ts`: Authentication operations
- `api/me.ts`: User's own requests operations

### Public Buy Flow (Frontend)

#### Step 1: Device Selection (`/sell` - `PublicBuyRequest.tsx`)

**Purpose**: Multi-step device selection with progressive disclosure

**State Management**:

- `modelPrices`: Fetched from `GET /model-prices?activeOnly=true` on mount
- `selectedCategory`: "iphone" | "ps5" | "switch" | ""
- `selectedModelName`: Display name string
- `selectedStorage`: number | "" (iPhone only)
- `selectedColor`: string | null (if multiple colors available)

**Selection Flow**:

1. **Category Selection**: User selects device category (iPhone/PS5/Switch)
   - Renders category cards with images from `/images/categories/`
   - Resets all dependent selections
2. **Model Selection**: User selects specific model
   - For iPhone: "iPhone 17", "iPhone 17 Plus", "iPhone 17 Pro", "iPhone 17 Pro Max"
   - For PS5: Normalized to "PlayStation 5 Standard", "PlayStation 5 Digital Edition", "PlayStation 5 Slim Standard", "PlayStation 5 Slim Digital Edition"
   - For Switch: Uses full model name from database
   - Resets storage and color
3. **Storage Selection** (iPhone only): User selects storage capacity
   - Extracted from modelPrices matching category + model
   - Resets color
4. **Color Selection** (if multiple colors exist): User selects color
   - Extracted from modelPrices matching category + model + storage
   - Auto-selected if only one option
   - Uses color chips with images from `/images/colors/` or hex swatches

**Model Price Resolution**:

- `selectedModelPrice` is computed via `useMemo`:
  - Matches `modelPrices` array by category, model, storage (if iPhone), and color (if needed)
  - Returns `null` if selection incomplete
- When `selectedModelPrice` exists, displays price block with formatted KRW price

**Navigation to Form**:

- Button "판매 신청 계속하기" / "로그인하고 판매하기" (based on auth status)
- On click (`handleGoToForm`):
  1. Validates `selectedModelPrice` exists
  2. Saves selection to `localStorage` as `"pb-pending-sell"`:
     ```json
     {
       "category": "iphone",
       "modelPriceId": "...",
       "modelName": "iPhone 17",
       "storage": 256,
       "color": "Lavender"
     }
     ```
  3. Checks auth token:
     - If not authenticated → redirects to `/login?redirect=/sell/new`
     - If authenticated → navigates to `/sell/new`

**UI Structure**:

- Hero section (full-width, compact mode)
- Two-column layout (desktop): Step sidebar (left) + Content area (right)
- Step sidebar shows 2 steps: "기기 선택" (active) and "정보 입력"
- Device selection cards in responsive grid (1/2/3 columns based on breakpoint)
- Price block displayed when selection complete

#### Step 2: Buy Request Form (`/sell/new` - `PublicBuyRequestForm.tsx`)

**Purpose**: Collect customer and device information, submit buy request

**State Management**:

- `selectedModelPrice`: Loaded from `modelPrices` using `modelPriceId` from localStorage
- `formData`: `CreateBuyRequestDto` (customer info + modelPriceId)
- `imeiSerial`: Separate state for IMEI/serial validation
- `hasReceipt`: boolean | null (radio selection)
- `devicePhotos`: File[] array
- `isSubmitting`: Loading state

**Initialization**:

1. Loads `modelPrices` from API
2. Reads `"pb-pending-sell"` from localStorage
3. Pre-fills `formData.modelPriceId` and `selectedCategory`
4. Finds matching `ModelPrice` from loaded prices
5. Removes localStorage entry after use
6. Auth check: If no token, redirects to login (with 200ms delay to allow login redirect to complete)

**Form Sections**:

1. **Device Panel** (left column, desktop):

   - Shows device image, model name, storage, color, expected buy price
   - Read-only display of selected device

2. **Customer Information** (right column, desktop):

   - `customerName` (required)
   - `customerPhone` (required)
   - `customerEmail` (required, email type)

3. **Device Information**:

   - **IMEI/Serial Number** (required):
     - iPhone: Must be exactly 15 digits (numeric)
     - PS5/Switch: Minimum 8 characters (alphanumeric)
     - Validated on blur and before submit
   - **Receipt**: Radio buttons (Yes/No)

4. **Product Photos** (full-width, bottom):

   - File input (multiple, accept="image/\*")
   - Minimum 2 photos required
   - Photos converted to base64 data URLs before submission
   - Preview shows file count and names

5. **Notes** (optional):
   - Textarea for additional customer notes

**Form Submission** (`handleSubmit`):

1. Validates IMEI/serial (calls `validateImeiSerial`)
2. Validates photos (minimum 2)
3. Converts photos to base64 (FileReader API)
4. Calls `buyRequestsApi.create()` with:
   - `formData` (customer info + modelPriceId)
   - `imeiSerial`
   - `hasReceipt`
   - `photoUrls` (base64 array)
5. On success: Navigates to `/my-requests`
6. On error: Displays error message

**UI Structure**:

- Same step sidebar layout (step 2 active)
- Two-column layout (desktop):
  - Left: Device panel (gray background)
  - Right: Form fields (white background)
- Bottom section (full-width): Photos, notes, submit button
- Responsive: Stacks to single column on mobile

**Data Flow Between Pages**:

- Device selection → localStorage → Form page reads and clears
- If user navigates directly to form without selection, form still loads (allows manual model selection via future enhancement)

---

## UI & Styling for Public Buy Flow

### Design System

**Base Styles** (`styles/design-system.css`):

- CSS custom properties for colors, spacing, shadows
- Status badge colors (pending, approved, rejected, paid)
- Button styles (primary, outline)
- Card styles with hover effects

**Page-Specific Styles** (`pages/PublicBuyRequest.css`):

- Comprehensive styling for both device selection and form pages
- Uses design system variables where applicable

### Layout Structure

#### Hero Section

- Full-width gradient background (`linear-gradient(135deg, #eff6ff 0%, #ffffff 100%)`)
- Compact mode (`.pb-device-page-compact`): Reduced padding and font sizes
- Contains eyebrow text, title, and body text

#### Step Sidebar

- **Desktop** (≥900px): Vertical sidebar (240px width)
  - Shows step number (circular badge), title, and description
  - Active step highlighted with blue background and border
  - Connector line between steps
- **Mobile** (<900px): Horizontal bar
  - Steps displayed in row
  - Hides descriptions
  - Step numbers and titles only

#### Content Area

- Main content flows in right column (desktop) or full-width (mobile)
- Max-width: 1100px (device page) / 1200px (form page)

### Device Cards

**Category Cards**:

- Grid layout: 1 column (mobile) → 2 columns (≥640px) → 3 columns (≥1024px)
- Card structure:
  - Image wrapper (140px height, contains device category image)
  - Title and subtitle text
- States:
  - Default: Gray border, white background
  - Hover: Blue border, shadow, slight lift
  - Selected: Blue border, light blue background, stronger shadow

**Model Cards**:

- Auto-fit grid (min 140px per card)
- Smaller image wrapper (120px height)
- Same hover/selected states as category cards

### Storage & Color Selection

**Storage Pills**:

- Flex wrap layout
- Pill-shaped buttons with border
- Selected: Green border and background

**Color Chips**:

- Flex wrap, minimum 80px width
- Contains:
  - Color image (56x56px) or hex swatch (fallback)
  - Color label text
- Selected: Green border and shadow

### Price Block

- Centered display with gradient background
- Shows:
  - Label: "매입가" (uppercase, small)
  - Value: Large blue price (2rem font, bold)
  - Details: Model name, storage, color (small gray text)

### Form Layout

**Two-Column Layout** (desktop ≥900px):

- Left column (0.85fr): Device panel (gray background)
  - Device image (4:3 aspect ratio, max 200px height)
  - Device info and price display
- Right column (1.15fr): Form fields (white background, shadow)

**Form Sections**:

- Section titles (1rem, bold)
- Form grid: 1 column (mobile) → 2 columns (≥768px) for name/phone
- Input fields: Standard styling with focus states (blue border + shadow)

**Photo Upload**:

- File input with preview list
- Preview shows count and file names in gray box

**Form Footer**:

- Submit button (full-width on mobile, right-aligned on desktop)
- Error messages displayed above button

### Compact Modes

**`.pb-device-page-compact`**:

- Reduced hero padding (1.5rem vs 2.5rem)
- Smaller hero title (1.5rem vs 2rem)
- Reduced main padding
- Smaller card padding
- Smaller device card images (120px vs 140px)
- Smaller price value (1.75rem vs 2rem)

**`.pb-form-page-compact`**:

- Reduced main padding
- Reduced form panel padding (1.25rem vs 1.5rem)
- Tighter section spacing

### Responsive Behavior

**Breakpoints**:

- Mobile: <640px (single column, full-width buttons)
- Tablet: 640px-899px (2-column grids, horizontal step bar)
- Desktop: ≥900px (sidebar + content, 2-column form layout)
- Large: ≥1024px (3-column device grid)

**Mobile Optimizations**:

- Hero padding reduced
- Cards stack vertically
- Step sidebar becomes horizontal bar
- Form stacks to single column
- Submit button full-width
- Device panel image uses 16:9 aspect ratio

---

## Build, Tooling & Dev Workflow

### Frontend Build

**Package Manager**: pnpm

**Scripts** (`frontend/package.json`):

- `pnpm dev`: Start Vite dev server (port 5173)
- `pnpm build`: TypeScript compile + Vite production build
- `pnpm preview`: Preview production build
- `pnpm lint`: ESLint with TypeScript rules

**Build Tool**: Vite 5.x

- React plugin (`@vitejs/plugin-react`)
- Dev server proxy: `/api` → `http://localhost:3000` (for API calls)
- TypeScript compilation via `tsc` before build

**TypeScript Config**:

- Strict mode enabled
- React JSX support
- Path resolution configured

### Backend Build

**Package Manager**: pnpm

**Scripts** (`backend/package.json`):

- `pnpm start:dev`: NestJS dev mode with watch (uses `nest start --watch`)
- `pnpm start`: Production mode (compiled)
- `pnpm start:prod`: Run compiled output (`node dist/main`)
- `pnpm build`: Compile TypeScript to `dist/`
- `pnpm lint`: ESLint with auto-fix
- `pnpm test`: Jest unit tests
- `pnpm seed:model-prices`: Seed script for model prices
- `pnpm check:env`: Environment variable validation script

**Build Process**:

- TypeScript compilation (tsconfig.json)
- Output to `dist/` directory
- Source maps generated
- Decorator metadata enabled (for NestJS)

**Environment Variables**:

- `MONGODB_URI`: MongoDB connection string (default: `mongodb://localhost:27017/electronics-buy`)
- `PORT`: Server port (default: 3000)
- `FRONTEND_URL`: CORS origin (default: `http://localhost:5173`)
- `CODE_SECRET`: Secret for hashing login codes (default: insecure)
- `JWT_SECRET`: JWT signing secret (required for production)

### Development Workflow

**Typical Setup**:

1. Start MongoDB (local or remote)
2. Backend: `cd backend && pnpm install && pnpm start:dev`
   - Runs on `http://localhost:3000`
   - Auto-reloads on file changes
3. Frontend: `cd frontend && pnpm install && pnpm dev`
   - Runs on `http://localhost:5173`
   - Hot module replacement enabled
   - Proxies `/api/*` to backend

**Database**:

- MongoDB with Mongoose ODM
- Collections: `modelprices`, `buyrequests`, `users`, `logincodes`
- Indexes: User email (unique), ModelPrice (modelCode + color compound unique)

**Testing**:

- Backend: Jest configured (unit tests in `*.spec.ts` files)
- Frontend: No test setup visible (likely not implemented yet)

**Linting**:

- Backend: ESLint + Prettier
- Frontend: ESLint with React hooks rules

**No Docker/Infrastructure Files**:

- No `docker-compose.yml` or `Dockerfile` present
- Deployment configuration not included in repo

---

## Notes / Potential Improvements

### Code Quality & Consistency

1. **TypeScript Strictness**: Backend `tsconfig.json` has `strictNullChecks: false` and `noImplicitAny: false`. Consider enabling strict mode for better type safety.

2. **Error Handling**: Frontend error handling is basic (displays error messages, but no retry logic or detailed error boundaries).

3. **Photo Upload**: Photos are converted to base64 and sent as JSON (10MB limit in backend). This is noted as MVP - should move to multipart/form-data and file storage (S3/disk) in production.

4. **Authentication Flow**: Login codes are logged to console (MVP). Should integrate email service (SendGrid, AWS SES, etc.) for production.

5. **IMEI/Serial Validation**: Validation is frontend-only. Consider adding backend validation for security.

6. **Model Price Matching Logic**: The frontend has complex logic for matching PS5 models (checking for "Slim" and "디지털" strings). This could be fragile if database model names change. Consider using `modelCode` for matching instead.

7. **LocalStorage Usage**: Selection state is stored in localStorage with key `"pb-pending-sell"`. If user clears localStorage or uses different device, selection is lost. Consider URL parameters or session storage as alternative.

8. **CORS Configuration**: Backend CORS is hardcoded to `http://localhost:5173` (with env override). Should support multiple origins in production.

9. **Admin Authentication**: Admin auth uses a separate `adminAuth` utility (not visible in analyzed files). May use different mechanism than user auth (JWT vs token).

10. **Status Workflow**: Buy request status workflow is implicit (pending → approved → paid/completed/rejected). Consider explicit state machine or workflow validation.

11. **Photo Storage**: Base64 photos stored directly in MongoDB document. This will bloat documents. Should use GridFS or external storage.

12. **Missing Features**:
    - No pagination for buy requests list (could be large)
    - No search/filter UI for admin dashboard (only status filter via query param)
    - No image preview in form (only file names shown)
    - No device condition selection (assumes all unopened)

### Architecture Considerations

1. **Denormalization**: BuyRequest stores device details (modelName, storageGb, color, buyPrice) copied from ModelPrice. This is intentional for historical accuracy, but means price changes don't affect existing requests. Document this behavior.

2. **Email Uniqueness**: Users are identified by email only. No password or other auth factors. This is fine for MVP but limits account recovery options.

3. **No Rate Limiting**: Login code generation has no rate limiting. Could be abused for email spam.

4. **No Input Sanitization**: User inputs (notes, names) are stored as-is. Consider sanitization for XSS prevention (especially in admin notes displayed to users).

5. **Currency Hardcoded**: Currency is hardcoded to "KRW" in ModelPrice schema. Consider making it configurable if international expansion is planned.

### UI/UX Improvements

1. **Loading States**: Some API calls don't show loading indicators (e.g., model price loading in form page).

2. **Form Validation Feedback**: IMEI validation only shows error on blur. Consider real-time validation or better visual feedback.

3. **Photo Upload UX**: No drag-and-drop, no image preview thumbnails, no progress indicator for base64 conversion.

4. **Mobile Navigation**: Step sidebar becomes horizontal on mobile but could be improved (e.g., progress bar style).

5. **Error Recovery**: If API call fails, user must manually retry. Consider automatic retry with exponential backoff.

6. **Accessibility**: Some interactive elements may lack proper ARIA labels. Color contrast should be verified.

---

## Summary

The codebase is well-structured for an MVP, with clear separation between frontend and backend, and a functional public buy flow. The device selection page uses progressive disclosure effectively, and the form page collects all necessary information. The backend follows NestJS best practices with proper module organization.

**Key Strengths**:

- Clean module structure
- Type-safe API clients
- Responsive design with compact modes
- Status workflow tracking

**Areas for Production Readiness**:

- Replace console logging with email service
- Move photo storage to external service
- Add backend validation for IMEI/serial
- Enable TypeScript strict mode
- Add rate limiting and input sanitization
- Implement proper error boundaries and retry logic
