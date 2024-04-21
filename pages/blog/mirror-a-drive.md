---
layout: blog
linkTitle: Mirroring a drive
---

# Mirroring a drive
> **Krank.** 21 April 2024

Is quite easy to mirror a drive or directory recursively **on Windows** using [`robocopy`](https://learn.microsoft.com/en-US/windows-server/administration/windows-commands/robocopy).
Mirroring means, that missing files in target get copied and redundant files get deleted.

The same principle applies for Unix-like systems with [`rsync`](https://wiki.archlinux.org/title/rsync).
Keep in mind, this is done on a file base level, so it's not the same as mirroring partitions.

```bsh
robocopy l:\ j:\ /mir /xd "$RECYCLE.BIN" /r:5 /w:5 /v /l
```

* copy folder hierarchy from `L:` to `J:` (it's important to keep the backslash `\` after the drive letters)
* `/mir` -- mirror hierarchy (delete and add files on target)
* `/xd` -- exclude directory `"$RECYCLE.BIN"` (throws permission denied error)
* `/r:5` -- retry 5 times on error
* `/w:5` -- wait 5 seconds between each try
* `/v` -- verbose output to log each file
* `/l` -- files are to be listed only (dry run)

> **Warning:** 
> * You first specify the **source** and then the **target**.
> * Mirroring (`/mir`) deletes files in target, if they are not in the source anymore.
> * Do a dry run (`/l`) before doing the actual copying.


## Examples

### Copying large video files on the same SSD

Here I copied a directory with movie files from an internal SSD to the same internal SSD:

```bsh 
$ robocopy C:\awesomevid C:\awesomevid2 /mir

           Insgesamt   KopiertÜbersprungenKeine Übereinstimmung    FEHLER    Extras
Verzeich.:        25        24         1         0         0         0
  Dateien:       889       889         0         0         0         0
    Bytes:  45.476 g  45.476 g         0         0         0         0
   Zeiten:   0:00:21   0:00:20                       0:00:00   0:00:00

Geschwindigkeit:           2354175723 Bytes/Sek.
Geschwindigkeit:           134707.015 Megabytes/Min.
   Beendet: Sonntag, 21. April 2024 14:03:01
```

In this case the transfer rate was 2.2 GiB/s (2354175723 B/s). Pretty good!

