# Rediseño "Cuentas Claras" + filtros del historial vía API — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Llevar al código el rediseño aprobado en la demo (https://claude.ai/artifact/Kjvy4x3A6L3cSA8hVkwAf5) y mover el filtrado del historial al backend (`GET /transactions?type&search&from&to`), con montos en pesos y centavos guardados como enteros en centavos.

**Architecture:** Dos repos hermanos. `nest-expense-manager` (NestJS 10 + TypeORM + MySQL) gana: query DTO de filtros, endpoint `summary`, endpoint `restore`, montos en centavos con signo derivado del tipo y verificación de dueño en `:id`. `angular-expense-manager` (Angular 16 NgModules + Tailwind 3) pasa a un `TransactionService` reactivo (filtros → `switchMap` → HTTP), utilidades de dinero en centavos y componentes rediseñados con tokens CSS (tema claro/oscuro).

**Tech Stack:** NestJS 10, TypeORM 0.3.20, class-validator 0.14, Jest 29 · Angular 16.2, RxJS 7.8, Reactive Forms, Tailwind 3.4, Karma/Jasmine.

**Spec:** la demo publicada (fuente de verdad visual, guardar copia en `docs/design/cuentas-claras-demo.html` del repo Angular) + respuestas del usuario en esta sesión.

## Context

El proyecto se va a presentar en un portfolio. La UI actual tiene errores visibles (registro dice "Inicia sesión", errores con `absolute top-16` tapan campos, "x" borra sin aviso, `parseInt` descarta centavos) y no muestra lo que diferencia la app: gasto necesario vs. innecesario. El usuario aprobó la demo y pidió además que **el filtrado del historial se haga con peticiones a la API**, con **tipo + búsqueda + rango de fechas**, que **el usuario vea y cargue pesos con centavos pero la base guarde centavos enteros** ($10,50 → 1050) y que **deshacer** use un endpoint `restore`.

## Global Constraints

- Montos: la API **recibe y devuelve centavos enteros** (`amount: number`, int). Conversión pesos↔centavos solo en el front (`src/app/utils/money.ts`). Nunca usar float para sumar.
- Signo: el backend normaliza `amount` según `typeAmount` (income > 0, expense_* < 0); el front envía siempre el valor absoluto en centavos.
- Monto máximo por transacción: **`2_000_000_000` centavos** ($ 20.000.000,00), por debajo del máximo de la columna INT de MySQL (2.147.483.647). Validar en DTO (`@Max`) y en el front con el mismo mensaje.
- Filtros: `type ∈ {income, expense_necessary, expense_unnecessary}`, `search` 1–80 chars, `from`/`to` formato `YYYY-MM-DD`, ambos inclusivos, `from <= to`.
- Copia en español con tuteo ("Inicia sesión", "Escribe tu email"), igual que la demo.
- Formato de moneda: `Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' })` con 2 decimales siempre.
- Mantener NgModules (no migrar a standalone). Mantener rutas `/login`, `/register`, `/app`.
- Ramas: `feat/transaction-filters` en el backend, `feat/ui-redesign` en el front. Commits pequeños por tarea.

## Review Focus

1. **Montos con formato local ambiguo** ("1.500" = mil quinientos, "10.50" = diez con cincuenta, "1.500,25") → `parseMoneyToCents` debe resolverlos según la regla de Task 7 y rechazar >2 decimales. Test en Task 7.
2. **Búsqueda con `%` o `_`** ("50%") → debe buscar el literal, no comodín. Test en Task 2.
3. **Rango de fechas con `to` = hoy** → incluye transacciones creadas hoy hasta 23:59:59. Test en Task 2.
4. **Usuario A borra/restaura/lee `:id` de usuario B** → 404, no efecto. Test en Task 4.
5. **Filtros activos + alta de transacción que no coincide** → la lista no la muestra, pero el resumen sí se actualiza y aparece aviso "Agregado. No coincide con los filtros activos". Test en Task 8.

---

## Mapa de archivos

### Backend (`/home/esteban894/proyectos/nest-expense-manager`)
| Archivo | Acción | Responsabilidad |
|---|---|---|
| `package.json` (jest) | Modificar | `moduleNameMapper` para imports `src/...` |
| `src/transactions/dto/create-transaction.dto.ts` | Modificar | `@IsEnum`, `@IsInt`, `@Min(1)`, `@Max(2e9)` |
| `src/transactions/dto/find-transactions-query.dto.ts` | Crear | Filtros validados |
| `src/transactions/transactions.service.ts` | Modificar | `findAll(user, query)`, `summary`, `restore`, ownership, signo |
| `src/transactions/transactions.controller.ts` | Modificar | `@Query()`, `GET summary`, `PATCH :id/restore`, `ParseIntPipe` |
| `src/transactions/transactions.service.spec.ts` | Crear | Unit tests con repo/QueryBuilder mockeados |
| `test/transactions.e2e-spec.ts` | Crear | (opcional, si hay MySQL de test) |
| `scripts/2026-10-amount-to-cents.sql` | Crear | Migra datos existentes ×100 |
| `src/seed/seed-demo.ts` + script `seed:demo` | Crear | Usuario demo + transacciones de ejemplo |
| `README.md` | Modificar | Documentar filtros, centavos, seed |

