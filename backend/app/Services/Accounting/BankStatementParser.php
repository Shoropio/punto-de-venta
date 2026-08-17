<?php

namespace App\Services\Accounting;

class BankStatementParser
{
    /**
     * Parse a CSV bank statement.
     * Expected columns (flexible): date, description, amount, type/debit/credit, reference
     */
    public function parseCsv(string $csvContent, string $format = 'auto'): array
    {
        $lines = array_filter(explode("\n", trim($csvContent)));
        if (empty($lines)) {
            return [];
        }

        $headers = array_map(fn($h) => trim(strtolower(str_replace(['"', "'", ' '], ['', '', '_'], $h))), str_getcsv(array_shift($lines)));

        $rows = [];
        foreach ($lines as $line) {
            $cells = str_getcsv(trim($line));
            if (count($cells) < 2) continue;

            $row = array_combine(array_slice($headers, 0, count($cells)), array_slice($cells, 0, count($headers)));
            $parsed = $this->normalizeRow($row);
            if ($parsed) {
                $rows[] = $parsed;
            }
        }

        return $rows;
    }

    /**
     * Parse OFX (Open Financial Exchange) file format.
     */
    public function parseOfx(string $ofxContent): array
    {
        $rows = [];
        preg_match_all('/<STMTTRN>(.*?)<\/STMTTRN>/s', $ofxContent, $matches);

        foreach ($matches[1] as $block) {
            $getTag = fn(string $tag) => preg_match("/<{$tag}>(.*?)(?:<\/{$tag}>|[\r\n])/s", $block, $m) ? trim($m[1]) : null;

            $amount = (float) ($getTag('TRNAMT') ?? 0);
            $dateRaw = $getTag('DTPOSTED') ?? '';
            $date = $this->parseOfxDate($dateRaw);

            if (! $date) continue;

            $rows[] = [
                'transaction_date' => $date,
                'description'      => $getTag('MEMO') ?? $getTag('NAME') ?? 'Sin descripcion',
                'amount'           => abs($amount),
                'transaction_type' => $amount >= 0 ? 'credit' : 'debit',
                'reference'        => $getTag('FITID') ?? null,
                'is_reconciled'    => false,
            ];
        }

        return $rows;
    }

    private function normalizeRow(array $row): ?array
    {
        // Try to detect date column
        $date = $row['fecha'] ?? $row['date'] ?? $row['transaction_date'] ?? $row['fecha_transaccion'] ?? null;
        if (! $date) return null;

        // Try to detect description
        $description = $row['descripcion'] ?? $row['description'] ?? $row['detalle'] ?? $row['concepto'] ?? 'Sin descripcion';

        // Try to detect amount: separate credit/debit or single amount column
        $credit = (float) ($row['credito'] ?? $row['credit'] ?? $row['deposito'] ?? 0);
        $debit  = (float) ($row['debito'] ?? $row['debit'] ?? $row['retiro'] ?? 0);
        $amount = (float) ($row['monto'] ?? $row['amount'] ?? $row['importe'] ?? 0);

        if ($credit > 0) {
            $finalAmount = $credit;
            $type = 'credit';
        } elseif ($debit > 0) {
            $finalAmount = $debit;
            $type = 'debit';
        } elseif ($amount !== 0.0) {
            $finalAmount = abs($amount);
            $type = $amount >= 0 ? 'credit' : 'debit';
        } else {
            return null;
        }

        // Normalize date
        $parsedDate = $this->parseDate($date);
        if (! $parsedDate) return null;

        return [
            'transaction_date' => $parsedDate,
            'description'      => trim($description),
            'amount'           => round($finalAmount, 2),
            'transaction_type' => $type,
            'reference'        => $row['referencia'] ?? $row['reference'] ?? $row['numero'] ?? null,
            'is_reconciled'    => false,
        ];
    }

    private function parseDate(string $date): ?string
    {
        $formats = ['d/m/Y', 'Y-m-d', 'm/d/Y', 'd-m-Y', 'Y/m/d'];
        foreach ($formats as $format) {
            $d = \DateTime::createFromFormat($format, trim($date));
            if ($d) {
                return $d->format('Y-m-d');
            }
        }
        return null;
    }

    private function parseOfxDate(string $raw): ?string
    {
        // OFX date format: YYYYMMDDHHMMSS[.xxx][timezone]
        if (preg_match('/^(\d{4})(\d{2})(\d{2})/', $raw, $m)) {
            return "{$m[1]}-{$m[2]}-{$m[3]}";
        }
        return null;
    }
}
