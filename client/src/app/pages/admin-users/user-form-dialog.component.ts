import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-user-form-dialog',
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
  template: `
    <h2 mat-dialog-title>Add User</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="form-grid">
        <mat-form-field appearance="outline">
          <mat-label>Username</mat-label>
          <input matInput formControlName="username">
          <mat-error *ngIf="form.get('username')?.hasError('required')">Required</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Display Name</mat-label>
          <input matInput formControlName="display_name">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Password</mat-label>
          <input matInput formControlName="password" type="password">
          <mat-error *ngIf="form.get('password')?.hasError('required')">Required</mat-error>
          <mat-error *ngIf="form.get('password')?.hasError('minlength')">Min 6 characters</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Role</mat-label>
          <mat-select formControlName="role">
            <mat-option value="user">User</mat-option>
            <mat-option value="admin">Admin</mat-option>
          </mat-select>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" (click)="onSave()" [disabled]="form.invalid">Create</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0 16px;
      padding-top: 8px;
    }
  `],
})
export class UserFormDialogComponent {
  readonly dialogRef = inject(MatDialogRef<UserFormDialogComponent>);
  private readonly fb = inject(FormBuilder);

  form = this.fb.group({
    username:     ['', Validators.required],
    display_name: [''],
    password:     ['', [Validators.required, Validators.minLength(6)]],
    role:         ['user', Validators.required],
  });

  onSave() {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    }
  }
}