### Frontend (`/home/esteban894/proyectos/angular-expense-manager`)
| Archivo | Acción | Responsabilidad |
|---|---|---|
| `src/index.html`, `src/styles.scss`, `tailwind.config.js` | Modificar | Fuentes, tokens CSS claro/oscuro, colores Tailwind por variable |
| `src/app/utils/money.ts` (+ spec) | Crear | `parseMoneyToCents`, `formatCents` |
| `src/app/models/transaction.model.ts` | Modificar | `createdAt`, `TransactionFilters`, `TransactionSummary` |
| `src/app/models/add-transaction.dto.ts` | Modificar | `amount` = centavos absolutos |
| `src/app/services/transaction.service.ts` (+ spec) | Reescribir | Estado reactivo con filtros vía HttpParams |
| `src/app/services/toast.service.ts` + `shared/toast/` | Crear | Aviso con acción "Deshacer" |
| `src/app/services/theme.service.ts` | Crear | sistema/claro/oscuro en `localStorage` |
| `modules/home/components/summary-card/` | Crear | Saldo, ingresos/gastos, barra necesario/innecesario, insight |
| `modules/home/components/balance/`, `income-expense/` | Eliminar | Reemplazados por `summary-card` |
| `modules/home/components/transaction-form/` | Reescribir | Radios reales, centavos, errores inline |
| `modules/home/components/transaction-filters/` | Crear | Chips tipo, búsqueda (debounce), fechas, limpiar |
| `modules/home/components/transaction-list/` (+ item) | Reescribir | Loading, vacíos, ítems con fecha, eliminar |
| `modules/home/components/navbar/` | Reescribir | Marca, avatar, email, tema, cerrar sesión |
| `modules/home/pages/home.component.*` | Reescribir | Layout 2 columnas |
| `modules/auth/auth-layout/` | Crear | Panel lateral de marca + pestañas |
| `modules/auth/login/`, `register/` | Reescribir | Textos, mostrar contraseña, loading, demo |
| `src/environments/environment.ts` | Modificar | `demo: { email, password }` |

---

## Parte A — Backend

### Task 1: Montos en centavos y validación estricta del DTO

**Files:**
- Modify: `package.json` (bloque `jest`), `src/transactions/dto/create-transaction.dto.ts`, `src/transactions/transactions.service.ts` (`create`)
- Create: `src/transactions/transactions.service.spec.ts`, `scripts/2026-10-amount-to-cents.sql`

**Interfaces:**
- Produces: `CreateTransactionDto { amount: number /* centavos >0 */; description: string; typeAmount: TypeAmount }`; `TransactionsService.create(dto, user)` guarda `amount` con signo según tipo.

- [ ] **Step 1: Arreglar resolución de `src/...` en Jest.** En `package.json` → `jest` agregar:
```json
"moduleNameMapper": { "^src/(.*)$": "<rootDir>/$1" }
```
- [ ] **Step 2: Test que falla** — `src/transactions/transactions.service.spec.ts`:
```ts
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TransactionsService } from './transactions.service';
import { Transaction } from './entities/transaction.entity';
import { TypeAmount } from './models/typeAmount.model';

const user = { email: 'ana@test.com', role: 'user' };

export function createQbMock(result: unknown[] = []) {
  const qb: any = {};
  ['where', 'andWhere', 'orderBy', 'select', 'addSelect', 'groupBy'].forEach(
    (m) => (qb[m] = jest.fn().mockReturnValue(qb)),
  );
  qb.getMany = jest.fn().mockResolvedValue(result);
  qb.getRawMany = jest.fn().mockResolvedValue(result);
  return qb;
}

describe('TransactionsService', () => {
  let service: TransactionsService;
  let repo: Record<string, jest.Mock>;
  let qb: any;

  beforeEach(async () => {
    qb = createQbMock();
    repo = {
      save: jest.fn((x) => Promise.resolve({ id: 1, ...x })),
      findOne: jest.fn(),
      softDelete: jest.fn(),
      restore: jest.fn(),
      update: jest.fn(),
      createQueryBuilder: jest.fn(() => qb),
    };
    const mod = await Test.createTestingModule({
      providers: [
        TransactionsService,
        { provide: getRepositoryToken(Transaction), useValue: repo },
      ],
    }).compile();
    service = mod.get(TransactionsService);
  });

  describe('create', () => {
    it('guarda ingresos en positivo', async () => {
      await service.create({ amount: 1050, description: 'Sueldo', typeAmount: TypeAmount.INCOME }, user);
      expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ amount: 1050, userEmail: user.email }));
    });
    it('guarda gastos en negativo aunque llegue positivo', async () => {
      await service.create({ amount: 1050, description: 'Luz', typeAmount: TypeAmount.EXPENSE_NECESSARY }, user);
      expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ amount: -1050 }));
    });
  });
});
```
- [ ] **Step 3: Correr** `npx jest src/transactions/transactions.service.spec.ts` → FAIL (gasto se guarda en +1050).
- [ ] **Step 4: Implementar.** DTO:
```ts
import { IsEnum, IsInt, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { TypeAmount } from '../models/typeAmount.model';

export const MAX_AMOUNT_CENTS = 2_000_000_000;

export class CreateTransactionDto {
  /** Monto en centavos, siempre positivo. El signo lo define typeAmount. */
  @IsInt()
  @Min(1)
  @Max(MAX_AMOUNT_CENTS)
  amount: number;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  description: string;

  @IsEnum(TypeAmount)
  typeAmount: TypeAmount;
}
```
Service:
```ts
export const signedAmount = (amount: number, type: TypeAmount) =>
  type === TypeAmount.INCOME ? Math.abs(amount) : -Math.abs(amount);

async create(dto: CreateTransactionDto, user: userActiveInterface) {
  return await this.transactionRepository.save({
    ...dto,
    amount: signedAmount(dto.amount, dto.typeAmount),
    userEmail: user.email,
  });
}
```
`update`: si el DTO trae `amount` o `typeAmount`, recalcular con `signedAmount` usando el tipo resultante (el actual si no viene).
- [ ] **Step 5: Script de datos** `scripts/2026-10-amount-to-cents.sql`:
```sql
-- Ejecutar UNA sola vez sobre una base con montos en pesos enteros.
UPDATE `transaction` SET amount = amount * 100;
```
- [ ] **Step 6:** `npx jest` → PASS. Commit `feat(transactions): store amounts as signed cents`.

