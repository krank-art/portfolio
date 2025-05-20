FROM php:8.3-apache

# Install PDO extension for MySQL/MariaDB
RUN docker-php-ext-install pdo pdo_mysql

# Enable Apache mod_rewrite if needed
RUN a2enmod rewrite
