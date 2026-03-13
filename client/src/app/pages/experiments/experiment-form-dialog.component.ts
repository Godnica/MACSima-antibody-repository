import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { LaboratoryService } from '../../core/services/laboratory.service';
import { Laboratory } from '../../core/models/laboratory.model';
import { Experiment } from '../../core/models/experiment.model';

@Component({
  selector: 'app-experiment-form-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatDatepickerModule, MatButtonModule,
  ],
  providers: [provideNativeDateAdapter()],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Edit Experiment' : 'New Experiment' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="form-grid">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Experiment Name</mat-label>
          <input matInput formControlName="name">
          <mat-error *ngIf="form.get('name')?.hasError('required')">Required</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Date</mat-label>
          <input matInput [matDatepicker]="picker" formControlName="date">
          <mat-datepicker-toggle matIconSuffix [for]="picker" />
          <mat-datepicker #picker />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Requesting Lab</mat-label>
          <mat-select formControlName="requesting_lab_id">
            <mat-option [value]="null">— None —</mat-option>
            @for (lab of labs; track lab.id) {
              <mat-option [value]="lab.id">{{ lab.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>MACSwell Slides</mat-label>
          <input matInput type="number" formControlName="macswell_slides" min="1">
          <mat-error *ngIf="form.get('macswell_slides')?.hasError('required')">Required</mat-error>
          <mat-error *ngIf="form.get('macswell_slides')?.hasError('min')">Must be >= 1</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Total Cocktail Volume (µL)</mat-label>
          <input matInput type="number" formControlName="total_cocktail_volume" min="0.01">
          <mat-error *ngIf="form.get('total_cocktail_volume')?.hasError('required')">Required</mat-error>
          <mat-error *ngIf="form.get('total_cocktail_volume')?.hasError('min')">Must be > 0</mat-error>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" (click)="onSave()" [disabled]="form.invalid">Save</button>
    </mat-dialog-actions>
  `,
  styles: [`.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 16px; padding-top: 8px; }
            .full-width { grid-column: 1 / -1; }`],
})
export class ExperimentFormDialogComponent implements OnInit {
  readonly data = inject<Experiment | null>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<ExperimentFormDialogComponent>);
  private readonly fb = inject(FormBuilder);
  private readonly labService = inject(LaboratoryService);

  labs: Laboratory[] = [];

  form = this.fb.group({
    name:                  [this.data?.name ?? '',                          Validators.required],
    date:                  [this.data?.date ? new Date(this.data.date) : null, []],
    requesting_lab_id:     [this.data?.requesting_lab_id ?? null,           []],
    macswell_slides:       [this.data?.macswell_slides ?? null,             [Validators.required, Validators.min(1)]],
    total_cocktail_volume: [this.data?.total_cocktail_volume ?? null,       [Validators.required, Validators.min(0.01)]],
  });

  ngOnInit() { this.labService.getAll().subscribe(labs => this.labs = labs); }

  onSave() {
    if (this.form.valid) this.dialogRef.close(this.form.value);
  }
}
