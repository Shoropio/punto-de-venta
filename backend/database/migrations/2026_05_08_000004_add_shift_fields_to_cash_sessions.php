<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cash_sessions', function (Blueprint $table) {
            $table->string('shift')->nullable()->after('user_id');
            $table->string('supervisor_name')->nullable()->after('shift');
            $table->timestamp('supervisor_confirmed_at')->nullable()->after('supervisor_name');
        });
    }

    public function down(): void
    {
        Schema::table('cash_sessions', function (Blueprint $table) {
            $table->dropColumn(['shift', 'supervisor_name', 'supervisor_confirmed_at']);
        });
    }
};