### Task 2: Filtros en `GET /transactions`

**Files:**
- Create: `src/transactions/dto/find-transactions-query.dto.ts`
- Modify: `transactions.service.ts` (`findAll`), `transactions.controller.ts` (`findAll`), spec

**Interfaces:**
- Produces: `GET /api/v1/transactions?type=&search=&from=YYYY-MM-DD&to=YYYY-MM-DD` → `Transaction[]` ordenado `createdAt DESC, id DESC`. `400` si `from > to` o formato inválido.

- [ ] **Step 1: Tests que fallan** (agregar al spec):
```ts
describe('findAll', () => {
  it('filtra por dueño y ordena por fecha', async () => {
    await service.findAll(user, {});
    expect(qb.where).toHaveBeenCalledWith('t.userEmail = :email', { email: user.email });
    expect(qb.orderBy).toHaveBeenCalledWith('t.createdAt', 'DESC');
  });
  it('admin no se limita por email', async () => {
    await service.findAll({ ...user, role: 'admin' }, {});
    expect(qb.where).not.toHaveBeenCalled();
  });
  it('aplica tipo', async () => {
    await service.findAll(user, { type: TypeAmount.INCOME });
    expect(qb.andWhere).toHaveBeenCalledWith('t.typeAmount = :type', { type: 'income' });
  });
  it('escapa comodines en la búsqueda', async () => {
    await service.findAll(user, { search: '50%_off' });
    expect(qb.andWhere).toHaveBeenCalledWith("t.description LIKE :search ESCAPE '\\\\'", { search: '%50\\%\\_off%' });
  });
  it('to es inclusivo hasta fin del día', async () => {
    await service.findAll(user, { from: '2026-10-01', to: '2026-10-13' });
    expect(qb.andWhere).toHaveBeenCalledWith('t.createdAt >= :from', { from: '2026-10-01 00:00:00' });
    expect(qb.andWhere).toHaveBeenCalledWith('t.createdAt < DATE_ADD(:to, INTERVAL 1 DAY)', { to: '2026-10-13' });
  });
  it('rechaza from > to', async () => {
    await expect(service.findAll(user, { from: '2026-10-13', to: '2026-10-01' })).rejects.toThrow(BadRequestException);
  });
});
```
- [ ] **Step 2:** correr → FAIL.
- [ ] **Step 3: DTO**:
```ts
import { IsDateString, IsEnum, IsOptional, IsString, Length, Matches } from 'class-validator';
import { Transform } from 'class-transformer';
import { TypeAmount } from '../models/typeAmount.model';

const DATE = /^\d{4}-\d{2}-\d{2}$/;

export class FindTransactionsQueryDto {
  @IsOptional() @IsEnum(TypeAmount)
  type?: TypeAmount;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value) || undefined)
  @IsString() @Length(1, 80)
  search?: string;

  @IsOptional() @Matches(DATE) @IsDateString()
  from?: string;

  @IsOptional() @Matches(DATE) @IsDateString()
  to?: string;
}
```
- [ ] **Step 4: Service** (quitar el `console.log`):
```ts
private scoped(user: userActiveInterface) {
  const qb = this.transactionRepository.createQueryBuilder('t');
  if (user.role !== Role.ADMIN) qb.where('t.userEmail = :email', { email: user.email });
  return qb;
}

async findAll(user: userActiveInterface, q: FindTransactionsQueryDto) {
  if (q.from && q.to && q.from > q.to) {
    throw new BadRequestException('La fecha "desde" no puede ser posterior a "hasta"');
  }
  const qb = this.scoped(user);
  if (q.type) qb.andWhere('t.typeAmount = :type', { type: q.type });
  if (q.search) {
    const escaped = q.search.replace(/[\\%_]/g, (c) => `\\${c}`);
    qb.andWhere("t.description LIKE :search ESCAPE '\\\\'", { search: `%${escaped}%` });
  }
  if (q.from) qb.andWhere('t.createdAt >= :from', { from: `${q.from} 00:00:00` });
  if (q.to) qb.andWhere('t.createdAt < DATE_ADD(:to, INTERVAL 1 DAY)', { to: q.to });
  return qb.orderBy('t.createdAt', 'DESC').addOrderBy('t.id', 'DESC').getMany();
}
```
(`createQbMock` debe incluir `addOrderBy`.) Nota: `andWhere` sin `where` previo funciona en TypeORM (admin).
- [ ] **Step 5: Controller**: `findAll(@ActiveUser() user, @Query() query: FindTransactionsQueryDto)` + `@ApiQuery` implícito vía Swagger del DTO.
- [ ] **Step 6:** `npx jest` → PASS. Commit `feat(transactions): filter by type, search and date range`.

### Task 3: `GET /transactions/summary`

**Interfaces:**
- Produces: `GET /api/v1/transactions/summary` → `TransactionSummary`:
```ts
{ balance: number; income: number; expense: number; necessary: number; unnecessary: number;
  counts: { income: number; expense_necessary: number; expense_unnecessary: number } } // centavos, expense/necessary/unnecessary positivos
```
Sobre **todas** las transacciones del usuario (no aplica filtros: es el resumen global del panel).

