---
name: frontend-developer
description: Skill for building the frontend of the Antibody Repository Tool using Angular 17+ with standalone components and Angular Material. Use this skill whenever creating, modifying, or debugging any frontend page, component, dialog, form, table, or UI element. Trigger on any mention of UI, frontend, component, page, form, dialog, table, layout, navigation, styling, or Angular-related work. Also trigger when implementing a task from tasks.md that involves the client/UI layer.
---

# Frontend Developer Skill — Antibody Repository Tool

## Tech Stack

- **Framework**: Angular 17+ with standalone components (no NgModules)
- **UI Library**: Angular Material (latest compatible version)
- **Styling**: SCSS, using Angular Material's theming system
- **Routing**: Angular Router with lazy-loaded standalone components
- **HTTP**: Angular HttpClient with interceptors for JWT auth
- **Forms**: Reactive Forms (`FormGroup`, `FormControl`, `Validators`)

## Project Initialization

```bash
ng new client --standalone --style=scss --routing
cd client
ng add @angular/material
```

When prompted for Angular Material setup:
- Choose a **prebuilt theme**: `indigo-pink` or `azure-blue` (neutral, professional)
- Set up global typography: **Yes**
- Set up animations: **Yes**

## Design Principles

### Minimal and Functional
This is a lab tool, not a marketing site. Every UI decision should prioritize:

1. **Clarity over decoration** — No gradients, shadows, or visual noise. Flat, clean surfaces.
2. **Data density** — Tables are the primary UI element. Show as much data as possible without scrolling horizontally.
3. **Immediate usability** — No onboarding needed. Labels are self-explanatory. Actions are obvious.
4. **Consistent spacing** — Use Angular Material's density system. Prefer `-1` or `-2` density for compact tables and forms.
5. **No custom CSS unless necessary** — Lean on Angular Material defaults. Override only for spacing or layout.

### Color Usage
- **Primary**: Angular Material theme primary (indigo/azure) — used only for primary actions and active navigation
- **Warn**: Angular Material warn color — used only for destructive actions and error states
- **Quality Color Dots**: Small colored circles (`12px`) inline in tables
  - Green: `#4caf50`
  - Yellow: `#ff9800`
  - Grey: `#9e9e9e`
  - None: no dot shown
- **Status Badges**: Simple `mat-chip` with muted colors
  - Planning: default/neutral
  - Executed Not Billed: blue tint
  - Executed Billed: green tint
- **Low Stock Warning**: Amber/orange background row highlight or icon

### Typography
- Use Angular Material's default typography (Roboto). Do not add custom fonts.
- Page titles: `<h2>` or `mat-card-title`
- Section headers within a page: `<h3>` or `mat-card-subtitle`
- No decorative text. No hero sections.

## Component Patterns

### Every page component follows this structure:

```typescript
@Component({
  standalone: true,
  imports: [CommonModule, MatTableModule, /* ... only what's needed */],
  templateUrl: './page-name.component.html',
  styleUrl: './page-name.component.scss'
})
export default class PageNameComponent implements OnInit {
  // ...
}
```

**Key rules:**
- `standalone: true` on every component — no NgModules
- Default export for lazy loading in routes
- Import only the Angular Material modules actually used in the template
- One component per file. No barrel exports unless grouping related small components.

### Tables (primary UI element)

Use `mat-table` for all data displays. Standard configuration:

```html
<mat-form-field appearance="outline" class="filter-field">
  <mat-label>Search</mat-label>
  <input matInput (keyup)="applyFilter($event)" placeholder="Search..." #input>
</mat-form-field>

<table mat-table [dataSource]="dataSource" matSort>
  <!-- columns -->
  <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
  <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
</table>

<mat-paginator [pageSizeOptions]="[10, 25, 50]" showFirstLastButtons />
```

Rules for tables:
- Always include `MatSort` and `MatPaginator`
- Always include a search/filter field above the table
- Use `MatTableDataSource` for client-side filtering/sorting
- Column widths: let content determine width. Use `white-space: nowrap` on short columns (IDs, numbers). Allow wrapping on description columns.
- Numeric columns aligned right. Text columns aligned left.
- Action buttons in the last column, use icon buttons (`mat-icon-button`) to save space.

