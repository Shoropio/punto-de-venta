<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('hacienda_settings', function (Blueprint $table) {
            $table->string('callback_url')->nullable()->after('api_password');
        });
    }

    public function down(): void
    {
        Schema::table('hacienda_settings', function (Blueprint $table) {
            $table->dropColumn('callback_url');
        });
    }
};
