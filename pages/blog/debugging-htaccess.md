# Debugging `.htaccess` files
Written on 2025-05-25

**Have you ever been sitting there in complete desperation, trying to get the routing to work of an Apache server?
Failed again and again after  trying to isolate the problem?**
Well I certainly have, and not just once!
But fret not, there is a way to make debugging easier.

Just run a local Docker container with a PHP server and enabled logging in it!

You could just run the PHP server without Docker, but getting a local PHP installation to run and then configure it's `php.ini`  has been such a hassle for me on the Windows.
So like any sensible person, I'm going to use Docker on Windows, which utilizes *Windows Subsystem for Linux (WSL)*.

There are actually multiple ways to configure routing on an Apache server.
My current hosting plan gives me access to a managed webserver  with very restricted configuration options.
So to configure routing I have to use [`.htaccess`](https://httpd.apache.org/docs/current/howto/htaccess.html).

Another helpful tool is using https://htaccess.madewithlove.com/, an online `.htaccess` tester.
It helps spotting the most obvious routing issues, but it doesn't take into account what actual paths and files you have on your webserver.
For this you actually need to run a local PHP server.


## Installation

1. Install [Docker](https://www.docker.com/).
   * Make sure you have [Hyper-V](https://learn.microsoft.com/en-us/windows-server/virtualization/hyper-v/get-started/install-hyper-v?pivots=windows) enabled.
      This feature is only available for Windows 10 (Pro or Enterprise) or Windows 11 (Pro or Enterprise).
   * Otherwise followed the [installation steps for Docker](https://docs.docker.com/desktop/setup/install/windows-install/).
2. Create a new file 
   `docker-compose.yml`:
   ```yml
   version: '3.8'
   
   services:
   php:
       build: .
       container_name: phpserver
       ports:
       - "8080:80"
       volumes:
       - ./php:/var/www/html
   ```
3. Create a new file `Dockerfile`:
   ```Dockerfile
   FROM php:8.3-apache
   
   # Use the default development configuration
   RUN mv "$PHP_INI_DIR/php.ini-development" "$PHP_INI_DIR/php.ini"
   
   # Enable Apache mod_rewrite if needed
   RUN a2enmod rewrite
   
   # Set RewriteLog level via Apache config
   RUN echo "LogLevel alert rewrite:trace3" >> /etc/apache2/apache2.conf
   ```
4. Run `docker-compose up -d --build`  to build the containers. This takes a few minutes.
5. Connect to the PHP server logging with `docker logs -f phpserver`.
6. Open your browser and go to http://localhost:8080.


## Example 

```
add path info postfix: /var/www/html/art -> /var/www/html/art/alpaca-cute-pink
strip per-dir prefix: /var/www/html/art/alpaca-cute-pink -> art/alpaca-cute-pink
applying pattern '(.+)/([?#].*)?$' to uri 'art/alpaca-cute-pink'
add path info postfix: /var/www/html/art -> /var/www/html/art/alpaca-cute-pink
strip per-dir prefix: /var/www/html/art/alpaca-cute-pink -> art/alpaca-cute-pink
applying pattern '^(?!.*\\.\\w{2,5}$)(.+)' to uri 'art/alpaca-cute-pink'
add path info postfix: /var/www/html/art -> /var/www/html/art/alpaca-cute-pink
strip per-dir prefix: /var/www/html/art/alpaca-cute-pink -> art/alpaca-cute-pink
applying pattern '^(?!.*\\.\\w{2,5}$)(.+)' to uri 'art/alpaca-cute-pink'
rewrite 'art/alpaca-cute-pink' -> 'art/alpaca-cute-pink.html'
add per-dir prefix: art/alpaca-cute-pink.html -> /var/www/html/art/alpaca-cute-pink.html
setting lastsub to rule with output $1.html
strip document_root prefix: /var/www/html/art/alpaca-cute-pink.html -> /art/alpaca-cute-pink.html
internal redirect with /art/alpaca-cute-pink.html [INTERNAL REDIRECT]
add path info postfix: /var/www/html/art -> /var/www/html/art/alpaca-cute-pink.html
strip per-dir prefix: /var/www/html/art/alpaca-cute-pink.html -> art/alpaca-cute-pink.html
applying pattern '(.+)/([?#].*)?$' to uri 'art/alpaca-cute-pink.html'
add path info postfix: /var/www/html/art -> /var/www/html/art/alpaca-cute-pink.html
strip per-dir prefix: /var/www/html/art/alpaca-cute-pink.html -> art/alpaca-cute-pink.html
applying pattern '^(?!.*\\.\\w{2,5}$)(.+)' to uri 'art/alpaca-cute-pink.html'
add path info postfix: /var/www/html/art -> /var/www/html/art/alpaca-cute-pink.html
strip per-dir prefix: /var/www/html/art/alpaca-cute-pink.html -> art/alpaca-cute-pink.html
applying pattern '^(?!.*\\.\\w{2,5}$)(.+)' to uri 'art/alpaca-cute-pink.html'
pass through /var/www/html/art
strip per-dir prefix: /var/www/html/404.html -> 404.html
applying pattern '(.+)/([?#].*)?$' to uri '404.html'
strip per-dir prefix: /var/www/html/404.html -> 404.html
applying pattern '^(?!.*\\.\\w{2,5}$)(.+)' to uri '404.html'
strip per-dir prefix: /var/www/html/404.html -> 404.html
applying pattern '^(?!.*\\.\\w{2,5}$)(.+)' to uri '404.html'
pass through /var/www/html/404.html
2025-05-25 22:08:12 172.19.0.1 - - [25/May/2025:20:08:12 +0000] "GET /art/alpaca-cute-pink HTTP/1.1" 404 609 "-" "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:138.0) Gecko/20100101 Firefox/138.0"
```
