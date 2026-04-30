import { Component, inject, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TemplateService } from '../../core/services/template.service';
import { ExperimentTemplate } from '../../core/models/template.model';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { InstantiateTemplateDialogComponent, TemplateFormDialogComponent } from './template-dialogs.component';

@Component({
  selector: 'app-templates',
  standalone: true,
  imports: [
    CommonModule, MatTableModule, MatSortModule, MatPaginatorModule,
    MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule,
    MatDialogModule, MatSnackBarModule,
  ],
  templateUrl: './templates.component.html',
  styleUrl: './templates.component.scss',
})
export default class TemplatesComponent implements OnInit, AfterViewInit {
  private readonly service = inject(TemplateService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  displayedColumns = ['name', 'requesting_lab_name', 'experiment_type', 'antibody_count', 'created_at', 'actions'];
  dataSource = new MatTableDataSource<ExperimentTemplate>();

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  ngOnInit() { this.load(); }
  ngAfterViewInit() { this.dataSource.sort = this.sort; this.dataSource.paginator = this.paginator; }

  load() { this.service.getAll().subscribe(data => this.dataSource.data = data); }

  applyFilter(event: Event) {
    this.dataSource.filter = (event.target as HTMLInputElement).value.trim().toLowerCase();
  }

  openNew() {
    this.dialog.open(TemplateFormDialogComponent, { data: null, width: '750px' })
      .afterClosed().subscribe(result => {
        if (!result) return;
        this.service.create(result).subscribe({
          next: (tpl) => this.router.navigate(['/templates', tpl.id]),
          error: (err) => this.snackBar.open(err.error?.error || 'Error', 'Close', { duration: 5000, panelClass: 'error-snackbar' }),
        });
      });
  }

  useTemplate(template: ExperimentTemplate, event?: Event) {
    event?.stopPropagation();
    this.dialog.open(InstantiateTemplateDialogComponent, { data: template, width: '750px' })
      .afterClosed().subscribe(result => {
        if (!result) return;
        this.service.instantiate(template.id, result).subscribe({
          next: (exp) => this.router.navigate(['/experiments', exp.id]),
          error: (err) => this.snackBar.open(err.error?.error || 'Error', 'Close', { duration: 5000, panelClass: 'error-snackbar' }),
        });
      });
  }

  deleteTemplate(template: ExperimentTemplate, event: Event) {
    event.stopPropagation();
    this.dialog.open(ConfirmDialogComponent, {
      width: '480px',
      data: {
        title: 'Delete Template',
        message: `Delete template "${template.name}"? This cannot be undone.`,
        confirmLabel: 'Delete',
        confirmColor: 'warn',
      },
    }).afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.service.delete(template.id).subscribe({
        next: () => {
          this.snackBar.open('Template deleted', 'Close', { duration: 3000 });
          this.load();
        },
        error: (err) => this.snackBar.open(err.error?.error || 'Error', 'Close', { duration: 5000, panelClass: 'error-snackbar' }),
      });
    });
  }

  goToDetail(row: ExperimentTemplate) {
    this.router.navigate(['/templates', row.id]);
  }
}
