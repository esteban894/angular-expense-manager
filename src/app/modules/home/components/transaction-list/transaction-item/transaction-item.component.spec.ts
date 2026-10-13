import { registerLocaleData } from '@angular/common';
import localeEsAr from '@angular/common/locales/es-AR';
import { LOCALE_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Transaction, TypeAmount } from 'src/app/models/transaction.model';
import { TransactionItemComponent } from './transaction-item.component';

registerLocaleData(localeEsAr);

describe('TransactionItemComponent', () => {
  let fixture: ComponentFixture<TransactionItemComponent>;
  const tx: Transaction = {
    id: 7,
    description: 'Supermercado con una descripción bastante larga',
    typeAmount: TypeAmount.EXPENSE_NECESSARY,
    amount: -105000,
    createdAt: '2026-10-13T15:00:00',
  };
  const el = () => fixture.nativeElement as HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TransactionItemComponent],
      providers: [{ provide: LOCALE_ID, useValue: 'es-AR' }],
    });
    fixture = TestBed.createComponent(TransactionItemComponent);
    fixture.componentInstance.transaction = tx;
    fixture.detectChanges();
  });

  it('descripción completa en title con truncate', () => {
    const t = el().querySelector('[data-testid=desc]') as HTMLElement;
    expect(t.getAttribute('title')).toBe(tx.description);
    expect(t.classList).toContain('truncate');
  });

  it('monto con signo', () => {
    expect(el().querySelector('[data-testid=amount]')!.textContent!.replace(/\s/g, ' ').trim()).toBe('− $ 1.050,00');
  });

  it('sub-label con tipo y fecha "13 oct" sin punto', () => {
    expect(el().querySelector('[data-testid=sub]')!.textContent!.trim()).toBe('Gasto necesario · 13 oct');
  });

  it('botón eliminar con aria-label y emite delete', () => {
    const spy = jasmine.createSpy('delete');
    fixture.componentInstance.delete.subscribe(spy);
    const b = el().querySelector('button') as HTMLButtonElement;
    expect(b.getAttribute('aria-label')).toBe(`Eliminar ${tx.description}`);
    b.click();
    expect(spy).toHaveBeenCalledWith(tx);
  });
});
