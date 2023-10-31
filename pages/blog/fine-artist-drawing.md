---
layout: blog
---

# Drawing in Microsoft Fine Artist with screen tablet
> **Krank.** 27 August 2023

![A mighty fine red hunk drawn in Microsoft Fine Artist 1994](../media/blog/bara-red_2023-08-26.png)

1. Download and install [DOSBox](https://www.dosbox.com/download.php?main=1).
2. Download [Windows 3.11 for Workgroups](https://archive.org/details/windows-3.11-sgvm) (already setup Windows 3.11 installation).
3. Download [Microsoft Fine Artist ISO](https://archive.org/details/microsoft-fine-artist/).
4. Unpack Windows 3.11 to `C:\Users\<<User>>\Documents\Windows311`.
5. Move ISO file to `C:\Users\<<User>>\Documents\Windows311`.
6. Open installation path of DOSBox
7. Go to `Options` and open `DOSBox 0.74-3 Options` (full path should be `C:\ProgramData\Microsoft\Windows\Start Menu\Programs\DOSBox-0.74-3\Options`).
8. Change config:
   ```ini
   [sdl]
   fullscreen=true
   fullresolution=desktop    # not sure if necessary to change
   windowresolution=desktop  # not sure if necessary to change
   output=ddraw              # necessary to enable scaling
   sensitivity=50            # normally 100, but we scale the screen
 
   [autoexec]
   MOUNT c C:\Users\<<User>>\Documents\Windows311
   IMGMOUNT d "C:\Users\<<User>>\Documents\Windows311\Microsoft Fine Artist.iso" -t iso
   # we do not necessarily have to mount the Fine Artist ISO every time. After all, we
   # only need it for the installation. But the disk also includes some stickers and 
   # sounds, which would not be available in the program, if the iso is not mounted.
   C:
   START.BAT
   ```
9. For full specs, see https://www.dosbox.com/wiki/Dosbox.conf.
10. If your tablet driver supports "Mouse Mode", enable it and skip steps 11-16.
11. Close Huion driver program in system tray (or other tablet driver software you use).
12. Open Task Manager and stop all Huion driver programs.
13. Download [OpenTabletDriver](https://github.com/OpenTabletDriver/OpenTabletDriver) to enable "Relative Mode" (mouse mode) for tablet
14. The tablet pointing mechanism is quite buggy when using with DOSBox. Thats why we have to emulate a mouse.
15. Start OpenTabletDriver, change affected region and switch from "Absolute Mode" to "Relative Mode".
16. Turn tablet by 180° in settings if necessary.
17. Run DOSBox
18. Go to "File Manager".
19. If necessary, install Calmira II (adds Windows 95-similar task bar and other smaller stuff)
20. In File Manager, switch to Drive D: and double click on "setup" for Fine Artist.
21. Go through the installation process.
22. After installation, start Fine Artist by double clicking the icon.
23. Go to the process and create a fine artist account with `<<my-name>>`.
24. Open Fine Artist and start drawing.
25. Save the file (and optionally make screenshots of it).
26. You can find the source file in the mounted folder under `C:\Users\Lukas\Documents\Windows311\MSKIDS\USERS\<<MYNAME>>`.