### Forms

Use Reactive Forms exclusively. Structure:

```html
<form [formGroup]="form" (ngSubmit)="onSubmit()">
  <div class="form-grid">
    <mat-form-field appearance="outline">
      <mat-label>Field Name</mat-label>
      <input matInput formControlName="fieldName">
      <mat-error *ngIf="form.get('fieldName')?.hasError('required')">Required</mat-error>
    </mat-form-field>
    <!-- more fields -->
  </div>
  <div class="form-actions">
    <button mat-button type="button" (click)="onCancel()">Cancel</button>
    <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid">Save</button>
  </div>
</form>
```

Rules for forms:
- `appearance="outline"` on all form fields (consistent look)
- Show validation errors inline with `<mat-error>`
- Primary action: `mat-flat-button color="primary"`
- Secondary/cancel action: `mat-button` (no color)
- Destructive action: `mat-flat-button color="warn"`
- Dropdown fields for foreign keys (e.g. Lab selection): use `mat-select` populated from API
- Calculated fields (e.g. CHF/µL): displayed as read-only `matInput` with `[readonly]="true"`, updated reactively via `valueChanges`

### Form layout helper class

```scss
.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 0 16px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
}
```

### Dialogs

Use `MatDialog` for:
- Confirmation prompts (delete, execute experiment)
- Add/edit forms when inline editing is impractical

Keep dialogs narrow (`width: 480px` max for confirmations, `640px` for forms).

```typescript
// Confirmation dialog — reusable
export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmLabel?: string;
  confirmColor?: 'primary' | 'warn';
}
```

Create ONE reusable `ConfirmDialogComponent` and use it everywhere. Do not create per-feature confirmation dialogs.

### Snackbar for Feedback

Use `MatSnackBar` for all success/error feedback after actions:

```typescript
this.snackBar.open('Antibody added successfully', 'Close', { duration: 3000 });
```

- Success: default styling, 3s duration
- Error: add `panelClass: 'error-snackbar'` with red-tinted background, 5s duration

## Navigation

### Layout

```
┌─────────────────────────────────────────┐
│  Toolbar (mat-toolbar)                  │
│  [App Title]              [User] [Logout]│
├──────┬──────────────────────────────────┤
│ Side │  Content area (router-outlet)    │
│ nav  │                                  │
│      │                                  │
│      │                                  │
└──────┴──────────────────────────────────┘
```

- **Toolbar**: `mat-toolbar color="primary"`. App name left, user info + logout right.
- **Sidenav**: `mat-sidenav` in `mode="side"` on desktop, `mode="over"` on mobile. Use `mat-nav-list` with `mat-list-item` for each tab. Active route highlighted.
- **Content**: Padded `24px`, max-width `1400px`, centered.

### Admin tabs (sidenav items):
1. Inventory (icon: `science`)
2. Experiments (icon: `biotech`)
3. Low Stock (icon: `warning`)
4. Billing (icon: `receipt_long`)
5. Laboratories (icon: `business`)

### User tabs:
1. Repository (icon: `search`)

### Routing structure:

```typescript
export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./pages/login/login.component') },
  {
    path: '',
    loadComponent: () => import('./layout/main-layout.component'),
    canActivate: [authGuard],
    children: [
      { path: 'inventory', loadComponent: () => import('./pages/inventory/inventory.component'), canActivate: [adminGuard] },
      { path: 'experiments', loadComponent: () => import('./pages/experiments/experiments.component'), canActivate: [adminGuard] },
      { path: 'experiments/:id', loadComponent: () => import('./pages/experiment-detail/experiment-detail.component'), canActivate: [adminGuard] },
      { path: 'low-stock', loadComponent: () => import('./pages/low-stock/low-stock.component'), canActivate: [adminGuard] },
      { path: 'billing', loadComponent: () => import('./pages/billing/billing.component'), canActivate: [adminGuard] },
      { path: 'laboratories', loadComponent: () => import('./pages/laboratories/laboratories.component'), canActivate: [adminGuard] },
      { path: 'repository', loadComponent: () => import('./pages/repository/repository.component') },
      { path: '', redirectTo: 'inventory', pathMatch: 'full' },
    ]
  }
];
```

