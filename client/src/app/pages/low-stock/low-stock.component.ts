import { Component, inject, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { AntibodyService } from '../../core/services/antibody.service';
import { Antibody } from '../../core/models/antibody.model';

@Component({
  selector: 'app-low-stock',
  standalone: true,
  imports: [
    CommonModule, MatTableModule, MatSortModule, MatPaginatorModule,
    MatFormFieldModule, MatInputModule, MatIconModule,
  ],
  templateUrl: './low-stock.component.html',
  styleUrl: './low-stock.component.scss',
})
export default class LowStockComponent implements OnInit, AfterViewInit {
  private readonly antibodyService = inject(AntibodyService);

  displayedColumns = ['tube_number', 'antigen_target', 'clone', 'lab_name', 'current_volume', 'company', 'order_number'];
  dataSource = new MatTableDataSource<Antibody>();

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  ngOnInit() { this.load(); }
  ngAfterViewInit() { this.dataSource.sort = this.sort; this.dataSource.paginator = this.paginator; }

  load() {
    this.antibodyService.getLowStock().subscribe(data => this.dataSource.data = data);
  }

  applyFilter(event: Event) {
    this.dataSource.filter = (event.target as HTMLInputElement).value.trim().toLowerCase();
  }
}
