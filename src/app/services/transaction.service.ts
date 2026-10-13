import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  catchError,
  EMPTY,
  combineLatest,
  map,
  of,
  shareReplay,
  switchMap,
  tap,
} from 'rxjs';
import { environment } from 'src/environments/environment';
import {
  Transaction,
  TransactionFilters,
  TransactionSummary,
} from '../models/transaction.model';
import { AddTransactionDto } from '../models/add-transaction.dto';

const FILTER_KEYS: (keyof TransactionFilters)[] = ['type', 'search', 'from', 'to'];

function clean(f: TransactionFilters): TransactionFilters {
  const out: Record<string, string> = {};
  for (const key of FILTER_KEYS) {
    const value = f[key];
    if (typeof value !== 'string') continue;
    const trimmed = value.trim();
    if (trimmed) out[key] = trimmed;
  }
  return out as TransactionFilters;
}

function toParams(f: TransactionFilters): HttpParams {
  let params = new HttpParams();
  const c = clean(f);
  for (const key of FILTER_KEYS) {
    const value = c[key];
    if (value) params = params.set(key, value);
  }
  return params;
}

function toLocalDateKey(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

@Injectable({
  providedIn: 'root',
})
export class TransactionService {
  private readonly url = `${environment.url}/transactions`;

  private filtersSubject = new BehaviorSubject<TransactionFilters>({});
  private refresh$ = new BehaviorSubject<void>(undefined);
  private loadingSubject = new BehaviorSubject(false);
  private errorSubject = new BehaviorSubject<string | null>(null);

  readonly filters$ = this.filtersSubject.asObservable();
  readonly loading$ = this.loadingSubject.asObservable();
  readonly error$ = this.errorSubject.asObservable();

  readonly transactions$: Observable<Transaction[]> = combineLatest([
    this.filtersSubject,
    this.refresh$,
  ]).pipe(
    tap(() => {
      this.loadingSubject.next(true);
      this.errorSubject.next(null);
    }),
    switchMap(([f]) =>
      this.http
        .get<Transaction[]>(this.url, { params: toParams(f) })
        .pipe(
          catchError(() => {
            this.errorSubject.next(
              'No pudimos cargar tus transacciones. Intenta de nuevo.'
            );
            return of([] as Transaction[]);
          })
        )
    ),
    tap(() => this.loadingSubject.next(false)),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  readonly summary$: Observable<TransactionSummary> = this.refresh$.pipe(
    switchMap(() =>
      this.http.get<TransactionSummary>(`${this.url}/summary`).pipe(
        catchError(() => {
          this.errorSubject.next(
            'No pudimos cargar tu resumen. Intenta de nuevo.'
          );
          return EMPTY;
        })
      )
    ),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  constructor(private http: HttpClient) {}

  setFilters(patch: Partial<TransactionFilters>): void {
    this.filtersSubject.next(clean({ ...this.filtersSubject.value, ...patch }));
  }

  clearFilters(): void {
    this.filtersSubject.next({});
  }

  reload(): void {
    this.refresh$.next();
  }

  add(dto: AddTransactionDto): Observable<Transaction> {
    return this.http
      .post<Transaction>(this.url, dto)
      .pipe(tap(() => this.refresh$.next()));
  }

  remove(id: number): Observable<void> {
    return this.http.delete(`${this.url}/${id}`).pipe(
      tap(() => this.refresh$.next()),
      map(() => undefined)
    );
  }

  restore(id: number): Observable<Transaction> {
    return this.http
      .patch<Transaction>(`${this.url}/${id}/restore`, {})
      .pipe(tap(() => this.refresh$.next()));
  }

  matches(t: Transaction, f: TransactionFilters): boolean {
    const c = clean(f);
    if (c.type && t.typeAmount !== c.type) return false;
    if (c.search && !t.description.toLowerCase().includes(c.search.toLowerCase()))
      return false;
    const day = toLocalDateKey(new Date(t.createdAt));
    if (c.from && day < c.from) return false;
    if (c.to && day > c.to) return false;
    return true;
  }
}
