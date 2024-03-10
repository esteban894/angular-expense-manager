import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { BalanceComponent } from './components/balance/balance.component';
import { IncomeExpenseComponent } from './components/income-expense/income-expense.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { TransactionFormComponent } from './components/transaction-form/transaction-form.component';
import { TransactionItemComponent } from './components/transaction-list/transaction-item/transaction-item.component';
import { TransactionListComponent } from './components/transaction-list/transaction-list.component';
import { HomeRoutingModule } from './home-routing.module';
import { HomeComponent } from './pages/home.component';

@NgModule({
  declarations: [
    HomeComponent,
    BalanceComponent,
    IncomeExpenseComponent,
    NavbarComponent,
    TransactionFormComponent,
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
