<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->string('cabys_code', 13)->nullable()->after('barcode');
            $table->string('hacienda_unit_code', 15)->default('Unid')->after('unit');
            $table->string('hacienda_tax_code', 2)->default('01')->after('tax_rate');
            $table->string('hacienda_tax_rate_code', 2)->nullable()->after('hacienda_tax_code');
        });

        Schema::table('customers', function (Blueprint $table) {
            $table->string('identification_type', 2)->nullable()->after('name');
            $table->string('identification_number', 12)->nullable()->after('identification_type');
            $table->string('province', 1)->nullable()->after('address');
            $table->string('canton', 2)->nullable()->after('province');
            $table->string('district', 2)->nullable()->after('canton');
            $table->string('barrio', 2)->nullable()->after('district');
            $table->text('other_signs')->nullable()->after('barrio');
        });

        Schema::table('sales', function (Blueprint $table) {
            $table->string('hacienda_document_type', 2)->nullable()->after('folio');
            $table->string('hacienda_status')->nullable()->after('hacienda_document_type');
        });

        Schema::table('invoices', function (Blueprint $table) {
            $table->string('document_type', 2)->default('01')->after('folio');
            $table->string('schema_version', 10)->default('4.4')->after('document_type');
            $table->string('clave', 50)->nullable()->unique()->after('schema_version');
            $table->string('numero_consecutivo', 20)->nullable()->unique()->after('clave');
            $table->string('security_code', 8)->nullable()->after('numero_consecutivo');
            $table->string('hacienda_status')->default('draft')->after('status');
            $table->string('xml_path')->nullable()->after('metadata');
            $table->string('signed_xml_path')->nullable()->after('xml_path');
            $table->string('hacienda_response_path')->nullable()->after('signed_xml_path');
            $table->json('hacienda_response')->nullable()->after('hacienda_response_path');
            $table->timestamp('submitted_at')->nullable()->after('issued_at');
            $table->timestamp('accepted_at')->nullable()->after('submitted_at');
            $table->timestamp('rejected_at')->nullable()->after('accepted_at');
        });
    }

    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropUnique(['clave']);
            $table->dropUnique(['numero_consecutivo']);
            $table->dropColumn([
                'document_type',
                'schema_version',
                'clave',
                'numero_consecutivo',
                'security_code',
                'hacienda_status',
                'xml_path',
                'signed_xml_path',
                'hacienda_response_path',
                'hacienda_response',
                'submitted_at',
                'accepted_at',
                'rejected_at',
            ]);
        });

        Schema::table('sales', function (Blueprint $table) {
            $table->dropColumn(['hacienda_document_type', 'hacienda_status']);
        });

        Schema::table('customers', function (Blueprint $table) {
            $table->dropColumn([
                'identification_type',
                'identification_number',
                'province',
                'canton',
                'district',
                'barrio',
                'other_signs',
            ]);
        });

        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn([
                'cabys_code',
                'hacienda_unit_code',
                'hacienda_tax_code',
                'hacienda_tax_rate_code',
            ]);
        });
    }
};
