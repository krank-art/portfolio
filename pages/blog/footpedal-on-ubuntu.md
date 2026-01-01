# Using a footpedal on Ubuntu
Written by Krank on 2026-01-01

I've had problems with shoulder impingement for years now.
Especially the left hand (my dominant one), and pressing the modifier keys (ctrl, alt, shift) seems to hurt after a while.
Thats why I got gifted an USB foot pedal for Christmas!
A PCsensor FS2020 foot switch!

The manual recommends ElfKey for key customization, but sadly it's not out yet for Linux (maybe someday).
So I looked around and there is a project on Github that provides customization: https://github.com/rgerganov/footswitch/

Instructions to get your footpedal to work:

1. Plug in USB foot switch.
2. Open terminal and type in `lsusb`, you should see an entry similar to `Bus 001 Device 007: ID 3553:b001 PCsensor FootSwitch`.
3. Go to a folder of your liking (for example, create a dir `mkdir ~/dev` and then navigate into it `cd ~/dev`).
4. Clone the git project with `git clone https://github.com/rgerganov/footswitch.git` and navigate into it with `cd footswitch`.
5. Install the dependencies with `sudo apt-get install libhidapi-dev`.
6. Make the footswitch program with `make` and then `sudo make install`.
7. Try getting footpedal keyboard strokes by running `sudo footpedal -r`. If you look on the github table, it shows the supported footpedal models, which `3553:b001` is a row of. If you press the 1st, 2nd and 3rd pedal, it should show 'a', 'b' and 'c' in console.
8. Press Ctrl + C and then run your custom key binds, I use these: `sudo footswitch -1 -m alt -2 -k tab -3 -m ctrl`.
9. This allows me to Alt + Tab by holding down on the left pedal and shortly tapping on the middle pedal.
10. And it also allows me to Ctrl + Tab by holding the right pedal and shortly tapping on the middle pedal.

A nice side effect is that ElfKey is an Electron app coming in at a whopping 105 MB.
The github library should be like 2 MB in comparison lol.
