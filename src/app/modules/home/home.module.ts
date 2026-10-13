import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { SummaryCardComponent } from './components/summary-card/summary-card.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { TransactionFormComponent } from './components/transaction-form/transaction-form.component';
import { TransactionFiltersComponent } from './components/transaction-filters/transaction-filters.component';
import { TransactionItemComponent } from './components/transaction-list/transaction-item/transaction-item.component';
import { TransactionListComponent } from './components/transaction-list/transaction-list.component';
import { HomeRoutingModule } from './home-routing.module';
import { HomeComponent } from './pages/home.component';

@NgModule({
  declarations: [
    HomeComponent,
    NavbarComponent,
    SummaryCardComponent,
    TransactionFormComponent,
    TransactionFiltersComponent,
    TransactionItemComponent,
    TransactionListComponent,
  ],
  imports: [
    CommonModule,
    HomeRoutingModule,
    ReactiveFormsModule,
    HttpClientModule,
  ],
  exports: [NavbarComponent],
})
export class HomeModule {}
