import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ExperimentService } from '../../core/services/experiment.service';
import { AntibodyService } from '../../core/services/antibody.service';
import { Experiment, ExperimentAntibody } from '../../core/models/experiment.model';
import { Antibody } from '../../core/models/antibody.model';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { ExperimentFormDialogComponent } from '../experiments/experiment-form-dialog.component';

@Component({
  selector: 'app-experiment-detail',
  standalone: true,
  imports: [
    CommonModule, RouterModule, ReactiveFormsModule,
    MatCardModule, MatTableModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatDialogModule, MatSnackBarModule, MatAutocompleteModule, MatDividerModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './experiment-detail.component.html',
  styleUrl: './experiment-detail.component.scss',
})
export default class ExperimentDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly experimentService = inject(ExperimentService);
  private readonly antibodyService = inject(AntibodyService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);

  experiment: Experiment | null = null;
  experimentAntibodies: ExperimentAntibody[] = [];
  allAntibodies: Antibody[] = [];
  filteredAntibodies: Antibody[] = [];
  loading = true;
  error: string | null = null;

  displayedColumns = ['tube_number', 'antigen_target', 'clone', 'fluorochrome', 'lab_name',
    'titration_ratio', 'ul_per_slide', 'chf_per_ul', 'total_chf', 'actions'];
  displayedColumnsReadonly = ['tube_number', 'antigen_target', 'clone', 'fluorochrome', 'lab_name',
    'titration_ratio', 'ul_per_slide', 'chf_per_ul', 'total_chf'];

  searchControl = this.fb.control('');
  importCodesControl = this.fb.control('');
  importing = false;

  get isPlanning() { return this.experiment?.status === 'planning'; }
  get columns() { return this.isPlanning ? this.displayedColumns : this.displayedColumnsReadonly; }

  totalCost = 0;

  private refreshAntibodies(eas: ExperimentAntibody[]) {
    this.experimentAntibodies = eas;
    this.totalCost = eas.reduce((sum, ea) => sum + Number(ea.total_chf), 0);
    this.cdr.detectChanges();
  }

  ngOnInit() {
    console.log('ngOnInit');
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
        ab.antigen_target?.toLowerCase().includes(q) ||
        ab.clone?.toLowerCase().includes(q) ||
        ab.fluorochrome?.toLowerCase().includes(q)
      );
    });
  }

  load(id: number) {
    this.loading = true;
    this.error = null;
    this.experimentService.getById(id).subscribe({
      next: (exp) => {
        this.experiment = exp;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.error || 'Failed to load experiment';
        this.cdr.detectChanges();
      },
    });
    this.experimentService.getAntibodies(id).subscribe(eas => this.refreshAntibodies(eas));
  }

  openEdit() {
    this.dialog.open(ExperimentFormDialogComponent, { data: this.experiment, width: '750px' })
      .afterClosed().subscribe(result => {
        if (!result) return;
        this.experimentService.update(this.experiment!.id, result).subscribe({
          next: (exp) => { this.experiment = exp; this.load(exp.id); },
          error: (err) => this.snackBar.open(err.error?.error || 'Error', 'Close', { duration: 5000, panelClass: 'error-snackbar' }),
        });
      });
  }

  selectAntibody(ab: Antibody) {
    if (!this.experiment) return;
    const alreadyAdded = this.experimentAntibodies.some(ea => ea.antibody_id === ab.id);
    if (alreadyAdded) {
      this.snackBar.open('Antibody already in this experiment', 'Close', { duration: 3000 });
      this.searchControl.setValue('');
      return;
    }
    this.experimentService.addAntibody(this.experiment.id, ab.id, 100).subscribe({
      next: () => { this.searchControl.setValue(''); this.load(this.experiment!.id); },
      error: (err) => this.snackBar.open(err.error?.error || 'Error', 'Close', { duration: 5000, panelClass: 'error-snackbar' }),
    });
  }

  updateTitration(ea: ExperimentAntibody, event: Event) {
    const val = parseInt((event.target as HTMLInputElement).value);
    if (!val || val < 1) return;
    this.experimentService.updateAntibody(this.experiment!.id, ea.id, val).subscribe({
      next: (updated) => {
        const updated_list = this.experimentAntibodies.map(x =>
          x.id === ea.id ? { ...ea, ...updated } : x
        );
        this.refreshAntibodies(updated_list);
      },
      error: (err) => this.snackBar.open(err.error?.error || 'Error', 'Close', { duration: 5000, panelClass: 'error-snackbar' }),
    });
  }

  importByCodes() {
    if (!this.experiment) return;
    const raw = (this.importCodesControl.value ?? '').trim();
    if (!raw) return;
    const codes = Array.from(new Set(
      raw.split(/[,\s]+/)
        .map(s => s.trim())
        .filter(Boolean)
        .map(s => parseInt(s, 10))
        .filter(n => Number.isFinite(n) && n > 0)
    ));
    if (codes.length === 0) {
      this.snackBar.open('No valid codes', 'Close', { duration: 3000 });
      return;
    }
    this.importing = true;
    this.experimentService.importAntibodies(this.experiment.id, codes).subscribe({
      next: (res) => {
        this.importing = false;
        this.importCodesControl.setValue('');
        this.load(this.experiment!.id);

        const emptyEntries = Object.entries(res.empty || {});
        const messageLines: string[] = [];
        messageLines.push(`Added: ${res.added.length} antibody(ies).`);
        if (emptyEntries.length) {
          messageLines.push('');
          messageLines.push('Finiti (current_volume = 0):');
          emptyEntries.forEach(([code, tubes]) => {
            messageLines.push(`  • Code ${code}: ${tubes.join(', ')}`);
          });
        }
        if (res.not_found?.length) {
          messageLines.push('');
          messageLines.push(`Not found: ${res.not_found.join(', ')}`);
        }

        this.dialog.open(ConfirmDialogComponent, {
          width: '480px',
          data: {
            title: 'Import Result',
            message: messageLines.join('\n'),
            confirmLabel: 'OK',
            hideCancel: true,
          },
        });
      },
      error: (err) => {
        this.importing = false;
        this.snackBar.open(err.error?.error || 'Import failed', 'Close', { duration: 5000, panelClass: 'error-snackbar' });
      },
    });
  }

  removeAntibody(ea: ExperimentAntibody) {
    this.experimentService.removeAntibody(this.experiment!.id, ea.id).subscribe({
      next: () => this.load(this.experiment!.id),
      error: (err) => this.snackBar.open(err.error?.error || 'Error', 'Close', { duration: 5000, panelClass: 'error-snackbar' }),
    });
  }

  downloadQuote() {
    this.experimentService.downloadQuotePdf(this.experiment!.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `quote_${this.experiment!.name.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => this.snackBar.open('Error downloading quote', 'Close', { duration: 5000, panelClass: 'error-snackbar' }),
    });
  }

  deleteExperiment() {
    if (!this.experiment) return;
    this.dialog.open(ConfirmDialogComponent, {
      width: '480px',
      data: {
        title: 'Delete Experiment',
        message: `Delete experiment "${this.experiment.name}"? This cannot be undone.`,
        confirmLabel: 'Delete',
        confirmColor: 'warn',
      },
    }).afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.experimentService.delete(this.experiment!.id).subscribe({
        next: () => {
          this.snackBar.open('Experiment deleted', 'Close', { duration: 3000 });
          this.router.navigate(['/experiments']);
        },
        error: (err) => this.snackBar.open(err.error?.error || 'Error', 'Close', { duration: 5000, panelClass: 'error-snackbar' }),
      });
    });
  }

  executeExperiment() {
    this.dialog.open(ConfirmDialogComponent, {
      width: '480px',
      data: {
        title: 'Execute Experiment',
        message: 'This will deduct antibody volumes from inventory. This action cannot be undone. Proceed?',
        confirmLabel: 'Execute',
        confirmColor: 'warn',
      },
    }).afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.experimentService.execute(this.experiment!.id).subscribe({
        next: () => {
          this.snackBar.open('Experiment executed successfully', 'Close', { duration: 3000 });
          this.load(this.experiment!.id);
        },
        error: (err) => {
          const details = err.error?.details;
          if (details?.length) {
            const msg = details.map((d: any) =>
              `${d.tube_number}: needs ${d.required.toFixed(1)}uL, has ${d.available.toFixed(1)}uL`
            ).join(' | ');
            this.snackBar.open('Insufficient volume: ' + msg, 'Close', { duration: 8000, panelClass: 'error-snackbar' });
          } else {
            this.snackBar.open(err.error?.error || 'Error', 'Close', { duration: 5000, panelClass: 'error-snackbar' });
          }
        },
      });
    });
  }

  displayFn(ab: Antibody | string): string {
    if (typeof ab === 'string') return ab;
    return ab ? `${ab.tube_number} — ${ab.antigen_target} (${ab.clone})` : '';
  }

  isInsufficient(ea: ExperimentAntibody): boolean {
    return Number(ea.current_volume) < Number(ea.total_ul_used);
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      planning: 'Planning',
      executed_not_billed: 'Executed – Not Billed',
      executed_billed: 'Executed – Billed',
    };
    return map[status] ?? status;
  }
}