- [ ] **Step 1: Test que falla:**
```ts
it('summary agrega por tipo y castea strings de MySQL', async () => {
  qb.getRawMany.mockResolvedValue([
    { type: 'income', total: '103000000', count: '2' },
    { type: 'expense_necessary', total: '-47930000', count: '4' },
    { type: 'expense_unnecessary', total: '-12530000', count: '3' },
  ]);
  await expect(service.summary(user)).resolves.toEqual({
    balance: 42540000, income: 103000000, expense: 60460000,
    necessary: 47930000, unnecessary: 12530000,
    counts: { income: 2, expense_necessary: 4, expense_unnecessary: 3 },
  });
});
it('summary vacío devuelve ceros', async () => {
  await expect(service.summary(user)).resolves.toMatchObject({ balance: 0, counts: { income: 0 } });
});
```
- [ ] **Step 2:** FAIL → **Step 3: implementar**:
```ts
async summary(user: userActiveInterface) {
  const rows = await this.scoped(user)
    .select('t.typeAmount', 'type')
    .addSelect('SUM(t.amount)', 'total')
    .addSelect('COUNT(*)', 'count')
    .groupBy('t.typeAmount')
    .getRawMany<{ type: TypeAmount; total: string; count: string }>();
  const by = (t: TypeAmount) => rows.find((r) => r.type === t);
  const total = (t: TypeAmount) => Math.abs(Number(by(t)?.total ?? 0));
  const count = (t: TypeAmount) => Number(by(t)?.count ?? 0);
  const income = total(TypeAmount.INCOME);
  const necessary = total(TypeAmount.EXPENSE_NECESSARY);
  const unnecessary = total(TypeAmount.EXPENSE_UNNECESSARY);
  return {
    balance: income - necessary - unnecessary, income,
    expense: necessary + unnecessary, necessary, unnecessary,
    counts: {
      income: count(TypeAmount.INCOME),
      expense_necessary: count(TypeAmount.EXPENSE_NECESSARY),
      expense_unnecessary: count(TypeAmount.EXPENSE_UNNECESSARY),
    },
  };
}
```
- [ ] **Step 4: Controller**: `@Get('summary')` **declarado antes de** `@Get(':id')`.
- [ ] **Step 5:** PASS. Commit `feat(transactions): add summary endpoint`.

### Task 4: Ownership en `:id` + `PATCH :id/restore`

**Interfaces:**
- Produces: `findOne(id, user)`, `update(id, dto, user)`, `remove(id, user)`, `restore(id, user)`. `PATCH /api/v1/transactions/:id/restore` → la transacción restaurada. 404 si no existe o no es del usuario.

- [ ] **Step 1: Tests que fallan:**
```ts
it('remove de transacción ajena → 404 y no borra', async () => {
  repo.findOne.mockResolvedValue(null);
  await expect(service.remove(7, user)).rejects.toThrow(NotFoundException);
  expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 7, userEmail: user.email } });
  expect(repo.softDelete).not.toHaveBeenCalled();
});
it('restore busca incluyendo eliminadas y restaura', async () => {
  repo.findOne
    .mockResolvedValueOnce({ id: 7, deletedAt: new Date() })
    .mockResolvedValueOnce({ id: 7, deletedAt: null });
  await expect(service.restore(7, user)).resolves.toEqual({ id: 7, deletedAt: null });
  expect(repo.findOne).toHaveBeenNthCalledWith(1, { where: { id: 7, userEmail: user.email }, withDeleted: true });
  expect(repo.restore).toHaveBeenCalledWith({ id: 7 });
});
```
- [ ] **Step 2:** FAIL → **Step 3: implementar**:
```ts
private ownerWhere(id: number, user: userActiveInterface) {
  return user.role === Role.ADMIN ? { id } : { id, userEmail: user.email };
}
async findOne(id: number, user: userActiveInterface, withDeleted = false) {
  const t = await this.transactionRepository.findOne({ where: this.ownerWhere(id, user), ...(withDeleted && { withDeleted }) });
  if (!t) throw new NotFoundException('Transacción no encontrada');
  return t;
}
async remove(id: number, user: userActiveInterface) {
  await this.findOne(id, user);
  return this.transactionRepository.softDelete({ id });
}
async restore(id: number, user: userActiveInterface) {
  await this.findOne(id, user, true);
  await this.transactionRepository.restore({ id });
  return this.findOne(id, user);
}
```
Controller: pasar `@ActiveUser()` a `findOne/update/remove`, usar `@Param('id', ParseIntPipe) id: number`, agregar `@Patch(':id/restore')`. Con `withDeleted = false` el spread no agrega claves, así que la llamada es exactamente `{ where }`, como espera el test.
- [ ] **Step 4:** PASS. Commit `fix(transactions): scope :id routes to owner and add restore`.

### Task 5: Seed de cuenta demo + docs

**Files:** Create `src/seed/seed-demo.ts`; Modify `package.json` (`"seed:demo": "ts-node -r tsconfig-paths/register src/seed/seed-demo.ts"`), `README.md`.

- [ ] **Step 1:** Script con `NestFactory.createApplicationContext(AppModule)`; usa `AuthService.register` (ignora `BadRequestException` si ya existe) con `demo@cuentasclaras.app` / `portfolio2026`, borra (hard delete) sus transacciones y crea las 9 de ejemplo de la demo vía `TransactionsService.create` (montos en centavos, p. ej. `85000000` sueldo).
- [ ] **Step 2:** Correr `npm run seed:demo` contra el MySQL de docker; verificar `curl` login + `GET /transactions?type=expense_unnecessary` devuelve 3.
- [ ] **Step 3:** README: tabla de endpoints con query params, nota de centavos, script SQL de migración y seed. Commit `chore: demo seed and API docs`.

