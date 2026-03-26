import { Component, inject, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ExperimentService } from '../../core/services/experiment.service';
import { AntibodyService } from '../../core/services/antibody.service';
import { Experiment } from '../../core/models/experiment.model';
import { ExperimentFormDialogComponent } from './experiment-form-dialog.component';

interface AntibodyCombination {
  antigen_target: string;
  clone: string;
}

@Component({
  selector: 'app-experiments',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatTableModule, MatSortModule, MatPaginatorModule,
    MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatAutocompleteModule, MatDialogModule, MatSnackBarModule,
  ],
  templateUrl: './experiments.component.html',
  styleUrl: './experiments.component.scss',
})
export default class ExperimentsComponent implements OnInit, AfterViewInit {
  private readonly service = inject(ExperimentService);
  private readonly antibodyService = inject(AntibodyService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);

  displayedColumns = ['name', 'date', 'requesting_lab_name', 'experiment_type', 'status', 'macswell_slides', 'total_cocktail_volume'];
  dataSource = new MatTableDataSource<Experiment>();

  antibodyFilterControl = this.fb.control('');
  allCombinations: AntibodyCombination[] = [];
  filteredCombinations: AntibodyCombination[] = [];
  selectedCombination: AntibodyCombination | null = null;

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  ngOnInit() {
    this.load();
    this.antibodyService.getCombinations().subscribe(combos => {
      this.allCombinations = combos;
      this.filteredCombinations = combos;
    });
    this.antibodyFilterControl.valueChanges.pipe(
      debounceTime(200), distinctUntilChanged()
    ).subscribe(val => {
      if (typeof val === 'string') {
        const q = val.toLowerCase();
        this.filteredCombinations = this.allCombinations.filter(c =>
          !q || c.antigen_target.toLowerCase().includes(q) || c.clone.toLowerCase().includes(q)
        );
        if (!val.trim()) {
          this.selectedCombination = null;
          this.load();
        }
      }
    });
  }
  ngAfterViewInit() { this.dataSource.sort = this.sort; this.dataSource.paginator = this.paginator; }

  load() { this.service.getAll().subscribe(data => this.dataSource.data = data); }

  selectCombination(combo: AntibodyCombination) {
    this.selectedCombination = combo;
    this.service.getAll({ antigen_target: combo.antigen_target, clone: combo.clone }).subscribe(
      data => this.dataSource.data = data
    );
  }

  displayCombination(combo: AntibodyCombination | string): string {
    if (typeof combo === 'string') return combo;
    return combo ? `${combo.antigen_target} · ${combo.clone}` : '';
  }

  clearFilter() {
    this.antibodyFilterControl.setValue('');
    this.selectedCombination = null;
    this.load();
  }

  applyFilter(event: Event) {
    this.dataSource.filter = (event.target as HTMLInputElement).value.trim().toLowerCase();
  }

  openNew() {
    this.dialog.open(ExperimentFormDialogComponent, { data: null, width: '750px' })
      .afterClosed().subscribe(result => {
        if (!result) return;
        this.service.create(result).subscribe({
          next: (exp) => { console.log("navigating to experiment " + exp.id); this.router.navigate(['/experiments', exp.id]); },
          error: (err) => this.snackBar.open(err.error?.error || 'Error', 'Close', { duration: 5000, panelClass: 'error-snackbar' }),
        });
      });
  }

  goToDetail(row: Experiment) {
    console.log("navigating to experiment " + row.id);
    this.router.navigate(['/experiments', row.id]);
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      planning: 'Planning',
      executed_not_billed: 'Executed – Not Billed',
      executed_billed: 'Executed – Billed',
    };
    return map[status] ?? status;
  }

  statusColor(status: string): string {
    const map: Record<string, string> = {
      planning: '',
      executed_not_billed: 'primary',
      executed_billed: 'accent',
    };
    return map[status] ?? '';
  }
}
