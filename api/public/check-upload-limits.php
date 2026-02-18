<?php
/**
 * PHP Upload Limits Diagnostic Tool
 * 
 * This script helps diagnose PHP upload configuration issues.
 * Access it at: http://127.0.0.1:8082/check-upload-limits.php
 */

header('Content-Type: application/json');

$phpIniFile = php_ini_loaded_file();
$phpIniScannedFiles = php_ini_scanned_files();

$settings = [
    'post_max_size' => [
        'current' => ini_get('post_max_size'),
        'bytes' => return_bytes(ini_get('post_max_size')),
        'recommended' => '24M',
        'recommended_bytes' => 24 * 1024 * 1024,
        'can_change' => false, // Cannot be changed via ini_set()
        'note' => 'Must be set in php.ini file. This is the maximum POST data size.',
    ],
    'upload_max_filesize' => [
        'current' => ini_get('upload_max_filesize'),
        'bytes' => return_bytes(ini_get('upload_max_filesize')),
        'recommended' => '20M',
        'recommended_bytes' => 20 * 1024 * 1024,
        'can_change' => true,
        'note' => 'Maximum size of uploaded files. Should be less than post_max_size.',
    ],
    'memory_limit' => [
        'current' => ini_get('memory_limit'),
        'bytes' => return_bytes(ini_get('memory_limit')),
        'recommended' => '256M',
        'recommended_bytes' => 256 * 1024 * 1024,
        'can_change' => true,
        'note' => 'Memory limit for PHP scripts.',
    ],
    'max_execution_time' => [
        'current' => ini_get('max_execution_time'),
        'recommended' => '300',
        'can_change' => true,
        'note' => 'Maximum execution time in seconds.',
    ],
    'max_input_time' => [
        'current' => ini_get('max_input_time'),
        'recommended' => '300',
        'can_change' => true,
        'note' => 'Maximum input parsing time in seconds.',
    ],
];

// Check if settings meet recommendations
$issues = [];
$warnings = [];

foreach ($settings as $key => $setting) {
    if (isset($setting['bytes'])) {
        $currentBytes = $setting['bytes'];
        $recommendedBytes = $setting['recommended_bytes'] ?? 0;
        
        if ($currentBytes < $recommendedBytes) {
            $issues[] = [
                'setting' => $key,
                'current' => $setting['current'],
                'recommended' => $setting['recommended'],
                'can_fix_via_ini_set' => $setting['can_change'] ?? false,
                'note' => $setting['note'] ?? '',
            ];
        }
    }
}

// Special check: post_max_size should be larger than upload_max_filesize
$postMaxBytes = $settings['post_max_size']['bytes'];
$uploadMaxBytes = $settings['upload_max_filesize']['bytes'];

if ($postMaxBytes < $uploadMaxBytes) {
    $warnings[] = 'post_max_size (' . $settings['post_max_size']['current'] . ') should be larger than upload_max_filesize (' . $settings['upload_max_filesize']['current'] . ')';
}

// Detect PHP installation type
$phpIniPath = $phpIniFile;
$isHomebrew = strpos($phpIniPath, '/opt/homebrew') !== false || strpos($phpIniPath, '/usr/local') !== false;
$isMamp = strpos($phpIniPath, '/Applications/MAMP') !== false;
$isSystem = strpos($phpIniPath, '/etc/php') !== false && !$isHomebrew;

$recommendations = [];

if ($isHomebrew) {
    $recommendations['For Homebrew PHP'] = [
        '1. Open the php.ini file in a text editor:',
        '   ' . $phpIniPath,
        '',
        '2. Find and update these lines (search for each setting):',
        '   post_max_size = 24M',
        '   upload_max_filesize = 20M',
        '   memory_limit = 256M',
        '   max_execution_time = 300',
        '   max_input_time = 300',
        '',
        '3. Save the file',
        '',
        '4. Restart your PHP server:',
        '   If using "php artisan serve", stop it (Ctrl+C) and restart it',
        '',
        'Quick edit command:',
        '   nano ' . $phpIniPath,
        '   (or use: code ' . $phpIniPath . ' for VS Code)',
    ];
} elseif ($isMamp) {
    $recommendations['For MAMP users'] = [
        '1. Open MAMP application',
        '2. Click "File" > "Edit Template" > "PHP" > "php' . PHP_MAJOR_VERSION . '.' . PHP_MINOR_VERSION . '.ini"',
        '3. Find and update these lines:',
        '   post_max_size = 24M',
        '   upload_max_filesize = 20M',
        '   memory_limit = 256M',
        '   max_execution_time = 300',
        '   max_input_time = 300',
        '4. Save the file and restart MAMP servers',
        '',
        'Alternative: Edit the file directly at:',
        $phpIniPath,
    ];
} else {
    $recommendations['General Instructions'] = [
        '1. Edit the php.ini file:',
        '   ' . $phpIniPath,
        '',
        '2. Find and update these lines:',
        '   post_max_size = 24M',
        '   upload_max_filesize = 20M',
        '   memory_limit = 256M',
        '   max_execution_time = 300',
        '   max_input_time = 300',
        '',
        '3. Save and restart your PHP server',
    ];
}

if (php_sapi_name() === 'cli-server') {
    $recommendations['Note'] = [
        'You are using "php artisan serve" (cli-server).',
        'After editing php.ini, restart the server with:',
        '   php artisan serve --host 127.0.0.1 --port 8082',
    ];
}

$response = [
    'status' => empty($issues) ? 'ok' : 'issues_found',
    'php_version' => PHP_VERSION,
    'php_ini_loaded_file' => $phpIniFile,
    'php_ini_scanned_files' => $phpIniScannedFiles ? explode(',', $phpIniScannedFiles) : [],
    'server_api' => php_sapi_name(),
    'php_installation_type' => $isHomebrew ? 'Homebrew' : ($isMamp ? 'MAMP' : 'System'),
    'settings' => $settings,
    'issues' => $issues,
    'warnings' => $warnings,
    'recommendations' => $recommendations,
];

echo json_encode($response, JSON_PRETTY_PRINT);

/**
 * Convert PHP ini size format to bytes
 */
function return_bytes($val) {
    $val = trim($val);
    $last = strtolower($val[strlen($val)-1]);
    $val = (int) $val;
    
    switch($last) {
        case 'g':
            $val *= 1024;
        case 'm':
            $val *= 1024;
        case 'k':
            $val *= 1024;
    }
    
    return $val;
}


