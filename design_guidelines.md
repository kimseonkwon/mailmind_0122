# Design Guidelines: PST Email Search Application

## Design Approach

**Selected Approach:** Design System - Material Design 3  
**Justification:** This is a utility-focused productivity tool for email management and search. The application requires clarity, efficiency, and data-dense layouts. Material Design 3 provides robust patterns for forms, data display, and search interfaces while maintaining professional aesthetics.

**Key Design Principles:**
- Function over form - every element serves a purpose
- Clear information hierarchy for email data
- Instant visual feedback for search and import actions
- Scannable results with effective use of whitespace

---

## Core Design Elements

### A. Typography

**Font Families:** 
- Primary: Inter (via Google Fonts)
- Monospace: JetBrains Mono (for technical data, file paths, IDs)

**Hierarchy:**
- H1 (Page Titles): text-4xl font-bold tracking-tight
- H2 (Section Headers): text-2xl font-semibold
- H3 (Card Headers): text-xl font-medium
- Body: text-base font-normal leading-relaxed
- Small/Meta (dates, IDs): text-sm 
- Technical Info: text-sm font-mono

---

### B. Layout System

**Spacing Units:** We will use Tailwind units of 2, 4, 6, and 8 as primary spacing (e.g., p-4, gap-6, mb-8, space-y-4). Use 12 and 16 sparingly for major section breaks.

**Container Strategy:**
- Main layout: max-w-7xl mx-auto px-4
- Content cards: max-w-4xl for optimal reading
- Forms: max-w-2xl for focused input areas

**Grid Patterns:**
- Stats/Metrics: 3-column grid on desktop (grid-cols-1 md:grid-cols-3 gap-6)
- Email results: Single column list with full width
- Upload area: Centered, max-w-xl

---

### C. Component Library

#### Navigation
- Top navigation bar: Fixed, minimal height, contains app title and primary actions
- Sticky search bar below nav for persistent access

#### Forms & Input
**Upload Section:**
- Large dropzone area (min-h-64) with dashed border
- Icon (upload cloud) centered with instructional text
- File input button styled as filled button
- Progress indicator (linear progress bar) during import

**Search Interface:**
- Full-width search input with search icon prefix
- "top_k" selector as compact dropdown inline
- Search button as icon button (magnifying glass)
- Real-time search suggestions dropdown

#### Data Display

**Statistics Dashboard:**
- Card-based metrics in 3-column grid
- Each card: Icon, large number, descriptive label
- Subtle elevation (shadow-sm)
- Key metrics: Total emails, Import status, Last updated

**Email Results List:**
- Each result as a card (border, rounded corners, padding-4)
- Layout per card:
  - Subject line (font-semibold, text-lg)
  - Sender + Date in flex row with gap-2 (text-sm meta styling)
  - Body preview (text-sm, line-clamp-2 for truncation)
  - Score badge in top-right corner
  - Subtle hover state (slight elevation increase)
- List spacing: space-y-4 between cards

**Empty States:**
- Centered content with icon
- Primary text explaining state
- Secondary action button where applicable

#### Buttons & Actions
- Primary action: Filled button style with elevation
- Secondary: Outlined button
- Icon buttons for inline actions
- Floating action button for quick upload (bottom-right, fixed)

#### Feedback & Status
- Toast notifications for success/error (top-right)
- Loading states: Skeleton screens for email list, spinner for quick actions
- Progress bars: Linear for file operations

---

### D. Responsive Behavior

**Mobile (< 768px):**
- Stack all multi-column layouts to single column
- Expand search to full width
- Collapsible navigation menu
- Reduce card padding to p-3

**Tablet (768px - 1024px):**
- 2-column grid for stats
- Maintain full search interface
- Moderate padding

**Desktop (> 1024px):**
- 3-column layouts where specified
- Side-by-side upload and stats areas possible
- Maximum content width enforcement

---

### E. Animations

**Minimal Motion:**
- Card hover: Subtle elevation change (transition-shadow duration-200)
- Button press: Scale down slightly (active:scale-95)
- Search results: Fade in on load (transition-opacity duration-300)
- File upload progress: Smooth linear animation

**No:** Complex scroll animations, page transitions, or decorative motion

---

## Page-Specific Layouts

### Main Application View

**Layout Structure:**
1. **Header** (sticky top, h-16): App title left, stats summary right
2. **Search Section** (p-8): Centered search bar with filters
3. **Results Area** (flex-1): Email cards in single-column list, scrollable
4. **Upload FAB**: Fixed bottom-right for quick access

**Import/Upload Modal:**
- Overlay modal (max-w-2xl)
- Large dropzone as focal point
- Import settings below (model selection, options)
- Progress indicator during processing
- Success state with stats summary

### Statistics Dashboard

**Layout:**
- Grid of metric cards (3 columns)
- Training status panel (if applicable)
- Recent activity timeline
- Export/management actions at bottom

---

## Technical Specifications

**Icons:** Heroicons (outline for UI, solid for emphasis) via CDN

**Elevation System:**
- Cards: shadow-sm hover:shadow-md
- Modals: shadow-2xl
- Dropdowns: shadow-lg

**Border Radius:**
- Cards: rounded-lg
- Buttons: rounded-md
- Input fields: rounded-md

**Accessibility:**
- All interactive elements: Focus rings (focus:ring-2 focus:ring-offset-2)
- Form labels clearly associated
- ARIA labels for icon-only buttons
- Keyboard navigation support throughout

---

**Design Intent:** Create a professional, efficient email search interface that prioritizes usability and information clarity. The design should feel modern and clean while staying out of the way of the user's task.