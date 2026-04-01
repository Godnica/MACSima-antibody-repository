import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../core/services/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  adminOnly: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Inventory',    icon: 'science',       route: '/inventory',    adminOnly: true  },
  { label: 'Experiments',  icon: 'biotech',        route: '/experiments',  adminOnly: true  },
  { label: 'Low Stock',    icon: 'warning',        route: '/low-stock',    adminOnly: true  },
  { label: 'Billing',      icon: 'receipt_long',   route: '/billing',      adminOnly: true  },
  { label: 'Laboratories', icon: 'business',       route: '/laboratories', adminOnly: true  },
  { label: 'User Management', icon: 'group',     route: '/admin/users',  adminOnly: true  },
  { label: 'Repository',   icon: 'search',         route: '/repository',   adminOnly: false },
  { label: 'Contacts',     icon: 'contact_mail',   route: '/contacts',     adminOnly: false },
];

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss',
})
export default class MainLayoutComponent {
  readonly authService = inject(AuthService);

  get navItems(): NavItem[] {
    if (this.authService.isAdmin()) {
      return NAV_ITEMS;
    }
    return NAV_ITEMS.filter(item => !item.adminOnly);
  }

  logout() {
    this.authService.logout();
  }
}