---

## Parte B — Frontend

### Task 6: Fundaciones visuales (tokens, fuentes, Tailwind, tema)

**Files:** Modify `src/index.html`, `src/styles.scss`, `tailwind.config.js`; Create `src/app/services/theme.service.ts`; copiar demo a `docs/design/cuentas-claras-demo.html`.

**Interfaces:**
- Produces: clases Tailwind `bg-bg bg-surface bg-surface-2 text-fg text-muted border-line bg-accent text-accent-fg bg-accent-soft text-inc bg-inc-soft text-nec bg-nec-soft text-unn bg-unn-soft`, `font-display font-sans font-num`. `ThemeService { mode$: Observable<'system'|'light'|'dark'>; cycle(): void }`.

- [ ] **Step 1:** `index.html`: `lang="es"`, `<title>Cuentas Claras</title>`, preconnect + Google Fonts (Bricolage Grotesque 500/700, Instrument Sans 400/500/600, IBM Plex Mono 400/500).
- [ ] **Step 2:** `styles.scss`: copiar los bloques `:root`, `@media (prefers-color-scheme: dark) :root:not([data-theme="light"])` y `:root[data-theme="dark"]` de la demo, **pero con valores en canales RGB** (`--bg: 242 243 247;`) para que Tailwind soporte opacidad. Mantener `.num { font-variant-numeric: tabular-nums }`, `:focus-visible`, `prefers-reduced-motion`. Quitar el scrollbar gris hardcodeado.
- [ ] **Step 3:** `tailwind.config.js`:
```js
const v = (n) => `rgb(var(--${n}) / <alpha-value>)`;
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: { extend: {
    colors: Object.fromEntries(['bg','surface','surface-2','fg','muted','line','accent','accent-fg','accent-soft','inc','inc-soft','nec','nec-soft','unn','unn-soft'].map((n) => [n, v(n)])),
    fontFamily: {
      display: ['"Bricolage Grotesque"', '"Segoe UI"', 'system-ui', 'sans-serif'],
      sans: ['"Instrument Sans"', '"Segoe UI"', 'system-ui', 'sans-serif'],
      num: ['"IBM Plex Mono"', 'ui-monospace', 'Menlo', 'monospace'],
    },
    borderRadius: { card: '14px' },
  } },
  plugins: [],
};
```
- [ ] **Step 4:** `ThemeService` (lee/escribe `localStorage` con try/catch, setea `document.documentElement.dataset.theme`). Spec mínimo: `cycle()` recorre system→light→dark→system y aplica el atributo.
- [ ] **Step 5:** `ng build` OK, `ng test --watch=false --browsers=ChromeHeadless` OK. Commit `style: design tokens, fonts and theme service`.

### Task 7: Utilidades de dinero en centavos

**Files:** Create `src/app/utils/money.ts`, `src/app/utils/money.spec.ts`.

**Interfaces:**
- Produces: `parseMoneyToCents(input: string): number | null` · `formatCents(cents: number, opts?: { signed?: boolean }): string` · `MAX_AMOUNT_CENTS = 2_000_000_000`.

Regla de parseo: quitar espacios y `$`. Si hay `,` → `,` es decimal y `.` es separador de miles. Si no hay `,` y hay **un solo** `.` seguido de 1–2 dígitos → decimal; si no → `.` son miles. Más de 2 decimales, letras, negativos o vacío → `null`. Conversión sin floats: separar parte entera y decimal como strings.

- [ ] **Step 1: Tests que fallan:**
```ts
import { formatCents, parseMoneyToCents } from './money';

describe('parseMoneyToCents', () => {
  const ok: [string, number][] = [
    ['10,50', 1050], ['10.50', 1050], ['10,5', 1050], ['10', 1000],
    ['1.500', 150000], ['1.500,25', 150025], ['1.234.567', 123456700],
    ['$ 2.000,99', 200099], [' 0,01 ', 1], ['0.1', 10],
  ];
  ok.forEach(([i, o]) => it(`"${i}" → ${o}`, () => expect(parseMoneyToCents(i)).toBe(o)));
  ['', 'abc', '10,555', '-5', '1,2,3', '.', ','].forEach((i) =>
    it(`"${i}" → null`, () => expect(parseMoneyToCents(i)).toBeNull()));
});

describe('formatCents', () => {
  it('formatea pesos con centavos', () => expect(formatCents(150025)).toBe('$ 1.500,25'));
  it('cero', () => expect(formatCents(0)).toBe('$ 0,00'));
  it('signed muestra + y −', () => {
    expect(formatCents(1050, { signed: true })).toBe('+ $ 10,50');
    expect(formatCents(-1050, { signed: true })).toBe('− $ 10,50');
  });
});
```
(Si el ICU del navegador usa NBSP entre `$` y el número, normalizar en `formatCents` con `.replace(/\u00a0/g, ' ')`.)
- [ ] **Step 2:** FAIL → **Step 3: implementar**:
```ts
export const MAX_AMOUNT_CENTS = 2_000_000_000;
const fmt = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function parseMoneyToCents(input: string): number | null {
  const s = input.replace(/[\s$]/g, '');
  if (!/^[\d.,]+$/.test(s)) return null;
  let int: string, dec = '';
  if (s.includes(',')) {
    const parts = s.split(',');
    if (parts.length !== 2) return null;
    [int, dec] = [parts[0].replace(/\./g, ''), parts[1]];
  } else {
    const dots = s.split('.');
    if (dots.length === 2 && /^\d{1,2}$/.test(dots[1])) [int, dec] = dots;
    else int = s.replace(/\./g, '');
  }
  if (!/^\d+$/.test(int || '0') || !/^\d{0,2}$/.test(dec) || (!int && !dec)) return null;
  return Number(int || '0') * 100 + Number(dec.padEnd(2, '0'));
}

export function formatCents(cents: number, opts: { signed?: boolean } = {}): string {
  const text = fmt.format(Math.abs(cents) / 100).replace(/\u00a0/g, ' ');
  if (!opts.signed) return cents < 0 ? `− ${text}` : text;
  return `${cents < 0 ? '−' : '+'} ${text}`;
}
```
(`/100` solo para mostrar; nunca se suma en pesos.)
- [ ] **Step 4:** PASS. Commit `feat: money utils for cents`.

