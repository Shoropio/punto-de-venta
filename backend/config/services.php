<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'hacienda' => [
        'environment' => env('HACIENDA_ENVIRONMENT', 'staging'),
        'token_url' => env('HACIENDA_TOKEN_URL', 'https://idp.comprobanteselectronicos.go.cr/auth/realms/rut/protocol/openid-connect/token'),
        'production_url' => env('HACIENDA_PRODUCTION_URL', 'https://api.comprobanteselectronicos.go.cr/recepcion/v1'),
        'staging_url' => env('HACIENDA_STAGING_URL', 'https://api.comprobanteselectronicos.go.cr/recepcion-sandbox/v1'),
        'production_client_id' => env('HACIENDA_PRODUCTION_CLIENT_ID', 'api-prod'),
        'staging_client_id' => env('HACIENDA_STAGING_CLIENT_ID', 'api-stag'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'firestore' => [
        'project_id' => env('FIRESTORE_PROJECT_ID'),
        'api_key' => env('FIRESTORE_API_KEY'),
    ],

    'gemini' => [
        'api_key' => env('GEMINI_API_KEY'),
    ],

    'ecommerce' => [
        'woocommerce' => [
            'url' => env('WOO_URL'),
            'key' => env('WOO_KEY'),
            'secret' => env('WOO_SECRET'),
        ],
        'shopify' => [
            'url' => env('SHOPIFY_URL'),
            'token' => env('SHOPIFY_TOKEN'),
        ],
        'mercadolibre' => [
            'access_token' => env('ML_ACCESS_TOKEN'),
            'site_id' => env('ML_SITE_ID', 'MCR'),
        ],
        'google' => [
            'client_id' => env('GOOGLE_CLIENT_ID', ''),
        ],
    ],

];
