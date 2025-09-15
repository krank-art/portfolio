FROM php:8.3-apache

# Install PDO extension for MySQL/MariaDB
RUN docker-php-ext-install pdo pdo_mysql

# Update and install extensions for libgd
RUN apt-get update && apt-get install -y \
    libpng-dev \
    libjpeg-dev \
    libfreetype6-dev \
    && docker-php-ext-configure gd \
        --with-freetype \
        --with-jpeg \
    && docker-php-ext-install gd

# Install intl extension
RUN apt-get update && apt-get install -y \
    libicu-dev \
    && docker-php-ext-install intl

# Install xdebug for debugging
RUN pecl install xdebug \
 && docker-php-ext-enable xdebug

# Add xdebug config to conf.d
COPY ./xdebug.ini /usr/local/etc/php/conf.d/xdebug.ini

# Use the default development configuration
RUN mv "$PHP_INI_DIR/php.ini-development" "$PHP_INI_DIR/php.ini"

# Enable Apache mod_rewrite if needed
RUN a2enmod rewrite

# Set RewriteLog level via Apache config
RUN echo "LogLevel alert rewrite:trace3" >> /etc/apache2/apache2.conf

# This causes a re-download every time the container is built; that makes dev quite slow but production containers huge
# Since the current pipeline does not involve hosting docker containers, rather mirroring production, we will keep the cache
# # Cleanup of package files
# RUN apt-get clean \
#     && rm -rf /var/lib/apt/lists/*
