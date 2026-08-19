<?php

namespace App\Services\Accounting;

use App\Models\Sale;
use Illuminate\Support\Facades\DB;

class DoubleEntryService
{
    /**
     * Default account codes used for automatic journal entries.
     * These can be customized in the accounting_accounts table.
     */
    private const ACCOUNTS = [
        'cash'          => ['code' => '1.1.01', 'name' => 'Caja', 'type' => 'asset'],
        'bank'          => ['code' => '1.1.02', 'name' => 'Banco', 'type' => 'asset'],
        'receivable'    => ['code' => '1.1.06', 'name' => 'Cuentas por Cobrar Clientes', 'type' => 'asset'],
        'sales'         => ['code' => '4.1.01', 'name' => 'Ventas de Mercaderia', 'type' => 'income'],
        'sales_returns' => ['code' => '4.1.03', 'name' => 'Devoluciones en Ventas', 'type' => 'income'],
        'iva_payable'   => ['code' => '2.1.03', 'name' => 'IVA por Pagar', 'type' => 'liability'],
        'card'          => ['code' => '1.1.03', 'name' => 'Bancos - Tarjeta', 'type' => 'asset'],
        'transfer'      => ['code' => '1.1.04', 'name' => 'Bancos - Transferencia', 'type' => 'asset'],
        'credit_payment' => ['code' => '1.1.01', 'name' => 'Caja', 'type' => 'asset'],
    ];

    public function recordManualEntry(string $description, string $date, array $items, ?string $reference = null)
    {
        $totalDebit = array_sum(array_map(fn ($item) => (float) ($item['debit'] ?? 0), $items));
        $totalCredit = array_sum(array_map(fn ($item) => (float) ($item['credit'] ?? 0), $items));

        if (round($totalDebit, 2) !== round($totalCredit, 2)) {
            throw new \InvalidArgumentException(
                "El asiento no esta balanceado: debito={$totalDebit}, credito={$totalCredit}. Ambos deben ser iguales."
            );
        }

        $entryId = DB::table('accounting_entries')->insertGetId([
            'description' => $description,
            'entry_date'  => $date,
            'reference'   => $reference,
            'source_type' => 'manual',
            'created_at'  => now(),
            'updated_at'  => now(),
        ]);

        foreach ($items as $item) {
            DB::table('accounting_items')->insert([
                'entry_id'    => $entryId,
                'account_id'  => $item['account_id'],
                'debit'       => round((float) ($item['debit'] ?? 0), 2),
                'credit'      => round((float) ($item['credit'] ?? 0), 2),
                'description' => $description,
                'created_at'  => now(),
                'updated_at'  => now(),
            ]);
        }

        return DB::table('accounting_entries')->find($entryId);
    }

    public function recordSale(Sale $sale): void
    {
        $sale->loadMissing(['payments', 'items']);

        $description = "Venta #{$sale->folio} - " . ($sale->customer?->name ?? 'Consumidor Final');
        $entryId = $this->createEntry($description, $sale->sold_at?->toDateString() ?? now()->toDateString(), 'sale', $sale->id);

        // Credit: Sales Revenue (net of tax)
        $netSales = (float) $sale->subtotal - (float) $sale->discount_total;
        $this->addLine($entryId, 'sales', 0, $netSales, "Ingreso venta #{$sale->folio}");

        // Credit: IVA Payable
        if ((float) $sale->tax_total > 0) {
            $this->addLine($entryId, 'iva_payable', 0, (float) $sale->tax_total, "IVA 13% venta #{$sale->folio}");
        }

        // Debit: payment method accounts
        foreach ($sale->payments as $payment) {
            $amount = (float) $payment->amount;
            $debitAccount = match ($payment->method) {
                'card'     => 'card',
                'transfer' => 'transfer',
                'credit'   => 'receivable',
                default    => 'cash',
            };
            $this->addLine($entryId, $debitAccount, $amount, 0, ucfirst($payment->method) . " venta #{$sale->folio}");
        }
    }

    public function recordRefund(Sale $sale, float $amount): void
    {
        $description = "Devolucion venta #{$sale->folio}";
        $entryId = $this->createEntry($description, now()->toDateString(), 'refund', $sale->id);

        $this->addLine($entryId, 'sales_returns', $amount, 0, $description);
        $this->addLine($entryId, 'cash', 0, $amount, "Efectivo devuelto - {$description}");
    }

    public function recordCreditPayment(float $amount, int $customerId, string $method = 'cash'): void
    {
        $description = "Pago credito cliente #{$customerId}";
        $entryId = $this->createEntry($description, now()->toDateString(), 'credit_payment', $customerId);

        $debitAccount = match ($method) {
            'card'     => 'card',
            'transfer' => 'transfer',
            default    => 'credit_payment',
        };

        $this->addLine($entryId, $debitAccount, $amount, 0, "Cobro credito - {$description}");
        $this->addLine($entryId, 'receivable', 0, $amount, "Reduccion saldo por cobrar - {$description}");
    }

    private function createEntry(string $description, string $date, string $sourceType, int $sourceId): int
    {
        return DB::table('accounting_entries')->insertGetId([
            'description' => $description,
            'entry_date'  => $date,
            'source_type' => $sourceType,
            'source_id'   => $sourceId,
            'created_at'  => now(),
            'updated_at'  => now(),
        ]);
    }

    private function addLine(int $entryId, string $accountKey, float $debit, float $credit, string $description): void
    {
        $accountData = self::ACCOUNTS[$accountKey];
        $accountId = DB::table('accounting_accounts')
            ->where('code', $accountData['code'])
            ->value('id');

        if (! $accountId) {
            $accountId = DB::table('accounting_accounts')->insertGetId([
                'code'       => $accountData['code'],
                'name'       => $accountData['name'],
                'type'       => $accountData['type'],
                'is_active'  => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        DB::table('accounting_items')->insert([
            'entry_id'    => $entryId,
            'account_id'  => $accountId,
            'debit'       => round($debit, 2),
            'credit'      => round($credit, 2),
            'description' => $description,
            'created_at'  => now(),
            'updated_at'  => now(),
        ]);
    }
}
