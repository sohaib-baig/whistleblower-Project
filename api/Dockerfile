FROM php:8.3-fpm-alpine

ADD https://github.com/mlocati/docker-php-extension-installer/releases/latest/download/install-php-extensions /usr/local/bin/
RUN chmod +x /usr/local/bin/install-php-extensions && \
  install-php-extensions gd pdo_mysql intl zip bcmath

RUN apk add --no-cache bash cronie nginx curl


RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

WORKDIR /var/www/html
COPY . /var/www/html

COPY laravel-cron /etc/crontabs/root

RUN composer install --no-dev --optimize-autoloader

RUN chown -R www-data:www-data /var/www/html && \
  chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache 2>/dev/null || true

RUN rm -f /etc/nginx/http.d/default.conf
RUN mkdir -p /run/nginx

COPY nginx-laravel.conf /etc/nginx/http.d/laravel.conf

EXPOSE 8082


ENTRYPOINT ["sh", "-lc", "\
php artisan migrate --force --ansi && \
crond -n & \
php-fpm -D && \
exec nginx -g 'daemon off;' \
"]
