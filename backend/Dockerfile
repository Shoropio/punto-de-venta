FROM php:8.4-cli

RUN apt-get update \
    && apt-get install -y git unzip libzip-dev libpq-dev \
    && docker-php-ext-install pdo_mysql pdo_pgsql zip \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app

COPY composer.json composer.lock ./
RUN composer install --no-interaction --prefer-dist --no-dev --no-scripts --optimize-autoloader

COPY . .
RUN composer dump-autoload --optimize && php artisan package:discover --ansi

EXPOSE 8000

CMD php artisan migrate --force && php artisan serve --host=0.0.0.0 --port=8000
