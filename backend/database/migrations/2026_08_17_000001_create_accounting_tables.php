<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Accounting accounts catalog (catálogo de cuentas)
        Schema::create('accounting_accounts', function (Blueprint $table) {
            $table->id();
            $table->string('code', 20)->unique();
            $table->string('name', 160);
            $table->enum('type', ['asset', 'liability', 'equity', 'income', 'expense']);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Journal entries (asientos contables)
        Schema::create('accounting_entries', function (Blueprint $table) {
            $table->id();
            $table->string('reference', 80)->nullable();
            $table->string('description', 255);
            $table->date('entry_date');
            $table->string('source_type', 60)->nullable(); // sale, refund, credit_payment, etc.
            $table->unsignedBigInteger('source_id')->nullable();
            $table->timestamps();
        });

        // Journal items (líneas de partida doble)
        Schema::create('accounting_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('entry_id')->constrained('accounting_entries')->cascadeOnDelete();
            $table->foreignId('account_id')->constrained('accounting_accounts')->restrictOnDelete();
            $table->decimal('debit', 14, 2)->default(0);
            $table->decimal('credit', 14, 2)->default(0);
            $table->string('description', 255)->nullable();
            $table->timestamps();
        });

        // Bank accounts
        Schema::create('bank_accounts', function (Blueprint $table) {
            $table->id();
            $table->string('bank_name', 100);
            $table->string('account_number', 30)->nullable();
            $table->string('account_type', 30)->nullable(); // corriente, ahorro
            $table->string('currency', 10)->default('CRC');
            $table->decimal('balance', 14, 2)->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Bank statement imports
        Schema::create('bank_statement_lines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bank_account_id')->constrained('bank_accounts')->cascadeOnDelete();
            $table->date('transaction_date');
            $table->string('description', 255);
            $table->decimal('amount', 14, 2);
            $table->string('transaction_type', 20); // credit, debit
            $table->string('reference', 80)->nullable();
            $table->boolean('is_reconciled')->default(false);
            $table->unsignedBigInteger('reconciled_with_id')->nullable(); // sale_id, etc.
            $table->string('reconciled_with_type', 60)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bank_statement_lines');
        Schema::dropIfExists('bank_accounts');
        Schema::dropIfExists('accounting_items');
        Schema::dropIfExists('accounting_entries');
        Schema::dropIfExists('accounting_accounts');
    }
};