### Task 8: `TransactionService` reactivo con filtros vía API

**Files:** Modify `src/app/models/transaction.model.ts`, `src/app/models/add-transaction.dto.ts`; Rewrite `src/app/services/transaction.service.ts`; Create `transaction.service.spec.ts`.

**Interfaces:**
- Produces:
```ts
export interface Transaction { id: number; description: string; typeAmount: TypeAmount; amount: number /* centavos con signo */; createdAt: string; }
export interface TransactionFilters { type?: TypeAmount; search?: string; from?: string; to?: string; }
export interface TransactionSummary { balance: number; income: number; expense: number; necessary: number; unnecessary: number; counts: Record<TypeAmount, number>; }
export interface AddTransactionDto { amount: number /* centavos > 0 */; typeAmount: TypeAmount; description: string; }

class TransactionService {
  readonly filters$: Observable<TransactionFilters>;
  readonly transactions$: Observable<Transaction[]>;
  readonly summary$: Observable<TransactionSummary>;
  readonly loading$: Observable<boolean>;
  readonly error$: Observable<string | null>;
  setFilters(patch: Partial<TransactionFilters>): void;   // merge; valores vacíos se eliminan
  clearFilters(): void;
  add(dto: AddTransactionDto): Observable<Transaction>;    // dispara refresh
  remove(id: number): Observable<void>;                    // dispara refresh
  restore(id: number): Observable<Transaction>;            // dispara refresh
  matches(t: Transaction, f: TransactionFilters): boolean; // para el aviso "no coincide"
}
```
- [ ] **Step 1: Tests que fallan** (`HttpClientTestingModule`):
```ts
const URL = 'http://localhost:3000/api/v1/transactions';
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
  service.transactions$.subscribe(); service.summary$.subscribe();
  http.expectOne(URL).flush([]); http.expectOne(`${URL}/summary`).flush(emptySummary);
  service.add({ amount: 1050, typeAmount: TypeAmount.INCOME, description: 'x' }).subscribe();
  http.expectOne({ method: 'POST', url: URL }).flush({ id: 1 });
  http.expectOne(URL); http.expectOne(`${URL}/summary`);
});
it('matches respeta tipo, búsqueda (case-insensitive) y fechas', () => {
  const t = { id: 1, description: 'Supermercado', typeAmount: TypeAmount.EXPENSE_NECESSARY, amount: -100, createdAt: '2026-10-05T15:00:00.000Z' };
  expect(service.matches(t, { search: 'super' })).toBeTrue();
  expect(service.matches(t, { type: TypeAmount.INCOME })).toBeFalse();
  expect(service.matches(t, { to: '2026-10-04' })).toBeFalse();
});
it('error HTTP deja lista vacía y publica mensaje', () => {
  let err: string | null = null;
  service.error$.subscribe((e) => (err = e));
  service.transactions$.subscribe();
  http.expectOne(URL).flush({ message: 'x' }, { status: 500, statusText: 'err' });
  expect(err).toBe('No pudimos cargar tus transacciones. Intenta de nuevo.');
});
```
- [ ] **Step 2:** FAIL → **Step 3: implementar** (núcleo):
```ts
private filtersSubject = new BehaviorSubject<TransactionFilters>({});
private refresh$ = new BehaviorSubject<void>(undefined);
private loadingSubject = new BehaviorSubject(false);
private errorSubject = new BehaviorSubject<string | null>(null);
readonly filters$ = this.filtersSubject.asObservable();
readonly loading$ = this.loadingSubject.asObservable();
readonly error$ = this.errorSubject.asObservable();

readonly transactions$ = combineLatest([this.filtersSubject, this.refresh$]).pipe(
  tap(() => { this.loadingSubject.next(true); this.errorSubject.next(null); }),
  switchMap(([f]) => this.http.get<Transaction[]>(this.url, { params: toParams(f) }).pipe(
    catchError(() => { this.errorSubject.next('No pudimos cargar tus transacciones. Intenta de nuevo.'); return of([]); }),
  )),
  tap(() => this.loadingSubject.next(false)),
  shareReplay({ bufferSize: 1, refCount: true }),
);
readonly summary$ = this.refresh$.pipe(
  switchMap(() => this.http.get<TransactionSummary>(`${this.url}/summary`)),
  shareReplay({ bufferSize: 1, refCount: true }),
);

setFilters(patch: Partial<TransactionFilters>) {
  this.filtersSubject.next(clean({ ...this.filtersSubject.value, ...patch }));
}
add(dto: AddTransactionDto) { return this.http.post<Transaction>(this.url, dto).pipe(tap(() => this.refresh$.next())); }
```
`toParams`/`clean` eliminan claves `undefined`/`''`/solo espacios y hacen `trim`. `matches` compara `createdAt.slice(0,10)` contra `from`/`to` en **fecha local** (`toLocalDateKey(new Date(createdAt))`) para coincidir con lo que ve el usuario. Eliminar `init()`/`getTransactions()`/`deleteTransaction()` y sus usos.
- [ ] **Step 4:** PASS. Commit `feat: reactive transaction service with API filters`.

