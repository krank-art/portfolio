<?php
$mimeTypes = [
  // Text and HTML
  'html' => 'text/html',
  'htm'  => 'text/html',
  'txt'  => 'text/plain',
  'css'  => 'text/css',
  'js'   => 'application/javascript',
  'json' => 'application/json',
  'xml'  => 'application/xml',
  
  // Images
  'jpg'  => 'image/jpeg',
  'jpeg' => 'image/jpeg',
  'png'  => 'image/png',
  'gif'  => 'image/gif',
  'bmp'  => 'image/bmp',
  'svg'  => 'image/svg+xml',
  'ico'  => 'image/x-icon',
  'webp' => 'image/webp',
  
  // Audio and Video
  'mp3'  => 'audio/mpeg',
  'wav'  => 'audio/wav',
  'mp4'  => 'video/mp4',
  'avi'  => 'video/x-msvideo',
  'webm' => 'video/webm',
  'ogg'  => 'audio/ogg',
  'm4a'  => 'audio/mp4',
  
  // Application files
  'pdf'  => 'application/pdf',
  'zip'  => 'application/zip',
  'rar'  => 'application/x-rar-compressed',
  'exe'  => 'application/octet-stream',
  'doc'  => 'application/msword',
  'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'xls'  => 'application/vnd.ms-excel',
  'xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'ppt'  => 'application/vnd.ms-powerpoint',
  'pptx' => 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'odt'  => 'application/vnd.oasis.opendocument.text',
  'ods'  => 'application/vnd.oasis.opendocument.spreadsheet',
  'odp'  => 'application/vnd.oasis.opendocument.presentation',
  
  // Font files
  'ttf'  => 'font/ttf',
  'otf'  => 'font/otf',
  'woff' => 'font/woff',
  'woff2'=> 'font/woff2',
  
  // Other
  'csv'  => 'text/csv',
  'rtf'  => 'application/rtf',
];

function getMimeType($extension) {
  global $mimeTypes;
  if (!isset($extension) || $extension === '')
    return $mimeTypes['html'];
  if (!isset($mimeTypes[$extension]))
    return 'application/octet-stream';
  return $mimeTypes[$extension];
}

// Get request URL
$request_uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$request_uri = trim($request_uri, '/');
if ($request_uri === '') 
  $request_uri = 'index';

// Supplement '.html' if no route provided
$extension = pathinfo($request_uri, PATHINFO_EXTENSION);
$hasExtension = isset($extension) && $extension !== '';
$suffix = $hasExtension ? '' : '.html';
$file_path = $_SERVER['DOCUMENT_ROOT'] . "/" . $request_uri . $suffix;

// Log to console for debugging
//error_log($request_uri . "--" . $hasExtension . $extension . $file_path);

// Check if the file exists
if (file_exists($file_path)) {
  header("Content-Type: " . getMimeType($extension));
  readfile($file_path);
} else {
  // Serve the 404 page if the file doesn't exist
  echo "Could not find '$file_path'";
  header("HTTP/1.1 404 Not Found");
  include $_SERVER['DOCUMENT_ROOT'] . '/404.html';
}
