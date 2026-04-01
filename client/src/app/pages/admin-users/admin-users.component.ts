import { Component, inject, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { UserService } from '../../core/services/user.service';
import { UserAdmin } from '../../core/models/user.model';
import { UserFormDialogComponent } from './user-form-dialog.component';
import { ResetPasswordDialogComponent } from './reset-password-dialog.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
    MatSnackBarModule,
  ],
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.component.scss',
})
export default class AdminUsersComponent implements OnInit, AfterViewInit {
  private readonly service = inject(UserService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  displayedColumns = ['username', 'display_name', 'role', 'created_at', 'actions'];
  dataSource = new MatTableDataSource<UserAdmin>();

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  ngOnInit() {
    this.load();
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  load() {
    this.service.getAll().subscribe(data => this.dataSource.data = data);
  }

  applyFilter(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.dataSource.filter = value.trim().toLowerCase();
  }

  openAdd() {
    this.dialog.open(UserFormDialogComponent, { width: '640px' })
      .afterClosed().subscribe(result => {
        if (result) {
          this.service.create(result).subscribe({
            next: () => { this.snackBar.open('User created', 'Close', { duration: 3000 }); this.load(); },
            error: (err) => this.snackBar.open(err.error?.error || err.error?.detail || 'Error creating user', 'Close', { duration: 5000, panelClass: 'error-snackbar' }),
          });
        }
      });
  }

  openResetPassword(user: UserAdmin) {
    this.dialog.open(ResetPasswordDialogComponent, { width: '400px', data: { username: user.username } })
      .afterClosed().subscribe(newPassword => {
        if (newPassword) {
          this.service.resetPassword(user.id, newPassword).subscribe({
            next: () => this.snackBar.open('Password reset successfully', 'Close', { duration: 3000 }),
            error: (err) => this.snackBar.open(err.error?.error || 'Error resetting password', 'Close', { duration: 5000, panelClass: 'error-snackbar' }),
          });
        }
      });
  }

  confirmDelete(user: UserAdmin) {
    this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete User',
        message: `Delete user "${user.username}"? This cannot be undone.`,
        confirmLabel: 'Delete',
        confirmColor: 'warn',
      },
    }).afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.service.remove(user.id).subscribe({
          next: () => { this.snackBar.open('User deleted', 'Close', { duration: 3000 }); this.load(); },
          error: (err) => this.snackBar.open(err.error?.error || 'Error deleting user', 'Close', { duration: 5000, panelClass: 'error-snackbar' }),
        });
      }
    });
  }
}
