import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TypeAmount } from 'src/app/models/transaction.model';
import { parseMoneyToCents } from 'src/app/utils/money';
import { TransactionService } from 'src/app/services/transaction.service';

@Component({
  selector: 'app-transaction-form',
  templateUrl: './transaction-form.component.html',
  styles: [``],
})
export class TransactionFormComponent {
  form: FormGroup;

  constructor(
    private transactionService: TransactionService,
    private fb: FormBuilder
  ) {
    this.form = this.fb.group({
      description: ['', [Validators.required]],
      amount: ['', [Validators.required, Validators.min(0.1)]],
      transactionType: ['', [Validators.required]],
    });
  }

  onSubmit(event: Event) {
    event.preventDefault();

    if (this.form.valid) {
      const cents = parseMoneyToCents(String(this.amountField!.value));
      if (cents === null) {
        this.amountField!.setErrors({ min: true });
        this.form.markAllAsTouched();
        return;
      }

      this.transactionService
        .add({
          amount: cents,
          typeAmount: this.transactionTypeField?.value as TypeAmount,
          description: this.descriptionField?.value as string,
        })
        .subscribe();

      this.form.reset();
    } else {
      this.form.markAllAsTouched();
    }
  }

  get amountField() {
    return this.form.get('amount');
  }

  get descriptionField() {
    return this.form.get('description');
  }

  get transactionTypeField() {
    return this.form.get('transactionType');
  }
}
