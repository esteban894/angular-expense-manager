import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { TransactionService } from './transaction.service';
import { TransactionSummary, TypeAmount } from '../models/transaction.model';

const URL = 'http://localhost:3000/api/v1/transactions';
const emptySummary: TransactionSummary = {
  balance: 0,
  income: 0,
  expense: 0,
  necessary: 0,
  unnecessary: 0,
  counts: {
    [TypeAmount.INCOME]: 0,
    [TypeAmount.EXPENSE_NECESSARY]: 0,
    [TypeAmount.EXPENSE_UNNECESSARY]: 0,
  },
};

describe('TransactionService', () => {
  let service: TransactionService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(TransactionService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('pide la lista sin params al suscribirse', () => {
    service.transactions$.subscribe();
    http.expectOne(URL).flush([]);
  });

  it('setFilters agrega HttpParams y omite vacíos', () => {
    service.transactions$.subscribe();
    http.expectOne(URL).flush([]);
    service.setFilters({ type: TypeAmount.INCOME, search: '  ', from: '2026-10-01' });
    const req = http.expectOne((r) => r.url === URL);
    expect(req.request.params.get('type')).toBe('income');
    expect(req.request.params.has('search')).toBeFalse();
    expect(req.request.params.get('from')).toBe('2026-10-01');
  });

  it('cancela la petición anterior al cambiar filtros (switchMap)', () => {
    service.transactions$.subscribe();
    const first = http.expectOne(URL);
    service.setFilters({ type: TypeAmount.INCOME });
    expect(first.cancelled).toBeTrue();
    http.expectOne((r) => r.params.get('type') === 'income').flush([]);
  });

  it('add refresca lista y resumen', () => {
    service.transactions$.subscribe();
    service.summary$.subscribe();
    http.expectOne(URL).flush([]);
    http.expectOne(`${URL}/summary`).flush(emptySummary);
    service.add({ amount: 1050, typeAmount: TypeAmount.INCOME, description: 'x' }).subscribe();
    http.expectOne({ method: 'POST', url: URL }).flush({ id: 1 });
    http.expectOne(URL);
    http.expectOne(`${URL}/summary`);
  });

  it('matches respeta tipo, búsqueda (case-insensitive) y fechas', () => {
    const t = {
      id: 1,
      description: 'Supermercado',
      typeAmount: TypeAmount.EXPENSE_NECESSARY,
      amount: -100,
      createdAt: '2026-10-05T15:00:00.000Z',
    };
    expect(service.matches(t, { search: 'super' })).toBeTrue();
    expect(service.matches(t, { type: TypeAmount.INCOME })).toBeFalse();
    expect(service.matches(t, { to: '2026-10-04' })).toBeFalse();
  });

  it('error HTTP deja lista vacía y publica mensaje', () => {
    let err = null as string | null;
    service.error$.subscribe((e) => (err = e));
    service.transactions$.subscribe();
    http.expectOne(URL).flush({ message: 'x' }, { status: 500, statusText: 'err' });
    expect(err).toBe('No pudimos cargar tus transacciones. Intenta de nuevo.');
  });
});
