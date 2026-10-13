import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { TransactionService } from 'src/app/services/transaction.service';
import { SummaryCardComponent } from './summary-card.component';

const base = { balance: 0, income: 0, expense: 0, necessary: 0, unnecessary: 0, counts: {} };

describe('SummaryCardComponent', () => {
  let fixture: ComponentFixture<SummaryCardComponent>;

  function setup(summary: any) {
    TestBed.configureTestingModule({
      declarations: [SummaryCardComponent],
      providers: [{ provide: TransactionService, useValue: { summary$: of({ ...base, ...summary }) } }],
    });
    fixture = TestBed.createComponent(SummaryCardComponent);
    fixture.detectChanges();
  }
  const q = (id: string) => fixture.nativeElement.querySelector(`[data-testid=${id}]`);
  const norm = (s: string) => s.replace(/\s/g, ' ').trim();

  it('muestra el saldo formateado', () => {
    setup({ balance: 42540000, income: 103000000, expense: 60460000, necessary: 47930000, unnecessary: 12530000 });
    expect(norm(q('balance').textContent)).toBe('$ 425.400,00');
  });

  it('calcula el ancho de la barra', () => {
    setup({ balance: 42540000, income: 103000000, expense: 60460000, necessary: 47930000, unnecessary: 12530000 });
    expect(q('bar-nec').style.width).toBe('79%');
    expect(q('bar-unn').style.width).toBe('21%');
  });

  it('muestra el insight de ahorro', () => {
    setup({ balance: 42540000, income: 103000000, expense: 60460000, necessary: 47930000, unnecessary: 12530000 });
    expect(norm(q('insight').textContent)).toContain('Si evitaras los gastos innecesarios, tu saldo sería $ 550.700,00');
  });

  it('sin gastos muestra mensaje vacío y barra 0%', () => {
    setup({});
    expect(q('insight').textContent).toContain('Todavía no registraste gastos');
    expect(q('bar-nec').style.width).toBe('0%');
    expect(q('bar-unn').style.width).toBe('0%');
  });

  it('saldo negativo usa text-unn', () => {
    setup({ balance: -1000, expense: 1000, necessary: 1000 });
    expect(q('balance').classList).toContain('text-unn');
  });
});
