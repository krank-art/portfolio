<?php

namespace KrankWeb\CommentDecoder;

// INFO: Make sure to mirror all changes here in /lib/comment-file.js
// This is the server side decoding and encoding. When we receive the comment history, we want to guarantee that the
// received binary data is actually to the comment history file spec. It's a security risk to just accept arbitrary
// binary data without proper authorization (users having to create accounts).

function readUInt(string $data, int $bits, bool $littleEndian = true): int
{
    if (!in_array($bits, [8, 16, 32, 64], true))
        throw new \InvalidArgumentException("Unsupported bit size: $bits");
    $dataLength = strlen($data);
    $byteLength = $bits / 8;
    if ($dataLength < $byteLength)
        throw new \InvalidArgumentException("Bytes being read too small, is $dataLength but expected $byteLength");
    switch ($bits) {
        case 8:
            return unpack('C', $data)[1]; // unsigned 8-bit
        case 16:
            return unpack($littleEndian ? 'v' : 'n', $data)[1]; // 16-bit LE or BE
        case 32:
            return unpack($littleEndian ? 'V' : 'N', $data)[1]; // 32-bit LE or BE
        case 64:
            // PHP doesn't support native 64-bit unpack; use workaround
            $parts = unpack($littleEndian ? 'Vlow/Vhigh' : 'Nhigh/Nlow', $data);
            return ($parts['high'] << 32) | $parts['low'];
        default:
            throw new \InvalidArgumentException("Unsupported bit size: $bits");
    }
}

function readFileBytesAsUInt($handle, int $bits, bool $littleEndian = true)
{
    $byteLength = $bits / 8;
    $data = fread($handle, $byteLength);
    if (strlen($data) !== $byteLength) {
        fclose($handle);
        return false;
    }
    return readUInt($data, $bits, $littleEndian);
}

function decodeCommentFile(string $file): array|false
{
    $handle = fopen($file, 'rb');
    if (!$handle)
        throw new \RuntimeException("Failed to open file.");
    try {
        // Step 1: Read Magic Number (4 bytes)
        $magic = fread($handle, 4);
        if ($magic !== "BRSH") {
            fclose($handle);
            throw new \Exception("Unknown file type");
        }

        $version = readFileBytesAsUInt($handle, 16, true);
        $width = readFileBytesAsUInt($handle, 16, true);
        $height = readFileBytesAsUInt($handle, 16, true);
        $strokeCount = readFileBytesAsUInt($handle, 32, true);
        $crcValueFile = readFileBytesAsUInt($handle, 16, true); //TODO: verify CRC
        
        // Sanity check on length (avoid memory issues)
        // Canvas dimensions are 320 x 120.
        // When user paints at each (x|y), thats 38,400 strokes. Each coordinate is a nibble, together a byte.
        // So that would be 38,400 bytes. 128KB / 38,400B = 3.41, that means if the user drew over each single
        // pixel 3 times, they would reach the limit. This is a rough estimate of course, because coordinates
        // can also take up more than one nibble and we get overhead for the stroke headers and file heading.
        $sizeLimit = 128 * 1024; // 128KB
        $fileSize = fstat($handle)['size'];
        if ($fileSize > $sizeLimit) {
            fclose($handle);
            throw new \Exception("File has exceeded max size of " . $sizeLimit / 1024 . " KB");
        }

        // Step 4: Read Payload
        $currentOffset = ftell($handle);
        $remainingBytes = $fileSize - $currentOffset;
        //$payload = $remainingBytes > 0 ? fread($handle, $remainingBytes) : null; //TODO: decode brush strokes
        $strokes = decodeStrokesFromHandle($handle);
        return [
            'version' => $version,
            'width' => $width,
            'height' => $height,
            'strokeCount' => $strokeCount,
            'strokes' => $strokes,
        ];
    } finally {
        fclose($handle);
    }
}

$brushMap = ["undefined" => 0b00, "brush" => 0b01, "eraser" => 0b10, "clear" => 0b11];
$patternMap = ["100%" => 0b00, "75%" => 0b01, "50%" => 0b10, "25%" => 0b11];
$brushMapInverted = array_flip($brushMap); // Invert the arrays (value => key)
$patternMapInverted = array_flip($patternMap);

function decodeBrushInfo($byte)
{
    global $brushMapInverted, $patternMapInverted;
    $brushType = ($byte >> 6) & 0b11;
    $pattern = ($byte >> 4) & 0b11;
    $size = $byte & 0b1111;
    $brush = $brushMapInverted[$brushType];
    if ($brush === "undefined")
        trigger_error("Brush 'undefined' should not be set", E_USER_WARNING);
    return [
        'brush' => $brush,
        'pattern' => $patternMapInverted[$pattern],
        'size' => $size
    ];
}

function decodeStrokesFromHandle($handle): array {
    $strokes = [];

    while (!feof($handle)) {
        $brushInfoByte = fread($handle, 1);
        if (strlen($brushInfoByte) < 1) break; // End of file
        $brushInfo = ord($brushInfoByte);
        ['brush' => $brush, 'pattern' => $pattern, 'size' => $size] = decodeBrushInfo($brushInfo);
        $pointCount = readFileBytesAsUInt($handle, 16, true);
        // We specifically do NOT want falsy values, rather check precisely for false
        if ($pointCount === false) break;
        $crcByte = readFileBytesAsUInt($handle, 8, true); // TODO: Validate CRC
        if ($crcByte === false) break;
        $nibbleCount = $pointCount * 2;
        $nibbleLEBs = [];
        $currentNibbleLEB = [];
        while (count($nibbleLEBs) < $nibbleCount && !feof($handle)) {
            $byte = fread($handle, 1);
            if (strlen($byte) < 1) break;
            $byteVal = ord($byte);
            $nibbles = [($byteVal & 0xF0) >> 4, $byteVal & 0x0F];
            foreach ($nibbles as $nibble) {
                if (count($nibbleLEBs) >= $nibbleCount) break;
                $isLeadingGroup = ($nibble & 0b1000) === 0b1000;
                $currentNibbleLEB[] = $nibble;
                if ($isLeadingGroup) continue;
                $nibbleLEBs[] = $currentNibbleLEB;
                $currentNibbleLEB = [];
            }
        }

        // Decode deltas from LEB8
        $path = [];
        $prevX = 0;
        $prevY = 0;
        for ($i = 0; $i < count($nibbleLEBs); $i += 2) {
            $dx = decodeSignedLEB8($nibbleLEBs[$i]);
            $dy = decodeSignedLEB8($nibbleLEBs[$i + 1]);
            $x = $prevX + $dx;
            $y = $prevY + $dy;
            $path[] = ['x' => $x, 'y' => $y];
            $prevX = $x;
            $prevY = $y;
        }
        $strokes[] = [
            'brush' => $brush,
            'pattern' => $pattern,
            'size' => $size,
            'path' => $path
        ];
    }

    return $strokes;
}

function decodeSignedLEB8(array $nibbles): int {
    $shift = 0;
    $result = 0;
    $value = 0;
    foreach ($nibbles as $nibble) {
        $value = $nibble & 0x7;
        $result |= ($value << $shift);
        $shift += 3;
        if (($nibble & 0x8) === 0) break;
    }
    // Sign extension if bit 2 (0x4) is set in the final data nibble
    $bitsPerInteger = PHP_INT_SIZE * 8; // 2^32 for 32bit machines and 2^64 for 64bit machines
    if ($shift < $bitsPerInteger && ($value & 0x4))
        $result |= (~0 << $shift);
    return $result;
}
