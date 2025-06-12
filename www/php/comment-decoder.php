<?php
namespace KrankWeb\CommentDecoder;

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
        $payload = $remainingBytes > 0 ? fread($handle, $remainingBytes) : null; //TODO: decode brush strokes
        return [
            'version' => $version,
            'width' => $width,
            'height' => $height,
            'strokeCount' => $strokeCount,
            'payload' => $payload,
        ];
    } finally {
        fclose($handle);
    }
}