### Task 9: Panel — layout, navbar y tarjeta de resumen

**Files:** Rewrite `pages/home.component.html`, `components/navbar/*`; Create `components/summary-card/*` (+ spec); Delete `components/balance/`, `components/income-expense/`; Modify `home.module.ts`.

**Interfaces:**
- Consumes: `TransactionService.summary$`, `formatCents`, `ThemeService`, `UserService.getEmail()`.
- Produces: `<app-summary-card>` sin inputs.

- [ ] **Step 1: Test que falla** (`summary-card.component.spec.ts`, con `TransactionService` stub `summary$ = of(summary)`):
  - muestra `$ 425.400,00` en `[data-testid=balance]`;
  - barra: `[data-testid=bar-nec]` con `style.width = '79%'` para necessary 47930000 / expense 60460000;
  - insight: "Si evitaras los gastos innecesarios, tu saldo sería $ 550.700,00";
  - expense 0 → texto "Todavía no registraste gastos…" y barra 0%;
  - balance negativo → clase `text-unn`.
- [ ] **Step 2:** FAIL → **Step 3:** implementar replicando el markup de la demo (`.summary` → Tailwind: `bg-surface border border-line rounded-card p-[22px] shadow-…`). Porcentajes: `Math.round(necessary / expense * 100)`, el otro `100 - pn`. `aria-label` en la barra. Navbar: marca (SVG de la demo), avatar con iniciales del email, email (oculto <480px), botón tema (`ThemeService.cycle`), "Cerrar sesión". Home: `grid md:grid-cols-[1fr_1.15fr] gap-5 max-w-[1120px] mx-auto px-4 py-7`, saludo "Hola" + nombre si existe (el email antes de `@` si no).
- [ ] **Step 4:** PASS + `ng serve` visual vs demo. Commit `feat(home): summary card and redesigned layout`.

### Task 10: Formulario de nueva transacción

**Files:** Rewrite `components/transaction-form/*` (+ spec).

**Interfaces:** Consumes `parseMoneyToCents`, `MAX_AMOUNT_CENTS`, `TransactionService.add/matches/filters$`, `ToastService.show` (Task 12; hasta entonces inyectar y stubear).

- [ ] **Step 1: Tests que fallan:**
  - submit vacío → muestra "Elige si es un ingreso o un gasto.", "Escribe una descripción corta.", "Escribe un monto." y **no** llama `add`;
  - monto `"10,555"` → "Usa hasta 2 decimales, por ejemplo 1500,50";
  - monto `"25.000.000"` → "El monto máximo es $ 20.000.000,00";
  - válido (`income`, `"Sueldo"`, `"1.500,25"`) → `add({ amount: 150025, typeAmount: 'income', description: 'Sueldo' })`, resetea campos pero **mantiene el tipo**;
  - botón dice "Agregar ingreso" al elegir ingreso, y "Agregando…" + `disabled` mientras `add` no completa;
  - error 400 de la API → mensaje del backend en `.form-alert`.
- [ ] **Step 2:** FAIL → **Step 3:** implementar. Radios reales con `id` únicos (`t-inc`, `t-nec`, `t-unn`) y `formControlName="typeAmount"`; validador custom `moneyValidator` que usa `parseMoneyToCents` (errores `required`, `format`, `decimals`, `max`, `min`). Errores en flujo normal (sin `absolute`), `aria-invalid`, `aria-live="polite"`. Tras éxito: si `!matches(t, filtros)` → toast "Agregado. No coincide con los filtros activos" con acción "Ver todo" (`clearFilters`).
- [ ] **Step 4:** PASS. Commit `feat(home): accessible transaction form with cents`.

### Task 11: Filtros e historial

**Files:** Create `components/transaction-filters/*` (+ spec); Rewrite `components/transaction-list/*`, `transaction-item/*` (+ specs).

**Interfaces:**
- Consumes: `TransactionService.filters$/setFilters/clearFilters/transactions$/loading$/error$/summary$ (counts)/remove`.
- Produces: `<app-transaction-item [transaction] (delete)="...">` con `@Output() delete = new EventEmitter<Transaction>()`.

- [ ] **Step 1: Tests que fallan (filters):**
  - click en chip "Innecesarios" → `setFilters({ type: 'expense_unnecessary' })`; click en "Todas" → `setFilters({ type: undefined })`;
  - tipear en búsqueda "sup" → `setFilters({ search: 'sup' })` **una sola vez** tras 300 ms (`fakeAsync` + `tick(300)`), `distinctUntilChanged`;
  - `from` > `to` → muestra "La fecha desde no puede ser posterior a hasta" y **no** llama `setFilters`;
  - botón "Limpiar filtros" visible solo con algún filtro activo → `clearFilters()`.
- [ ] **Step 2: Tests que fallan (list/item):**
  - `loading$ = true` → 4 filas skeleton;
  - lista vacía sin filtros → "Tu historial está vacío"; vacía con filtros → "Ningún resultado con estos filtros" + "Limpiar filtros";
  - `error$` con mensaje → alerta con botón "Reintentar";
  - item: descripción completa en `title`, `truncate` por CSS; monto `formatCents(amount, { signed: true })`; fecha `13 oct` (`DatePipe` con `'d MMM'` y locale `es-AR` registrado en `AppModule` vía `registerLocaleData` + `LOCALE_ID`); botón eliminar con `aria-label="Eliminar <descripción>"`.