## HTTP & Auth

### JWT Interceptor

```typescript
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');
  if (token) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }
  return next(req).pipe(
    catchError(err => {
      if (err.status === 401) {
        // redirect to login
      }
      return throwError(() => err);
    })
  );
};
```

### API Service Pattern

One service per domain entity:

```typescript
@Injectable({ providedIn: 'root' })
export class AntibodyService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/antibodies';

  getAll(): Observable<Antibody[]> { return this.http.get<Antibody[]>(this.baseUrl); }
  getById(id: number): Observable<Antibody> { return this.http.get<Antibody>(`${this.baseUrl}/${id}`); }
  create(data: CreateAntibodyDto): Observable<Antibody> { return this.http.post<Antibody>(this.baseUrl, data); }
  update(id: number, data: UpdateAntibodyDto): Observable<Antibody> { return this.http.put<Antibody>(`${this.baseUrl}/${id}`, data); }
  delete(id: number): Observable<void> { return this.http.delete<void>(`${this.baseUrl}/${id}`); }
}
```

Services: `LaboratoryService`, `AntibodyService`, `ExperimentService`, `BillingService`, `AuthService`.

### Proxy for development

In `proxy.conf.json`:
```json
{
  "/api": {
    "target": "http://localhost:3000",
    "secure": false
  }
}
```

## Page-Specific Behavior

### Experiment Detail Page (most complex page)

When status is `planning`:
- Show experiment metadata in a card at top (editable)
- Below: antibody selection via autocomplete/search dropdown that queries the inventory
- Selected antibodies shown in a `mat-table` with editable titration column (inline `input`)
- Calculated columns (`µL/slide`, `Total µL`, `Total CHF`) update live via reactive recalculation
- Footer row in table: **Total experiment cost**
- Action bar: "Save" button + "Execute Experiment" button (warn color, triggers confirmation dialog)

When status is `executed_not_billed` or `executed_billed`:
- Everything read-only
- Same table layout but no edit controls
- If `executed_not_billed`: show "Generate Billing" button

### Inventory Page
- Full `mat-table` with all antibody fields
- "Add Antibody" button opens a dialog or navigates to form page
- Edit via row click → dialog with pre-filled form
- Delete via icon button with confirmation
- Quality color shown as colored dot in table cell

### Low Stock Page
- Read-only `mat-table`, pre-filtered for `current_volume < 40`
- Sorted by volume ascending
- Amber row highlight or warning icon per row

### Billing Page
- List of experiments with status `executed_not_billed`
- Click experiment → see cost breakdown grouped by lab
- "Generate PDF" button per lab → triggers download
- After all PDFs generated, button to mark as `executed_billed`

### Repository Page (User view)
- Read-only `mat-table` with filters for: target, species, clone, fluorochrome, lab, quality color
- Use `mat-select` dropdowns for filter fields (populated from distinct values in data)
- Quality color dots shown inline
- No action buttons. Pure browsing.

## Things to Avoid

- **No custom themes** — use Angular Material prebuilt theme as-is
- **No animations beyond Angular Material defaults** — no custom transitions, no fade-ins
- **No loading skeletons** — a simple `mat-spinner` centered on page is enough for loading states
- **No empty state illustrations** — just a text message: "No data found"
- **No tooltips unless truly needed** — labels should be self-explanatory
- **No nested dialogs** — one dialog level max
- **No inline SVGs or custom icons** — use Material Icons from the icon font only
- **Do not install additional UI libraries** — Angular Material is sufficient for everything


## Assets

Logo and image files are available in the `assets/` folder 
of this skill directory. Use them for toolbar branding, 
login page, and PDF headers.

Available files:
- `ior.png` — IOR logo
- `USI_logo.svg` — USI logo  
- `facility_logo.png` — facility Logo