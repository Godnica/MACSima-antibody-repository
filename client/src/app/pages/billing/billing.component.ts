import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ExperimentService } from '../../core/services/experiment.service';
import { BillingService, BillingData, BillingLab } from '../../core/services/billing.service';
import { Experiment } from '../../core/models/experiment.model';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-billing',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatTableModule, MatButtonModule, MatIconModule,
    MatDividerModule, MatProgressSpinnerModule, MatDialogModule, MatSnackBarModule,
  ],
  templateUrl: './billing.component.html',
  styleUrl: './billing.component.scss',
})
export default class BillingComponent implements OnInit {
  private readonly experimentService = inject(ExperimentService);
  private readonly billingService = inject(BillingService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly cdr = inject(ChangeDetectorRef);

  unbilledExperiments: Experiment[] = [];
  billedExperiments: Experiment[] = [];

  selectedExperiment: Experiment | null = null;
  billingData: BillingData | null = null;
  loadingBilling = false;

  abColumns = ['tube_number', 'target', 'clone', 'fluorochrome', 'total_ul_used', 'chf_per_ul', 'total_chf'];

  ngOnInit() { this.loadExperiments(); }

  loadExperiments() {
    this.experimentService.getAll().subscribe(exps => {
      this.unbilledExperiments = exps.filter(e => e.status === 'executed_not_billed');
      this.billedExperiments = exps.filter(e => e.status === 'executed_billed');
      this.cdr.detectChanges();
    });
  }

  selectExperiment(exp: Experiment) {
    this.selectedExperiment = exp;
    this.loadingBilling = true;
    this.billingData = null;
    this.billingService.getBillingData(exp.id).subscribe({
      next: (data) => { this.billingData = data; this.loadingBilling = false; this.cdr.detectChanges(); },
      error: (err) => {
        this.snackBar.open(err.error?.error || 'Failed to load billing data', 'Close', { duration: 5000, panelClass: 'error-snackbar' });
        this.loadingBilling = false;
      },
    });
  }

  downloadPdf(lab: BillingLab) {
    if (!this.selectedExperiment) return;
    this.billingService.downloadPdf(this.selectedExperiment.id, lab.lab_id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `billing_${this.selectedExperiment!.name}_${lab.lab_name}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => this.snackBar.open('Failed to download PDF', 'Close', { duration: 5000, panelClass: 'error-snackbar' }),
    });
  }

  markAsBilled() {
    if (!this.selectedExperiment) return;
    this.dialog.open(ConfirmDialogComponent, {
      width: '480px',
      data: {
        title: 'Mark as Billed',
        message: `Mark experiment "${this.selectedExperiment.name}" as billed? This cannot be undone.`,
        confirmLabel: 'Mark Billed',
        confirmColor: 'primary',
      },
    }).afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.experimentService.markBilled(this.selectedExperiment!.id).subscribe({
        next: () => {
          this.snackBar.open('Experiment marked as billed', 'Close', { duration: 3000 });
          this.selectedExperiment = null;
          this.billingData = null;
          this.loadExperiments();
        },
        error: (err) => this.snackBar.open(err.error?.error || 'Error', 'Close', { duration: 5000, panelClass: 'error-snackbar' }),
      });
    });
  }

  back() {
    this.selectedExperiment = null;
    this.billingData = null;
  }
}
