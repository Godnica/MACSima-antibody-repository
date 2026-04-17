import { Component, ChangeDetectorRef, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { LaboratoryService } from '../../core/services/laboratory.service';
import { Laboratory } from '../../core/models/laboratory.model';
import { Antibody } from '../../core/models/antibody.model';

@Component({
  selector: 'app-antibody-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
  ],
  templateUrl: './antibody-form-dialog.component.html',
  styleUrl: './antibody-form-dialog.component.scss',
})
export class AntibodyFormDialogComponent implements OnInit {
  readonly data = inject<Antibody | null>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<AntibodyFormDialogComponent>);
  private readonly fb = inject(FormBuilder);
  private readonly labService = inject(LaboratoryService);
  private readonly cdr = inject(ChangeDetectorRef);

  labs: Laboratory[] = [];

  qualityOptions = [
    { value: 'none',   label: 'None' },
    { value: 'green',  label: 'Green' },
    { value: 'yellow', label: 'Yellow' },
    { value: 'grey',   label: 'Grey' },
  ];

  statusOptions = [
    { value: '',       label: 'None' },
    { value: 'in use', label: 'In Use' },
    { value: 'backup', label: 'Backup' },
  ];

  isEdit = !!this.data;

  form = this.fb.group({
    lab_id:            [this.data?.lab_id ?? null,             Validators.required],
    antibody_code:     [this.data?.antibody_code ?? null,       []],
    tube_number:       [this.data?.tube_number ?? '',          Validators.required],
    species:           [this.data?.species ?? '',              []],
    antigen_target:    [this.data?.antigen_target ?? '',       []],
    clone:             [this.data?.clone ?? '',                []],
    company:           [this.data?.company ?? '',              []],
    order_number:      [this.data?.order_number ?? '',         []],
    lot_number:        [this.data?.lot_number ?? '',           []],
    fluorochrome:      [this.data?.fluorochrome ?? '',         []],
    processing:        [this.data?.processing ?? '',           []],
    status:            [this.data?.status ?? '',               []],
    volume_on_arrival: [this.data?.volume_on_arrival ?? null,  [Validators.required, Validators.min(0.01)]],
    current_volume:    [this.data?.current_volume ?? null,     [Validators.min(0)]],
    cost_chf:          [this.data?.cost_chf ?? null,           [Validators.required, Validators.min(0.01)]],
    quality_color:     [this.data?.quality_color ?? 'none',    []],
    chf_per_ul:        [{ value: this.data?.chf_per_ul != null ? Number(this.data.chf_per_ul).toFixed(4) : '', disabled: true }, []],
  });

  ngOnInit() {
    this.labService.getAll().subscribe(labs => {
      this.labs = labs;
      this.cdr.detectChanges();
    });

    this.form.get('volume_on_arrival')!.valueChanges.subscribe(() => this.updateChfPerUl());
    this.form.get('cost_chf')!.valueChanges.subscribe(() => this.updateChfPerUl());
  }

  private updateChfPerUl() {
    const vol = parseFloat(this.form.get('volume_on_arrival')!.value as any);
    const cost = parseFloat(this.form.get('cost_chf')!.value as any);
    if (vol > 0 && cost > 0) {
      this.form.get('chf_per_ul')!.setValue((cost / vol).toFixed(4), { emitEvent: false });
    } else {
      this.form.get('chf_per_ul')!.setValue('', { emitEvent: false });
    }
  }

  onSave() {
    if (this.form.valid) {
      const { chf_per_ul, current_volume, ...rest } = this.form.getRawValue();
      const value = this.isEdit ? { ...rest, current_volume } : rest;
      this.dialogRef.close(value);
    }
  }
}
