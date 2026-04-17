import { Component, inject, OnInit, ViewChild, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RepositoryService } from '../../core/services/repository.service';
import { LaboratoryService } from '../../core/services/laboratory.service';
import { Antibody } from '../../core/models/antibody.model';
import { Laboratory } from '../../core/models/laboratory.model';
import { QualityLegendComponent } from '../../shared/components/quality-legend/quality-legend.component';

@Component({
  selector: 'app-repository',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatTableModule, MatSortModule, MatPaginatorModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatIconModule, MatButtonModule,
    QualityLegendComponent,
  ],
  templateUrl: './repository.component.html',
  styleUrl: './repository.component.scss',
})
export default class RepositoryComponent implements OnInit, AfterViewInit {
  private readonly repoService = inject(RepositoryService);
  private readonly labService = inject(LaboratoryService);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);

  displayedColumns = ['tube_number', 'antibody_code', 'antigen_target', 'species', 'fluorochrome', 'lab_name'];
  dataSource = new MatTableDataSource<Antibody>();
  labs: Laboratory[] = [];

  searchControl = this.fb.control('');
  labFilter = this.fb.control('');
  qualityFilter = this.fb.control('');

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  ngOnInit() {
    this.labService.getAll().subscribe(labs => { this.labs = labs; this.cdr.detectChanges(); });
    this.load();
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  load() {
    const filters: Record<string, string> = {};
    if (this.labFilter.value) filters['lab_id'] = this.labFilter.value;
    if (this.qualityFilter.value) filters['quality_color'] = this.qualityFilter.value;

    this.repoService.getAll(filters).subscribe(data => {
      this.dataSource.data = data;
      this.cdr.detectChanges();
    });
  }

  applySearch(event: Event) {
    this.dataSource.filter = (event.target as HTMLInputElement).value.trim().toLowerCase();
  }

  applyFilters() {
    this.load();
  }

  clearFilters() {
    this.labFilter.setValue('');
    this.qualityFilter.setValue('');
    this.searchControl.setValue('');
    this.dataSource.filter = '';
    this.load();
  }

}
