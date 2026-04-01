import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-reset-password-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>Reset Password</h2>
    <mat-dialog-content>
      <p>Set a new password for <strong>{{ data.username }}</strong>. The user will be forced to change it on next login.</p>
      <mat-form-field appearance="outline" style="width: 100%">
        <mat-label>New Password</mat-label>
        <input matInput formControlName="password" type="password" [formGroup]="form">
        <mat-error *ngIf="form.get('password')?.hasError('required')">Required</mat-error>
        <mat-error *ngIf="form.get('password')?.hasError('minlength')">Min 6 characters</mat-error>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" (click)="onSave()" [disabled]="form.invalid">Reset</button>
    </mat-dialog-actions>
  `,
})
export class ResetPasswordDialogComponent {
  readonly data = inject<{ username: string }>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<ResetPasswordDialogComponent>);
  private readonly fb = inject(FormBuilder);

  form = this.fb.group({
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  onSave() {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value.password);
    }
  }
}
