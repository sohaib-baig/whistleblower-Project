<?php

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;

// Increase PHP upload limits to allow 20MB+ file uploads
// Note: post_max_size cannot be changed via ini_set() - it must be set in php.ini
// For Homebrew PHP: Edit /opt/homebrew/etc/php/[version]/php.ini
// For MAMP users: Edit /Applications/MAMP/bin/php/php[version]/conf/php.ini
// Set: post_max_size = 24M and upload_max_filesize = 20M
ini_set('upload_max_filesize', '20M'); // This may not work if set in php.ini
ini_set('memory_limit', '256M');
ini_set('max_execution_time', '300');
ini_set('max_input_time', '300');

define('LARAVEL_START', microtime(true));

// Determine if the application is in maintenance mode...
if (file_exists($maintenance = __DIR__.'/../storage/framework/maintenance.php')) {
    require $maintenance;
}

// Register the Composer autoloader...
require __DIR__.'/../vendor/autoload.php';

// Bootstrap Laravel and handle the request...
/** @var Application $app */
$app = require_once __DIR__.'/../bootstrap/app.php';

$app->handleRequest(Request::capture());
