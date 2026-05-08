<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hacienda_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('environment')->default('staging');
            $table->string('schema_version', 10)->default('4.4');
            $table->string('legal_name');
            $table->string('commercial_name')->nullable();
            $table->string('identification_type', 2);
            $table->string('identification_number', 12);
            $table->string('economic_activity_code', 6);
            $table->string('province', 1);
            $table->string('canton', 2);
            $table->string('district', 2);
            $table->string('barrio', 2)->nullable();
            $table->text('other_signs');
            $table->string('country_code', 3)->default('506');
            $table->string('phone')->nullable();
            $table->string('email');
            $table->string('branch_code', 3)->default('001');
            $table->string('terminal_code', 5)->default('00001');
            $table->unsignedBigInteger('invoice_sequence')->default(0);
            $table->unsignedBigInteger('ticket_sequence')->default(0);
            $table->unsignedBigInteger('credit_note_sequence')->default(0);
            $table->unsignedBigInteger('debit_note_sequence')->default(0);
            $table->string('certificate_path')->nullable();
            $table->text('certificate_pin')->nullable();
            $table->string('api_username')->nullable();
            $table->text('api_password')->nullable();
            $table->boolean('is_active')->default(false);
            $table->timestamps();

            $table->unique(['branch_id', 'environment']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hacienda_settings');
    }
};
