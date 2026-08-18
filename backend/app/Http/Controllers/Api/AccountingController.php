<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AccessControl;
use App\Services\ActivityLogger;
use App\Services\Accounting\BankStatementParser;
use App\Services\Accounting\DoubleEntryService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AccountingController extends Controller
{
    // ─── Chart of Accounts ──────────────────────────────────────────────────

    public function accounts(Request $request)
    {
        return DB::table('accounting_accounts')
            ->orderBy('code')
            ->get();
    }

    public function storeAccount(Request $request, AccessControl $accessControl, ActivityLogger $activityLogger)
    {
        $accessControl->authorize($request->user(), 'accounting.manage');

        $data = $request->validate([
            'code' => ['required', 'string', 'max:20', 'unique:accounting_accounts,code'],
            'name' => ['required', 'string', 'max:160'],
            'type' => ['required', 'in:asset,liability,equity,income,expense'],
        ]);

        $id = DB::table('accounting_accounts')->insertGetId([
            ...$data,
            'is_active'  => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $activityLogger->log($request->user(), 'accounting.account_created', null, $data);

        return response()->json(DB::table('accounting_accounts')->find($id), 201);
    }

    // ─── Journal Entries ────────────────────────────────────────────────────

    public function entries(Request $request)
    {
        $query = DB::table('accounting_entries')
            ->orderByDesc('entry_date')
            ->orderByDesc('id');

        if ($request->filled('from')) {
            $query->where('entry_date', '>=', $request->string('from'));
        }
        if ($request->filled('to')) {
            $query->where('entry_date', '<=', $request->string('to'));
        }

        return $query->paginate($request->integer('per_page', 30));
    }

    public function entryDetail(int $entry)
    {
        $e = DB::table('accounting_entries')->where('id', $entry)->first();
        abort_if(! $e, 404, 'Asiento no encontrado.');

        $items = DB::table('accounting_items as i')
            ->join('accounting_accounts as a', 'a.id', '=', 'i.account_id')
            ->where('i.entry_id', $entry)
            ->select('i.*', 'a.code', 'a.name as account_name', 'a.type as account_type')
            ->get();

        return ['entry' => $e, 'items' => $items];
    }

    // ─── Balance ────────────────────────────────────────────────────────────

    public function storeEntry(Request $request, AccessControl $accessControl, ActivityLogger $activityLogger, DoubleEntryService $doubleEntry)
    {
        $accessControl->authorize($request->user(), 'accounting.manage');

        $data = $request->validate([
            'description' => ['required', 'string', 'max:255'],
            'entry_date' => ['required', 'date'],
            'reference' => ['nullable', 'string', 'max:100'],
            'items' => ['required', 'array', 'min:2'],
            'items.*.account_id' => ['required', 'exists:accounting_accounts,id'],
            'items.*.debit' => ['required', 'numeric', 'min:0'],
            'items.*.credit' => ['required', 'numeric', 'min:0'],
        ]);

        $totalDebit = array_sum(array_column($data['items'], 'debit'));
        $totalCredit = array_sum(array_column($data['items'], 'credit'));

        if (round($totalDebit, 2) !== round($totalCredit, 2)) {
            abort(422, 'El total de debitos debe ser igual al total de creditos.');
        }

        $entry = $doubleEntry->recordManualEntry(
            $data['description'],
            $data['entry_date'],
            $data['items'],
            $data['reference'] ?? null,
        );

        $activityLogger->log($request->user(), 'accounting.entry_created', null, [
            'entry_id' => $entry->id,
            'description' => $data['description'],
        ]);

        return response()->json($entry->load('items'), 201);
    }

    // ─── Balance ────────────────────────────────────────────────────────────

    public function trialBalance()
    {
        $rows = DB::table('accounting_items as i')
            ->join('accounting_accounts as a', 'a.id', '=', 'i.account_id')
            ->select(
                'a.code',
                'a.name',
                'a.type',
                DB::raw('SUM(i.debit) as total_debit'),
                DB::raw('SUM(i.credit) as total_credit'),
                DB::raw('SUM(i.debit) - SUM(i.credit) as balance'),
            )
            ->groupBy('a.id', 'a.code', 'a.name', 'a.type')
            ->orderBy('a.code')
            ->get();

        $totalDebit  = $rows->sum('total_debit');
        $totalCredit = $rows->sum('total_credit');

        return [
            'rows'         => $rows,
            'total_debit'  => round($totalDebit, 2),
            'total_credit' => round($totalCredit, 2),
            'balanced'     => round($totalDebit, 2) === round($totalCredit, 2),
        ];
    }

    // ─── Bank Accounts ──────────────────────────────────────────────────────

    public function bankAccounts()
    {
        return DB::table('bank_accounts')->orderBy('bank_name')->get();
    }

    public function storeBankAccount(Request $request, AccessControl $accessControl, ActivityLogger $activityLogger)
    {
        $accessControl->authorize($request->user(), 'accounting.manage');

        $data = $request->validate([
            'bank_name'      => ['required', 'string', 'max:100'],
            'account_number' => ['nullable', 'string', 'max:30'],
            'account_type'   => ['nullable', 'string', 'max:30'],
            'currency'       => ['sometimes', 'string', 'max:10'],
        ]);

        $id = DB::table('bank_accounts')->insertGetId([
            ...$data,
            'balance'    => 0,
            'is_active'  => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $activityLogger->log($request->user(), 'accounting.bank_account_created', null, $data);

        return response()->json(DB::table('bank_accounts')->find($id), 201);
    }

    // ─── Bank Statement Import ───────────────────────────────────────────────

    public function importStatement(Request $request, AccessControl $accessControl, BankStatementParser $parser)
    {
        $accessControl->authorize($request->user(), 'accounting.manage');

        $request->validate([
            'bank_account_id' => ['required', 'exists:bank_accounts,id'],
            'file'            => ['required', 'file', 'max:5120'],
            'format'          => ['required', 'in:csv,ofx'],
        ]);

        $bankAccountId = $request->integer('bank_account_id');
        $content       = file_get_contents($request->file('file')->getRealPath());

        $rows = $request->string('format') === 'ofx'
            ? $parser->parseOfx($content)
            : $parser->parseCsv($content);

        $inserted = 0;
        foreach ($rows as $row) {
            $exists = DB::table('bank_statement_lines')
                ->where('bank_account_id', $bankAccountId)
                ->where('transaction_date', $row['transaction_date'])
                ->where('amount', $row['amount'])
                ->where('description', $row['description'])
                ->exists();

            if (! $exists) {
                DB::table('bank_statement_lines')->insert([
                    ...$row,
                    'bank_account_id' => $bankAccountId,
                    'created_at'      => now(),
                    'updated_at'      => now(),
                ]);
                $inserted++;
            }
        }

        return response()->json([
            'parsed'   => count($rows),
            'inserted' => $inserted,
            'skipped'  => count($rows) - $inserted,
        ]);
    }

    public function statementLines(Request $request)
    {
        $query = DB::table('bank_statement_lines')
            ->orderByDesc('transaction_date')
            ->orderByDesc('id');

        if ($request->filled('bank_account_id')) {
            $query->where('bank_account_id', $request->integer('bank_account_id'));
        }
        if ($request->filled('unreconciled')) {
            $query->where('is_reconciled', false);
        }

        return $query->paginate($request->integer('per_page', 30));
    }

    public function reconcileLine(int $line, Request $request, AccessControl $accessControl)
    {
        $accessControl->authorize($request->user(), 'accounting.manage');

        $data = $request->validate([
            'reconciled_with_id'   => ['required', 'integer'],
            'reconciled_with_type' => ['required', 'string', 'max:60'],
        ]);

        DB::table('bank_statement_lines')->where('id', $line)->update([
            ...$data,
            'is_reconciled' => true,
            'updated_at'    => now(),
        ]);

        return DB::table('bank_statement_lines')->find($line);
    }
}
