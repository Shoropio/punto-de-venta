<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Employees table
        Schema::create('employees', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('name', 160);
            $table->string('identification', 20)->nullable();
            $table->string('position', 100)->nullable();
            $table->string('department', 100)->nullable();
            $table->string('phone', 30)->nullable();
            $table->string('email', 180)->nullable();
            $table->date('hire_date')->nullable();
            $table->string('pin', 10)->nullable(); // For clock-in/out
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Attendance records
        Schema::create('attendances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->cascadeOnDelete();
            $table->date('work_date');
            $table->timestamp('clock_in')->nullable();
            $table->timestamp('clock_out')->nullable();
            $table->string('notes', 255)->nullable();
            $table->timestamps();
        });

        // WhatsApp configuration
        Schema::create('whatsapp_settings', function (Blueprint $table) {
            $table->id();
            $table->enum('driver', ['meta', 'baileys'])->default('meta');
            $table->string('phone_number_id', 80)->nullable();   // Meta Cloud API
            $table->text('access_token')->nullable();             // Meta Cloud API
            $table->string('baileys_endpoint', 255)->nullable();  // Baileys gateway URL
            $table->boolean('is_active')->default(false);
            $table->timestamp('qr_connected_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('whatsapp_settings');
        Schema::dropIfExists('attendances');
        Schema::dropIfExists('employees');
    }
};
