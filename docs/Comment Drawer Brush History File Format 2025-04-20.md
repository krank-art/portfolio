1st byte -- stroke info
0000 0000
^ ^     ^
| |     L brush size 00000 (2^5 = 32; 0 - 31 max uint)
| L pattern 00 (00: solid, 01: 75%, 10: 50%, 11: 25%)
L brush type 0 (0: eraser, 1: brush)

2nd byte -- stroke length
0000 0000  just an uint8

variable amounts of bytes encoded in LEB128 + Delta Encoding
the stroke length also gets doubled because we have an x and y coordinate
LEB128 gives us 2^7 = 128 (128 - 1 = 127) possible numbers per single byte
our artboard has the dimensions of 320x120 pixel, so only on very big strokes
we actually need two bytes to cover the distance.
additionally we use delta encoding, so the values should be rather smol
that gives us 2^6 as range for a single byte tho (-64 to +63).
and for two bytes 2^13 = -8192 to +8191
0000

🧱 Binary Brush Stroke Format Overview
1. File Header (fixed-size)

| Field         | Size    | Type         | Description                 |
|---------------|---------|--------------|-----------------------------|
| Magic bytes   | 4 bytes | char[4]      | "BRSH" to identify the file |
| Version       | 2 bytes | uint16       | Format version              |
| Canvas width  | 2 bytes | uint16       | Width in pixels             |
| Canvas height | 2 bytes | uint16       | Height in pixels            |
| Stroke count  | N bytes | LEB128(uint) | Number of strokes           |

1. Stroke Block (repeated)

Each stroke includes metadata and a list of points.

Stroke Header:
| Field       | Size     | Type  | Description                         |
|-------------|----------|-------|-------------------------------------|
| Brush info  | 1 byte   | multi |                                     |
| Brush ID    | - 1 bit  | bit   | brush type (0: eraser, 1: brush)    |
| Pattern     | - 2 bits | uint2 | 00: 100%, 01: 75%, 10: 50%, 11: 25% |
| Brush size  | - 5 bits | uint5 | Brush diameter                      |
| Point count | 1 byte   | uint8 | Number of points in stroke          |

Point Data (1st point):
| Field | Size    | Type         | Description                    |
|-------|---------|--------------|--------------------------------|
| X     | N bytes | LEB128(uint) | X coordinate (0–canvas width)  |
| Y     | N bytes | LEB128(uint) | Y coordinate (0–canvas height) |

Point Data (2nd point and following (repeating point count times)):
| Field | Size    | Type        | Description                    |
|-------|---------|-------------|--------------------------------|
| X     | N bytes | LEB128(int) | X coordinate (0–canvas width)  |
| Y     | N bytes | LEB128(int) | Y coordinate (0–canvas height) |

(we use delta encoding for the stroke points)

CRC for each stroke series. We want to keep it as small as possible, so only a single byte.
| Field | Size   | Type | Description |
|-------|--------|------|-------------|
| CRC   | 1 byte | CRC8 | uint8       |
