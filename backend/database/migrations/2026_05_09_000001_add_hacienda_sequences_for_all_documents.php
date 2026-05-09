<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('hacienda_settings', function (Blueprint $table) {
            $table->unsignedBigInteger('purchase_invoice_sequence')->default(0)->after('debit_note_sequence');
            $table->unsignedBigInteger('export_invoice_sequence')->default(0)->after('purchase_invoice_sequence');
            $table->unsignedBigInteger('payment_receipt_sequence')->default(0)->after('export_invoice_sequence');
        });
    }

    public function down(): void
    {
        Schema::table('hacienda_settings', function (Blueprint $table) {
            $table->dropColumn([
                'purchase_invoice_sequence',
                'export_invoice_sequence',
                'payment_receipt_sequence',
            ]);
        });
    }
};
