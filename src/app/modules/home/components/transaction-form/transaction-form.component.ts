import { HttpErrorResponse } from '@angular/common/http';
import { Component, ElementRef, ViewChild } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { take } from 'rxjs';
import { Transaction, TypeAmount } from 'src/app/models/transaction.model';
import { ToastService } from 'src/app/services/toast.service';
import { TransactionService } from 'src/app/services/transaction.service';
import {
  MAX_AMOUNT_CENTS,
  formatCents,
  parseMoneyToCents,
} from 'src/app/utils/money';

export function moneyValidator(
  control: AbstractControl
): ValidationErrors | null {
  const raw = String(control.value ?? '').trim();
  if (!raw) return { required: true };
  const compact = raw.replace(/[\s$]/g, '');
  if (/,\d{3,}$/.test(compact)) return { decimals: true };
  const cents = parseMoneyToCents(raw);
  if (cents === null) return { format: true };
  if (cents <= 0) return { min: true };
  if (cents > MAX_AMOUNT_CENTS) return { max: true };
  return null;
}

const TYPE_LABELS: Record<TypeAmount, string> = {
  [TypeAmount.INCOME]: 'Ingreso',
  [TypeAmount.EXPENSE_NECESSARY]: 'Gasto necesario',
  [TypeAmount.EXPENSE_UNNECESSARY]: 'Gasto innecesario',
};

const SUBMIT_LABELS: Record<TypeAmount, string> = {
  [TypeAmount.INCOME]: 'Agregar ingreso',
  [TypeAmount.EXPENSE_NECESSARY]: 'Agregar gasto necesario',
  [TypeAmount.EXPENSE_UNNECESSARY]: 'Agregar gasto innecesario',
};

const FALLBACK_ERROR = 'No pudimos guardar la transacción. Intenta de nuevo.';

@Component({
  selector: 'app-transaction-form',
  templateUrl: './transaction-form.component.html',
})
export class TransactionFormComponent {
  @ViewChild('descInput') descInput?: ElementRef<HTMLInputElement>;

  readonly types = [
    { id: 't-inc', value: TypeAmount.INCOME, label: TYPE_LABELS[TypeAmount.INCOME], tone: 'inc' },
    { id: 't-nec', value: TypeAmount.EXPENSE_NECESSARY, label: TYPE_LABELS[TypeAmount.EXPENSE_NECESSARY], tone: 'nec' },
    { id: 't-unn', value: TypeAmount.EXPENSE_UNNECESSARY, label: TYPE_LABELS[TypeAmount.EXPENSE_UNNECESSARY], tone: 'unn' },
  ];
  readonly maxMessage = `El monto máximo es ${formatCents(MAX_AMOUNT_CENTS)}`;

  form: FormGroup;
  submitted = false;
  pending = false;
  apiError: string | null = null;

  constructor(
    private transactionService: TransactionService,
    private toast: ToastService,
    private fb: FormBuilder
  ) {
    this.form = this.fb.group({
      typeAmount: [null as TypeAmount | null, [Validators.required]],
      description: ['', [Validators.required, Validators.pattern(/\S/)]],
      amount: ['', [moneyValidator]],
    });
  }

  get typeField() {
    return this.form.get('typeAmount')!;
  }
  get descriptionField() {
    return this.form.get('description')!;
  }
  get amountField() {
    return this.form.get('amount')!;
  }

  get submitLabel(): string {
    if (this.pending) return 'Agregando…';
    const t = this.typeField.value as TypeAmount | null;
    return t ? SUBMIT_LABELS[t] : 'Agregar transacción';
  }

  showError(c: AbstractControl): boolean {
    return c.invalid && ((c.touched && c.dirty) || this.submitted);
  }

  onSubmit(event?: Event) {
    event?.preventDefault();
    if (this.pending) return;
    this.submitted = true;
    this.apiError = null;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const typeAmount = this.typeField.value as TypeAmount;
    const amount = parseMoneyToCents(String(this.amountField.value))!;
    const description = String(this.descriptionField.value).trim();

    this.pending = true;
    this.transactionService
      .add({ amount, typeAmount, description })
      .subscribe({
        next: (created) => {
          this.pending = false;
          this.submitted = false;
          this.form.reset({ typeAmount, description: '', amount: '' });
          this.descInput?.nativeElement.focus();
          this.notify(created, typeAmount, amount);
        },
        error: (err: HttpErrorResponse) => {
          this.pending = false;
          this.apiError = this.messageFrom(err);
        },
      });
  }

  private notify(created: Transaction, typeAmount: TypeAmount, amount: number) {
    this.transactionService.filters$.pipe(take(1)).subscribe((filters) => {
      if (!this.transactionService.matches(created, filters)) {
        this.toast.show('Agregado. No coincide con los filtros activos', {
          label: 'Ver todo',
          run: () => this.transactionService.clearFilters(),
        });
      } else {
        this.toast.show(`${TYPE_LABELS[typeAmount]} agregado: ${formatCents(amount)}`);
      }
    });
  }

  private messageFrom(err: HttpErrorResponse): string {
    // Nunca se muestra el texto crudo del backend (en inglés y técnico).
    if (err?.status === 401) return 'Tu sesión expiró. Vuelve a iniciar sesión.';
    if (err?.status === 400) return 'Revisa los datos ingresados.';
    return FALLBACK_ERROR;
  }
}
