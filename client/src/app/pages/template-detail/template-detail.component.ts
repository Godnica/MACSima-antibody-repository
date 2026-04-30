import { Component, inject, OnInit, ChangeDetectorRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { TemplateService } from '../../core/services/template.service';
import { AntibodyService } from '../../core/services/antibody.service';
import { Antibody } from '../../core/models/antibody.model';
import { ExperimentTemplate, ExperimentTemplateAntibody } from '../../core/models/template.model';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { InstantiateTemplateDialogComponent, TemplateFormDialogComponent } from '../templates/template-dialogs.component';

@Component({
  selector: 'app-template-detail',
  standalone: true,
  imports: [
    CommonModule, RouterModule, ReactiveFormsModule,
    MatCardModule, MatTableModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatDialogModule, MatSnackBarModule,
    MatAutocompleteModule, MatProgressSpinnerModule, MatSortModule,
  ],
  templateUrl: './template-detail.component.html',
  styleUrl: './template-detail.component.scss',
})
export default class TemplateDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(TemplateService);
  private readonly antibodyService = inject(AntibodyService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);

  template: ExperimentTemplate | null = null;
  dataSource = new MatTableDataSource<ExperimentTemplateAntibody>([]);

  @ViewChild(MatSort) set matSort(sort: MatSort) {
    if (sort) this.dataSource.sort = sort;
  }

  allAntibodies: Antibody[] = [];
  filteredAntibodies: Antibody[] = [];
  loading = true;
  error: string | null = null;

  displayedColumns = [
    'tube_number', 'antibody_code', 'antigen_target', 'clone', 'fluorochrome',
    'status', 'lab_name', 'titration_ratio', 'volume_on_arrival', 'current_volume', 'chf_per_ul', 'actions',
  ];

  searchControl = this.fb.control('');
  get templateAntibodies() { return this.dataSource.data; }

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.load(id);

    this.antibodyService.getAll().subscribe(abs => {
      this.allAntibodies = abs.filter(ab => parseFloat(ab.current_volume as any) > 0);
      this.filteredAntibodies = this.allAntibodies;
      this.cdr.detectChanges();
    });

    this.searchControl.valueChanges.pipe(
      debounceTime(200), distinctUntilChanged()
    ).subscribe(val => {
      const q = (val ?? '').toLowerCase();
      this.filteredAntibodies = this.allAntibodies.filter(ab =>
        !q ||
        ab.tube_number?.toLowerCase().includes(q) ||
        ab.antibody_code?.toString().includes(q) ||
        ab.antigen_target?.toLowerCase().includes(q) ||
        ab.clone?.toLowerCase().includes(q) ||
        ab.fluorochrome?.toLowerCase().includes(q)
      );
    });
  }

  load(id: number) {
    this.loading = true;
    this.error = null;
    this.service.getById(id).subscribe({
      next: (tpl) => {
        this.template = tpl;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.error || 'Failed to load template';
        this.cdr.detectChanges();
      },
    });
    this.service.getAntibodies(id).subscribe(abs => this.dataSource.data = abs);
  }

  openEdit() {
    this.dialog.open(TemplateFormDialogComponent, { data: this.template, width: '750px' })
      .afterClosed().subscribe(result => {
        if (!result || !this.template) return;
        this.service.update(this.template.id, result).subscribe({
          next: (tpl) => { this.template = tpl; this.load(tpl.id); },
          error: (err) => this.snackBar.open(err.error?.error || 'Error', 'Close', { duration: 5000, panelClass: 'error-snackbar' }),
        });
      });
  }

  useTemplate() {
    if (!this.template) return;
    this.dialog.open(InstantiateTemplateDialogComponent, { data: this.template, width: '750px' })
      .afterClosed().subscribe(result => {
        if (!result || !this.template) return;
        this.service.instantiate(this.template.id, result).subscribe({
          next: (exp) => this.router.navigate(['/experiments', exp.id]),
          error: (err) => this.snackBar.open(err.error?.error || 'Error', 'Close', { duration: 5000, panelClass: 'error-snackbar' }),
        });
      });
  }

  selectAntibody(ab: Antibody) {
    if (!this.template) return;
    const alreadyAdded = this.templateAntibodies.some(ta => ta.antibody_id === ab.id);
    if (alreadyAdded) {
      this.snackBar.open('Antibody already in this template', 'Close', { duration: 3000 });
      this.searchControl.setValue('');
      return;
    }
    this.service.addAntibody(this.template.id, ab.id, 100).subscribe({
      next: () => { this.searchControl.setValue(''); this.load(this.template!.id); },
      error: (err) => this.snackBar.open(err.error?.error || 'Error', 'Close', { duration: 5000, panelClass: 'error-snackbar' }),
    });
  }

  updateTitration(row: ExperimentTemplateAntibody, event: Event) {
    const val = parseInt((event.target as HTMLInputElement).value, 10);
    if (!this.template || !val || val < 1) return;
    this.service.updateAntibody(this.template.id, row.id, val).subscribe({
      next: (updated) => {
        this.dataSource.data = this.templateAntibodies.map(x => x.id === row.id ? { ...x, ...updated } : x);
      },
      error: (err) => this.snackBar.open(err.error?.error || 'Error', 'Close', { duration: 5000, panelClass: 'error-snackbar' }),
    });
  }

  removeAntibody(row: ExperimentTemplateAntibody) {
    if (!this.template) return;
    this.service.removeAntibody(this.template.id, row.id).subscribe({
      next: () => this.load(this.template!.id),
      error: (err) => this.snackBar.open(err.error?.error || 'Error', 'Close', { duration: 5000, panelClass: 'error-snackbar' }),
    });
  }

  deleteTemplate() {
    if (!this.template) return;
    this.dialog.open(ConfirmDialogComponent, {
      width: '480px',
      data: {
        title: 'Delete Template',
        message: `Delete template "${this.template.name}"? This cannot be undone.`,
        confirmLabel: 'Delete',
        confirmColor: 'warn',
      },
    }).afterClosed().subscribe(confirmed => {
      if (!confirmed || !this.template) return;
      this.service.delete(this.template.id).subscribe({
        next: () => {
          this.snackBar.open('Template deleted', 'Close', { duration: 3000 });
          this.router.navigate(['/templates']);
        },
        error: (err) => this.snackBar.open(err.error?.error || 'Error', 'Close', { duration: 5000, panelClass: 'error-snackbar' }),
      });
    });
  }

  displayFn(ab: Antibody | string): string {
    if (typeof ab === 'string') return ab;
    return ab ? `${ab.tube_number} — ${ab.antigen_target} (${ab.clone})` : '';
  }
}
