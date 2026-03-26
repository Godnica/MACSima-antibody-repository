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
import { AntibodyService } from '../../core/services/antibody.service';
import { Antibody } from '../../core/models/antibody.model';
import { AntibodyFormDialogComponent } from './antibody-form-dialog.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-inventory',
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
  templateUrl: './inventory.component.html',
  styleUrl: './inventory.component.scss',
})
export default class InventoryComponent implements OnInit, AfterViewInit {
  private readonly service = inject(AntibodyService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  displayedColumns = [
    'tube_number', 'antigen_target', 'clone', 'fluorochrome',
    'lab_name', 'processing', 'status', 'current_volume', 'chf_per_ul', 'actions',
  ];
  dataSource = new MatTableDataSource<Antibody>();

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
    this.service.getAll().subscribe(data => {
      this.dataSource.data = data;
      this.dataSource.sort = this.sort;
      this.dataSource.paginator = this.paginator;
    });
  }

  applyFilter(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.dataSource.filter = value.trim().toLowerCase();
  }

  openAdd() {
    this.dialog.open(AntibodyFormDialogComponent, { data: null, width: '900px', maxHeight: '90vh' })
      .afterClosed().subscribe(result => {
        if (!result) return;
        this.service.create(result).subscribe({
          next: () => { this.snackBar.open('Antibody added', 'Close', { duration: 3000 }); this.load(); },
          error: (err) => this.snackBar.open(err.error?.error || 'Error', 'Close', { duration: 5000, panelClass: 'error-snackbar' }),
        });
      });
  }

  openEdit(ab: Antibody) {
    this.dialog.open(AntibodyFormDialogComponent, { data: ab, width: '900px', maxHeight: '90vh' })
      .afterClosed().subscribe(result => {
        if (!result) return;
        this.service.update(ab.id, result).subscribe({
          next: () => { this.snackBar.open('Antibody updated', 'Close', { duration: 3000 }); this.load(); },
          error: (err) => this.snackBar.open(err.error?.error || 'Error', 'Close', { duration: 5000, panelClass: 'error-snackbar' }),
        });
      });
  }

  confirmDelete(ab: Antibody) {
    this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Antibody',
        message: `Delete tube "${ab.tube_number}" (${ab.antigen_target})? This cannot be undone.`,
        confirmLabel: 'Delete',
        confirmColor: 'warn',
      },
    }).afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.service.delete(ab.id).subscribe({
        next: () => { this.snackBar.open('Antibody deleted', 'Close', { duration: 3000 }); this.load(); },
        error: (err) => this.snackBar.open(err.error?.error || 'Error', 'Close', { duration: 5000, panelClass: 'error-snackbar' }),
      });
    });
  }
}
