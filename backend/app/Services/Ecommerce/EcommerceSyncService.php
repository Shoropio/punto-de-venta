<?php

namespace App\Services\Ecommerce;

use App\Models\Product;
use App\Models\Setting;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class EcommerceSyncService
{
    private ?string $wooUrl = null;
    private ?string $wooKey = null;
    private ?string $wooSecret = null;
    private ?string $shopifyUrl = null;
    private ?string $shopifyToken = null;
    private ?string $mlAccessToken = null;

    public function __construct()
    {
        $this->wooUrl = config('services.ecommerce.woocommerce.url');
        $this->wooKey = config('services.ecommerce.woocommerce.key');
        $this->wooSecret = config('services.ecommerce.woocommerce.secret');
        $this->shopifyUrl = config('services.ecommerce.shopify.url');
        $this->shopifyToken = config('services.ecommerce.shopify.token');
        $this->mlAccessToken = config('services.ecommerce.mercadolibre.access_token');
    }

    public function pushProduct(Product $product, array $platforms = []): array
    {
        $results = [];

        if (empty($platforms) || in_array('woocommerce', $platforms)) {
            $results['woocommerce'] = $this->pushToWooCommerce($product);
        }

        if (empty($platforms) || in_array('shopify', $platforms)) {
            $results['shopify'] = $this->pushToShopify($product);
        }

        if (empty($platforms) || in_array('mercadolibre', $platforms)) {
            $results['mercadolibre'] = $this->pushToMercadoLibre($product);
        }

        return $results;
    }

    public function pullStock(string $platform): array
    {
        return match ($platform) {
            'woocommerce' => $this->pullFromWooCommerce(),
            'shopify' => $this->pullFromShopify(),
            default => [],
        };
    }

    private function pushToWooCommerce(Product $product): array
    {
        if (! $this->wooUrl || ! $this->wooKey || ! $this->wooSecret) {
            return ['success' => false, 'error' => 'WooCommerce credentials not configured.'];
        }

        try {
            $externalId = $product->meta->get('woo_id');
            $payload = [
                'name' => $product->name,
                'regular_price' => (string) $product->price,
                'sku' => $product->sku,
                'stock_quantity' => (int) $product->stock,
                'manage_stock' => $product->track_stock,
                'description' => $product->description ?? '',
                'status' => $product->is_active ? 'publish' : 'draft',
            ];

            $url = rtrim($this->wooUrl, '/') . '/wp-json/wc/v3/products';
            $auth = ['consumer_key' => $this->wooKey, 'consumer_secret' => $this->wooSecret];

            if ($externalId) {
                $response = Http::withQueryParameters($auth)->put("{$url}/{$externalId}", $payload);
            } else {
                $response = Http::withQueryParameters($auth)->post($url, $payload);
                if ($response->successful()) {
                    $wooId = $response->json('id');
                    if ($wooId) {
                        $product->meta->put('woo_id', $wooId);
                        $product->save();
                    }
                }
            }

            return [
                'success' => $response->successful(),
                'status' => $response->status(),
                'external_id' => $response->json('id'),
            ];
        } catch (\Throwable $e) {
            Log::error('WooCommerce push failed', ['product_id' => $product->id, 'error' => $e->getMessage()]);
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    private function pushToShopify(Product $product): array
    {
        if (! $this->shopifyUrl || ! $this->shopifyToken) {
            return ['success' => false, 'error' => 'Shopify credentials not configured.'];
        }

        try {
            $externalId = $product->meta->get('shopify_id');
            $payload = [
                'product' => [
                    'title' => $product->name,
                    'body_html' => $product->description ?? '',
                    'variants' => [[
                        'price' => (string) $product->price,
                        'sku' => $product->sku,
                        'inventory_quantity' => (int) $product->stock,
                        'inventory_management' => $product->track_stock ? 'shopify' : null,
                    ]],
                    'status' => $product->is_active ? 'active' : 'draft',
                ],
            ];

            $url = rtrim($this->shopifyUrl, '/') . '/admin/api/2024-01';
            $headers = ['X-Shopify-Access-Token' => $this->shopifyToken, 'Content-Type' => 'application/json'];

            if ($externalId) {
                $response = Http::withHeaders($headers)->put("{$url}/products/{$externalId}.json", $payload);
            } else {
                $response = Http::withHeaders($headers)->post("{$url}/products.json", $payload);
                if ($response->successful()) {
                    $shopifyId = $response->json('product.id');
                    if ($shopifyId) {
                        $product->meta->put('shopify_id', $shopifyId);
                        $product->save();
                    }
                }
            }

            return [
                'success' => $response->successful(),
                'status' => $response->status(),
                'external_id' => $response->json('product.id'),
            ];
        } catch (\Throwable $e) {
            Log::error('Shopify push failed', ['product_id' => $product->id, 'error' => $e->getMessage()]);
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    private function pushToMercadoLibre(Product $product): array
    {
        if (! $this->mlAccessToken) {
            return ['success' => false, 'error' => 'Mercado Libre access token not configured.'];
        }

        try {
            $externalId = $product->meta->get('ml_id');
            $siteId = config('services.ecommerce.mercadolibre.site_id', 'MCR');
            $payload = [
                'title' => $product->name,
                'category_id' => $product->meta->get('ml_category', ''),
                'price' => (float) $product->price,
                'currency_id' => 'CRC',
                'available_quantity' => (int) $product->stock,
                'condition' => 'new',
                'listing_type_id' => 'gold_pro',
            ];

            $headers = ['Authorization' => 'Bearer ' . $this->mlAccessToken, 'Content-Type' => 'application/json'];

            if ($externalId) {
                $response = Http::withHeaders($headers)->put("https://api.mercadolibre.com/items/{$externalId}", $payload);
            } else {
                $payload['site_id'] = $siteId;
                $response = Http::withHeaders($headers)->post('https://api.mercadolibre.com/items', $payload);
                if ($response->successful()) {
                    $mlId = $response->json('id');
                    if ($mlId) {
                        $product->meta->put('ml_id', $mlId);
                        $product->save();
                    }
                }
            }

            return [
                'success' => $response->successful(),
                'status' => $response->status(),
                'external_id' => $response->json('id'),
            ];
        } catch (\Throwable $e) {
            Log::error('Mercado Libre push failed', ['product_id' => $product->id, 'error' => $e->getMessage()]);
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    private function pullFromWooCommerce(): array
    {
        if (! $this->wooUrl || ! $this->wooKey || ! $this->wooSecret) {
            return [];
        }

        try {
            $url = rtrim($this->wooUrl, '/') . '/wp-json/wc/v3/products';
            $response = Http::withQueryParameters([
                'consumer_key' => $this->wooKey,
                'consumer_secret' => $this->wooSecret,
                'per_page' => 100,
            ])->get($url);

            if (! $response->successful()) {
                return [];
            }

            $updates = [];
            foreach ($response->json() as $wooProduct) {
                $product = Product::where('sku', $wooProduct['sku'] ?? '')->first();
                if ($product && isset($wooProduct['stock_quantity'])) {
                    $product->update(['stock' => $wooProduct['stock_quantity']]);
                    $product->meta->put('woo_id', $wooProduct['id']);
                    $product->save();
                    $updates[] = $product->id;
                }
            }

            return $updates;
        } catch (\Throwable $e) {
            Log::error('WooCommerce pull failed', ['error' => $e->getMessage()]);
            return [];
        }
    }

    private function pullFromShopify(): array
    {
        if (! $this->shopifyUrl || ! $this->shopifyToken) {
            return [];
        }

        try {
            $url = rtrim($this->shopifyUrl, '/') . '/admin/api/2024-01/products.json';
            $response = Http::withHeaders([
                'X-Shopify-Access-Token' => $this->shopifyToken,
            ])->get($url, ['limit' => 250]);

            if (! $response->successful()) {
                return [];
            }

            $updates = [];
            foreach ($response->json('products', []) as $shopifyProduct) {
                $variant = $shopifyProduct['variants'][0] ?? null;
                if (! $variant) continue;

                $product = Product::where('sku', $variant['sku'] ?? '')->first();
                if ($product && isset($variant['inventory_quantity'])) {
                    $product->update(['stock' => $variant['inventory_quantity']]);
                    $product->meta->put('shopify_id', $shopifyProduct['id']);
                    $product->save();
                    $updates[] = $product->id;
                }
            }

            return $updates;
        } catch (\Throwable $e) {
            Log::error('Shopify pull failed', ['error' => $e->getMessage()]);
            return [];
        }
    }
}
