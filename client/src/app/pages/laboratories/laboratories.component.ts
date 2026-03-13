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
import { LaboratoryService } from '../../core/services/laboratory.service';
import { Laboratory } from '../../core/models/laboratory.model';
import { LabFormDialogComponent } from './lab-form-dialog.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-laboratories',
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
  templateUrl: './laboratories.component.html',
  styleUrl: './laboratories.component.scss',
})
export default class LaboratoriesComponent implements OnInit, AfterViewInit {
  private readonly service = inject(LaboratoryService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  displayedColumns = ['name', 'pi_name', 'email', 'billing_address', 'actions'];
  dataSource = new MatTableDataSource<Laboratory>();

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
    this.dialog.open(LabFormDialogComponent, { data: null, width: '750px' })
      .afterClosed().subscribe(result => {
        if (result) {
          this.service.create(result).subscribe({
            next: () => { this.snackBar.open('Laboratory added', 'Close', { duration: 3000 }); this.load(); },
            error: (err) => this.snackBar.open(err.error?.error || 'Error', 'Close', { duration: 5000, panelClass: 'error-snackbar' }),
          });
        }
      });
  }

  openEdit(lab: Laboratory) {
    this.dialog.open(LabFormDialogComponent, { data: lab, width: '750px' })
      .afterClosed().subscribe(result => {
        if (result) {
          this.service.update(lab.id, result).subscribe({
            next: () => { this.snackBar.open('Laboratory updated', 'Close', { duration: 3000 }); this.load(); },
            error: (err) => this.snackBar.open(err.error?.error || 'Error', 'Close', { duration: 5000, panelClass: 'error-snackbar' }),
          });
        }
      });
  }

  confirmDelete(lab: Laboratory) {
    this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Laboratory',
        message: `Delete "${lab.name}"? This cannot be undone.`,
        confirmLabel: 'Delete',
        confirmColor: 'warn',
      },
    }).afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.service.delete(lab.id).subscribe({
          next: () => { this.snackBar.open('Laboratory deleted', 'Close', { duration: 3000 }); this.load(); },
          error: (err) => this.snackBar.open(err.error?.error || 'Error', 'Close', { duration: 5000, panelClass: 'error-snackbar' }),
        });
      }
    });
  }
}
