# Comment Drawer Brush History File Format

> Written on 2025-04-20

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

* parsing any binary data without constraints as brush history file
  * that would actually be very fun to see 
  * loading any files as brush history and seeing how the comment tool interprets it
  * modern equivalent of putting a data cassette into an audio cassette player


example png (annoying dog)
```
      00 01 02 03 04 05 06 07 08 09 0A 0B 0C 0D 0E 0F
  
000   89 50 4E 47 0D 0A 1A 0A 00 00 00 0D 49 48 44 52 
010   00 00 00 14 00 00 00 13 04 03 00 00 00 62 A2 30 
020   86 00 00 00 01 73 52 47 42 00 AE CE 1C E9 00 00 
030   00 04 67 41 4D 41 00 00 B1 8F 0B FC 61 05 00 00 
040   00 09 50 4C 54 45 C3 86 FF 00 00 00 FF FF FF 05 
050   F5 36 32 00 00 00 09 70 48 59 73 00 00 0E C3 00 
060   00 0E C3 01 C7 6F A8 64 00 00 00 18 74 45 58 74 
070   53 6F 66 74 77 61 72 65 00 50 61 69 6E 74 2E 4E 
080   45 54 20 35 2E 31 2E 38 1B 69 EA A8 00 00 00 B6 
090   65 58 49 66 49 49 2A 00 08 00 00 00 05 00 1A 01 
0A0   05 00 01 00 00 00 4A 00 00 00 1B 01 05 00 01 00 
0b0   00 00 52 00 00 00 28 01 03 00 01 00 00 00 02 00 
0c0   00 00 31 01 02 00 10 00 00 00 5A 00 00 00 69 87 
0d0   04 00 01 00 00 00 6A 00 00 00 00 00 00 00 60 00 
0e0   00 00 01 00 00 00 60 00 00 00 01 00 00 00 50 61 
0f0   69 6E 74 2E 4E 45 54 20 35 2E 31 2E 38 00 03 00 
100   00 90 07 00 04 00 00 00 30 32 33 30 01 A0 03 00 
110   01 00 00 00 01 00 00 00 05 A0 04 00 01 00 00 00 
120   94 00 00 00 00 00 00 00 02 00 01 00 02 00 04 00 
130   00 00 52 39 38 00 02 00 07 00 04 00 00 00 30 31 
140   30 30 00 00 00 00 AB 80 21 13 53 9E 38 28 00 00 
150   00 50 49 44 41 54 18 D3 95 CE D1 09 00 31 08 03 
160   50 BB 41 E2 06 66 FF 21 2F D5 16 EE B7 A1 C8 A3 
170   04 34 02 E4 8A CE 2A 29 31 94 F3 63 19 88 2C A5 
180   0A 2E 46 AA BF D1 64 9B 66 BA 32 FD 2C E6 A5 4E 
190   5E 88 59 7C 49 D1 EF 10 6B 58 DE DE 63 1F 87 3D 
1A0   10 1F C9 9E 11 2D 02 46 C9 6B 00 00 00 00 49 45 
1b0   4E 44 AE 42 60 82 
```


| Field            | Size      | Type      | IS                                      | Expected                   |
|------------------|-----------|-----------|-----------------------------------------|----------------------------|
| Magic bytes      | 4 bytes   | char[4]   | "‰PNG"                                  | "BRSH"                     |
| Version          | 2 bytes   | uint16    | 2573                                    | 1                          |
| Canvas width     | 2 bytes   | uint16    | 2586                                    | 320                        |
| Canvas height    | 2 bytes   | uint16    | 0                                       | 120                        |
| Stroke count     | 4 bytes   | uint32    | 1212747008                              | valid, but bit extreme     |
| CRC              | 2 bytes   | CRC16     | 0x4452                                  | mismatch                   |
| ---------------  | --------- | --------- | ------------                            | -------------------------- |
| Brush info       | 1 byte    | multi     | brush "undefined", pattern 100%, size 0 | invalid stroke block       |
| Point count      | 2 bytes   | uint16    | 0                                       |                            |
| CRC              | 1 byte    | CRC8      | 0x14                                    | mismatch                   |
| Brush info       | 1 byte    | multi     | brush "undefined", pattern 100%, size 0 | invalid stroke block       |
| Point count      | 2 bytes   | uint16    | 0                                       |                            |
| CRC              | 1 byte    | CRC8      | 0x13                                    | mismatch                   |
| invalid block 2x | ...       | ...       | ...                                     | ...                        |
| Brush info       | 1 byte    | multi     | brush "clear", pattern 100%, size 6     | valid                      |
| Point count      | 2 bytes   | uint16    | 0                                       |                            |
| CRC              | 1 byte    | CRC8      | 0x00                                    | mismatch                   |
| invalid block 1x | ...       | ...       | ...                                     | ...                        |
| Brush info       | 1 byte    | multi     | brush "eraser", pattern 100%, size 2    | valid                      |
| Point count      | 2 bytes   | uint16    | 44544                                   | 313                        |
| CRC              | 1 byte    | CRC8      | 0xCE                                    | mismatch                   |

validity of the single stroke record (313 points, 1-indexed)
delta encoding transformed back into absolute coordinates
```
  1  {x:      1, y:   116}  valid
  2  {x:      1, y:   116}  valid
  3  {x:      1, y:   116}  valid
 10  {x:    -19, y:   163}  INVALID
 20  {x:   -724, y:   111}  INVALID
 30  {x: 261488, y:    91}  INVALID
100  {x: 262996, y:  -972}  INVALID
200  {x: 263030, y: -1059}  INVALID
300  {x: 322460, y: 30305}  INVALID
```
