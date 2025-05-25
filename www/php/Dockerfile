FROM php:8.3-apache

# Install PDO extension for MySQL/MariaDB
RUN docker-php-ext-install pdo pdo_mysql

# Use the default development configuration
RUN mv "$PHP_INI_DIR/php.ini-development" "$PHP_INI_DIR/php.ini"

# Enable Apache mod_rewrite if needed
RUN a2enmod rewrite
