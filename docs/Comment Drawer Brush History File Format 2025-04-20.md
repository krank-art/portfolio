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

## Schematic

```
┌─────────────────────────────┐
│    File header (16 bytes)   │
└─────────────────────────────┘
┌─────────────────────────────┐
│       Stroke block #1       │
│ ┌─────────────────────────┐ │
| │ Stroke header (4 bytes) │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
| │ Point data #1 (n bytes) │ │
│ ├─────────────────────────┤ │
| │ Point data #2 (n bytes) │ │
│ ├─────────────────────────┤ │
| │           ...           │ │
│ ├─────────────────────────┤ │
| │ Point data #n (n bytes) │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
┌─────────────────────────────┐
│       Stroke block #2       │
|             ...             │
└─────────────────────────────┘
```

file is little endian

## 1. File Header (fixed-size)

| Field         | Size    | Type    | Description                   |
|---------------|---------|---------|-------------------------------|
| Magic bytes   | 4 bytes | char[4] | "BRSH" to identify the file   |
| Version       | 2 bytes | uint16  | Format version                |
| Canvas width  | 2 bytes | uint16  | Width in pixels               |
| Canvas height | 2 bytes | uint16  | Height in pixels              |
| Stroke count  | 4 bytes | uint32  | Number of strokes             |
| CRC           | 2 bytes | CRC16   | CRC to validate complete file |

//TODO: CRC32 bc recommended for 4KB+ bytes

## 2. Stroke Block (repeated)

Each stroke includes metadata and a list of points.

CRC for each stroke series. We want to keep it as small as possible, so only a single byte.

### Stroke Header

| Field             | Size          | Type         | Description                                                    |
|-------------------|---------------|--------------|----------------------------------------------------------------|
| Brush info        | 1 byte        | multi        | `00 00 0000`                                                   |
| &emsp; Brush type | &emsp; 2 bits | &emsp; uint2 | &emsp; `11`: clear, `10`: eraser, `01`: brush, `00`: undefined |
| &emsp; Pattern    | &emsp; 2 bits | &emsp; uint2 | &emsp; `00`: 100%, `01`: 75%, `10`: 50%, `11`: 25%             |
| &emsp; Brush size | &emsp; 4 bits | &emsp; uint4 | &emsp; Brush diameter (0-15)                                   |
| Point count       | 2 bytes       | uint16       | Number of points in stroke (0-65535)                           |
| CRC               | 1 byte        | CRC8         | CRC8 to validate each stroke as valid                          |

### Point Data

| Field | Size    | Type            | Description              |
|-------|---------|-----------------|--------------------------|
| X     | N bytes | LEB128 (signed) | X difference to previous |
| Y     | N bytes | LEB128 (signed) | Y difference to previous |

(we use delta encoding for the stroke points. 
first coords are absolute, after that they are always the difference to the previous point.)

CRC is calculated from complete stroke section, including header.
For the CRC field itself a placeholder of `0000 0000` is used.
After calculation the `0000 0000` gets overriden with the actual value.


```
json              dec     binary x    binary y    leb8 (msn to lsn)                    leb8 (lsn to msn)
{"x":39,"y":48}   39 48   0010 0111   0011 0000   0000 1100 1111   0000 1110 1000      1111 1100 0000   1000 1110 0000
{"x":39,"y":48}    0  0   0000 0000   0000 0000             0000             0000                0000             0000
{"x":38,"y":47}   -1 -1   1111 1111   1111 1111             0111             0111                0111             0111
{"x":38,"y":45}    0 -2   0000 0000   1111 1110             0000             0110                0000             0110
{"x":37,"y":43}   -1 -2   1111 1111   1111 1110             0111             0110                0111             0110
{"x":36,"y":41}   -1 -2   1111 1111   1111 1110             0111             0110                0111             0110
{"x":35,"y":39}   -1 -2   1111 1111   1111 1110             0111             0110                0111             0110
{"x":35,"y":37}    0 -2   0000 0000   1111 1110             0000             0110                0000             0110
{"x":35,"y":35}    0 -2   0000 0000   1111 1110             0000             0110                0000             0110
{"x":35,"y":33}    0 -2   0000 0000   1111 1110             0000             0110                0000             0110

1111 1100   252   0xFC
0000 1000     8   0x08
1110 0000   224   0xE0
0000 0000     0   0x00
0111 0111   119   0x77
0000 0110     6   0x06
0111 0110   118   0x76
0111 0110   118   0x76
0111 0110   118   0x76
0000 0110     6   0x06
0000 0110     6   0x06
0000 0110     6   0x06


Signed LEB128
For example, the signed number -123456 is encoded as 0xC0 0xBB 0x78: 
MSB ------------------ LSB
         11110001001000000  Binary encoding of 123456
     000011110001001000000  As a 21-bit number (at least 1 bit needs to be additional for sign)
     111100001110110111111  Negating all bits (ones' complement)
     111100001110111000000  Adding one (two's complement)
 1111000  0111011  1000000  Split into 7-bit groups
01111000 10111011 11000000  Add high 1 bits on all but last (most significant) group to form bytes
    0x78     0xBB     0xC0  In hexadecimal

→ 0xC0 0xBB 0x78            Output stream (LSB to MSB)


algorithm for different numbers
-------------------------------
dec    -1         39     (WRONG) 319    (WRONG) -319                 -319
bin     1     100111       100111111       100111111            100111111
fll   001     100111       100111111       100111111         000100111111
neg   110         --              --       011000000         111011000000
add   111         --              --       011000001         111011000001
spl   111   100  111    100 111  111   011  000  001   111  011  000  001
hbt  0111  0100 1111  0100 1111 1111  0011 1000 1001  0111 1011 1000 1001


encoding capacity per nibble
----------------------------
000               2^3      -4 to 3
000 000           2^6     -32 to 31
000 000 000       2^9    -256 to 255
000 000 000 000   2^12  -2048 to 2047
```

## More ideas


* php custom file format checker. truncate data that is not specified
* minified json so no binary data has to be parsed by client
* encode coords in 16 bits, then encode payload as base64 and send as json string (eugh)

```
 width -- 1 1111 1111 -- 9 bit -- 0-511
 height -- 111 1111 -- 7 bit -- 0-127

 canvas width: 320
 canvas height: 120

 2^16 = 65.536
 64^x = 65536
 x = log(64) 65536 = log(10) 65536 / log(10) 64
 x = 8/3
```
  