- [ ] **Step 3:** implementar. Chips con `aria-pressed` y contador de `summary.counts`; inputs `type="date"` con `max` = hoy; header "Historial" + "N resultados". Lista con `trackBy: id`, `max-h-[520px] overflow-y-auto`.
- [ ] **Step 4:** PASS. Commit `feat(home): API-driven history filters`.

### Task 12: Eliminar con deshacer (toast)

**Files:** Create `src/app/services/toast.service.ts` (+ spec), `src/app/shared/toast/toast.component.*`; Modify `app.component.html`, `app.module.ts`, `transaction-list.component.ts`.

**Interfaces:**
- Produces: `ToastService { toast$: Observable<Toast | null>; show(msg: string, action?: { label: string; run: () => void }, ms = 6000): void; dismiss(): void }`.

- [ ] **Step 1: Tests que fallan:**
  - `show` emite y a los 6000 ms emite `null` (`fakeAsync`);
  - un segundo `show` reemplaza al primero y reinicia el temporizador;
  - lista: eliminar → `remove(id)`, luego toast `Se eliminó "Alquiler"` con acción "Deshacer"; ejecutar acción → `restore(id)`; si `restore` falla → toast "No pudimos restaurar la transacción".
- [ ] **Step 2:** FAIL → **Step 3:** implementar. Toast fijo abajo-centro (`bottom: calc(20px + env(safe-area-inset-bottom))`), `role="status"`.
- [ ] **Step 4:** PASS. Commit `feat: delete with undo via restore endpoint`.

### Task 13: Login y registro rediseñados + cuenta demo

**Files:** Create `modules/auth/auth-layout/*`; Rewrite `login/*`, `register/*` (+ specs); Modify `auth.module.ts`, `auth-routing.module.ts` (rutas hijas de `AuthLayoutComponent`), `environment.ts` (`demo: { email: 'demo@cuentasclaras.app', password: 'portfolio2026' }`), `auth.service.ts` (sin `catchError` que relanza).

- [ ] **Step 1: Tests que fallan (login):**
  - submit inválido → errores inline y foco en el primer campo inválido; no llama `login`;
  - contraseña de 5 caracteres → "Le faltan 3 caracteres (mínimo 8).";
  - "Mostrar" cambia `type` a `text` y el texto a "Ocultar";
  - submit válido → botón "Ingresando…" deshabilitado; éxito navega a `/app`; **el form no se resetea antes de la respuesta** (bug actual);
  - 401 → alerta "Email o contraseña incorrectos." (no exponer "email is wrong"/"password is wrong");
  - "Entrar con la cuenta demo" llama `login(environment.demo.email, environment.demo.password)`.
- [ ] **Step 2: Tests que fallan (register):** título "Crea tu cuenta", botón "Crear cuenta", 400 "User already exists" → "Ya existe una cuenta con ese email.", éxito usa `registerAndLogin` y navega a `/app`.
- [ ] **Step 3:** implementar. `AuthLayoutComponent`: panel de marca (h1 "Separa lo que necesitas de lo que podrías evitar.", preview con barra) oculto en móvil + tarjeta con pestañas `routerLink` `/login` y `/register` (`routerLinkActive`, `role="tab"`). Navbar global no se muestra en rutas de auth (ya depende de `isLoggedIn`).
- [ ] **Step 4:** PASS. Commit `feat(auth): redesigned login/register with demo account`.

### Task 14: Pulido final, README y verificación end-to-end

- [ ] **Step 1:** Eliminar código muerto (`HttpClientModule` duplicado en `HomeModule`, `NavbarComponent` import sin usar en `AppModule`, `.scss` vacíos de auth).
- [ ] **Step 2:** README del front: capturas (claro/oscuro, móvil), stack, cómo levantar con el backend, cuenta demo, link a la demo de diseño.
- [ ] **Step 3:** Verificación (ver abajo). Commit `docs: portfolio README`.

---

## Verificación end-to-end

1. Backend: `cd nest-expense-manager && npx jest` (todo verde) → `docker compose up -d` → `npm run seed:demo`.
2. Si hay datos previos en pesos: ejecutar `scripts/2026-10-amount-to-cents.sql` una vez.
3. `curl` con token demo:
   - `GET /api/v1/transactions?type=expense_unnecessary` → 3 ítems.
   - `GET ...?search=super` → "Supermercado semanal".
   - `GET ...?from=2026-10-13&to=2026-10-01` → 400.
   - `GET /api/v1/transactions/summary` → `balance` en centavos.
   - `DELETE /:id` de otro usuario → 404.
4. Front: `ng test --watch=false --browsers=ChromeHeadless` (verde) → `ng serve`.
5. Con Playwright (MCP disponible): login con "Entrar con la cuenta demo" → panel; chip "Innecesarios" genera request con `type=expense_unnecessary` (ver `browser_network_requests`); búsqueda dispara 1 request tras 300 ms; alta de `$ 10,50` → POST con `amount: 1050` y saldo +$ 10,50; eliminar → toast → Deshacer → `PATCH /:id/restore`; screenshots claro/oscuro y 390 px de ancho comparados con la demo.

## Notas de ejecución

- El plan definitivo se copiará a `docs/superpowers/plans/2026-10-13-cuentas-claras-redesign.md` en el repo Angular al salir de plan mode.
- Orden: Parte A completa (el front depende del contrato de API) → Task 6–7 → 8 → 9–13 (independientes entre sí salvo el toast de Task 12, que Task 10 stubea) → 14.
