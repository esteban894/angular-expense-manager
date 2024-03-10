import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Transaction } from '../models/transaction.model';
import { AddTransactionDto } from '../models/add-transaction.dto';

@Injectable({
  providedIn: 'root',
})
export class TransactionService {
  private initialState: { transactions: Transaction[] } = { transactions: [] };
  private url: string;

  private stateSubject = new BehaviorSubject<any>(this.initialState);
  state$ = this.stateSubject.asObservable();

  constructor(private http: HttpClient) {
    this.url = environment.url;
  }

  init() {
    this.http
      .get<Transaction[]>(`${this.url}/transactions`)
      .subscribe((transactions) => {
        const initialState = { transactions };
        this.stateSubject.next(initialState);
      });
  }

  addTransaction(transaction: AddTransactionDto) {
    this.http
      .post<Transaction>(`${this.url}/transactions`, transaction)
      .subscribe((transaction) => {
        const currentState = this.stateSubject.value;
        const updatedState = {
          ...currentState,
          transactions: [...currentState.transactions, transaction],
        };
        this.stateSubject.next(updatedState);
      });
  }

  getTransactions() {
    return this.http
      .get<Transaction[]>(`${this.url}/transactions`)
      .subscribe((transactions) => {
        this.stateSubject.next({ transactions });
      });
  }

  deleteTransaction(id: number) {
    this.http.delete(`${this.url}/transactions/${id}`).subscribe(() => {
      this.getTransactions();
    });
  }
}
