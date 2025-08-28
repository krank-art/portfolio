# Hosting NSFW images
> Written on 11 January 2025, reworked XX August 2025

**I've drawn lots of things over the years, including NSFW artwork (ehem, *pornography* 💅).**
Spicy artwork, hidden deep in folder structures, on encrypted drives and niche social media accounts.
Being sneaky is fun and **security through obscurity** is one strategy to handle these files.

It's just not very reliable or convenient.

Sharing my art with distinguished people usually happens by sending the file directly.
People have no reliable way to link back to my work.
It also makes it annoying for myself, I want to have a catalogue of all the art I created over the years at a moment's notice.

A far better approach is **security by design**.

![](./media/image-encryption-v1.png)

That way I can be secure and convenient with my spicy art.
And it solves all the requirements I have for hosting nsfw artwork:

* Access is restricted to  people of my  choosing **(whitelist)**.
* Access is restricted to adult people **(legality)**.
* Files are saved encrypted and only decrypted for viewing **(encryption)**.
* Access can be revoked by updating the key **(shared secret revocation)**.


## Whitelist

The way I want to implement it is with a shared secret that I hand out to people.
This **shared secret simply is a password** that grants access to specific images encrypted with the password.
Depending on the category, I can encrypt images with different passwords, so people only gain access to a specific images.


## Legality

In my country, when hosting adult content, you need to ensure that the viewer is over 18 years old.
I'm not going to ask visitors to show me their ID, that goes against the strong data privacy aspect of interacting online with people.
Access will be granted by myself to people via private messages and only after asking if they are 18+ years old.

The content should not be available to the general public, including random visitors and search engines.
Furthermore I don't want to host the images unencrypted on my webserver.
If I mess up the configuration, things could leak without verification.

## Encryption

In development, we encrypt the images with a specific password.
Then we store the images on the web server,  which functions as a dumb vault.
On the client side, people can provide a password which forms the key to the encrypted files.
This is **end-to-end encryption (E2EE)** by the way.


We will **encrypt our images with [AES-128-GCM](https://en.wikipedia.org/wiki/Galois/Counter_Mode) and for the key generation we will use `pbkdf2`**, because it is available natively in the [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Pbkdf2Params). `argon2` would be more secure but that would require additional libraries for the client.

This approach is *not incredibly* secure, because the decryption happens on the client.
People can just download the files and start brute-forcing the password.
We just need to make it annoying enough, so that in practical term it is not crackable.


## Components

The minimum viable product is to just encrypt the images and put them onto my server.
Then people can go to a special site (e.g. https://krank.love/naughty) and then simply type in passwords into an input field.

I want to implement a gallery though where all encrypted images are listed.
People can insert one or more passwords which unlock more and more posts.

Upon clicking onto an artwork, they get redirected to the post detail page.
If this post has been unlocked already, the image and meta data is decrypted and displayed.
If it has not been unlocked yet, then an input field for a password gets displayed.


### Custom File Type

To successfully decrypt the image, we need five components:

1) **Image data** (encrypted)
2) **Salt** (forms the AES key together with the password)
3) **Nonce** (ensures that encryption with same payload is unique if repeated)
4) **Authentication tag** (checksum for decryption)
5) **Password (provided by user)**

All these properties *except* the password are public.
We need to send them to the client so they can actually decrypt the image.
Storing these components individually is possible but it makes much more sense to bundle all of them into a single file.

That's why I'm proposing this file format:

{WIP}


### Source set

A single decryption attempt for an 1 MB PNG file should take about 100ms on average hardware. 

This is a bit inefficient in terms of website traffic.
The final bundle of encrypted images will consist of multiple sets that each have a unique password.
Typing in one password grants access *to part* of all the files.
If I clearly mark which files are in which set, people can deduce the set size which I don't want.

Let's say that we have 20 images that take up 20 MB of space.
 every time we have a page visited they would need to cash all 20 MB to iterate all over them and attempt decryption.
We can fix this by creating a **source-set for the encrypted images**.

That means we should configure the decryption algorithm, so a single decryption attempt takes 100ms for a 60 KB file on average.
If the user successfully decrypts the image,  we can then make the  thumbnail image + subpage link appear.

To give an overview of the encrypted files and their components involved:

```diff
  IMAGE #1 (SET A)
   (Preview image for gallery)
   file: /nm/240p/image-1.png.enc
+  pass: spicyart123                # Unique password per set
+  salt: oZcXJ7AZ6qu1F5kKQ8uUVg==   # Unique salt per post
+  nonc: ABEiM0RVZniImaq7           # Unique nonce every enc
+  auth: 1PHxyKLmwqXJpnjLNGVqRQ==   # Unique auth every enc
 
   (Source image in full resolution)
   file: /nm/image-1.png.enc
   pass: spicyart123
   salt: oZcXJ7AZ6qu1F5kKQ8uUVg==
+  nonc: obLD1OX2BxgpOktc
+  auth: qfM4qTcz0SgGSRkddA3+GA==

   (Meta data per post)
   file: /nm/data/image-1.json.enc
   pass: spicyart123
   salt: oZcXJ7AZ6qu1F5kKQ8uUVg==
+  nonc: AQIDBAUGBwgJCgsM
+  auth: YIMby9WBiQi3r0xdMLz6Hw==

  IMAGE #2 (SET A)
   file: /nsfw/240p/image-2.png.enc
   pass: spicyart123
+  salt: yWu1Egr2Ql0Btk9dDaAbWA==
+  nonc: rN7brN7brNes3Q==
+  auth: M9nMoatY5z9T9kYHyJzMDg==
 
   file: /nsfw/image-2.png.enc
   pass: spicyart123
   salt: yWu1Egr2Ql0Btk9dDaAbWA==
+  nonc: /u36zqv+vr6q3wDN
+  auth: nQZ9CV4JYuGp/1TxN6oYxA==
   ...

  IMAGE #3 (SET B)
   file: /nsfw/240p/image-3.png.enc
+  pass: mywonderfulpassword42
+  salt: l0Btk9dDaAbWAyWu1Egr2Q== 
+  nonc: N7brNes3QrN7br==
+  auth: Y5z9T9kYHyJzMDgM9nMoat==
   ...
```


### Path

When hosting naughty subpages, we need to be vague with the path. 
For example, "H0t Bun on Bun Action" would turn into `/naughty/bun-meeting`.
The path always needs to be absolute  and recognizable, so links can efficiently be shared.
But it has to be vague enough so no unsavory details can be deduced.

> Many nsfw art sites use post ids like `/naughty/14032`, but I don't like that these links do not give off any information at all.


### Post data

Art posts have a path, title, description, and a lot of meta data (image creation date, dimensions, palette, tags).
I cannot display them in plain text, because a viewer could deduce a lot of information about the content.
We will encrypt the metadata too  and restore them if the correct password is provided.


## Failed approach: Steganography

Originally I wanted to generate a PNG preview file and then hide the actual encrypted payload inside it with **steganography**.
The plan was to scramble the original PNG image and then use the 2 least significant bits in each color channel for the arbitrary payload.

> By the way, [PICO-8](https://www.lexaloffle.com/pico-8.php) uses this method successfully for their cartridges, all game assets are encoded on a screenshot PNG.

For me this fell flat for multiple reasons:

1) **Hinting is difficult without revealing too much in preview.**\
   I tried Gaussian Blur for the preview image, but I had to set the radius so high, that it kind of just looks like a radial gradient anyway.
   The other approach was to resort/transform the pixels, but that can easily be reversed.
2) **No native library to read PNG pixel data in JavaScript.**\
   I tried reading the steganography image with `<canvas>`.
   The problem is color space, for some reason Firefox especially kept getting the colors wrong, which is a detriment if you save the information in the two **least significant** bits.
   I also did not want to include a PNG library for the client JavaScript, because those are huge.
3) **Inefficient data storage.**\
   Having a PNG image inside another PNG image is problematic because  the available payload is significantly smaller than the transfer file.
   The space you need for the hidden file also varies because of the PNG compression algorithm.
   Adding all the noise because of the 2 LSBs also screws up efficient compression for the vessel PNG.

Really it's just easier *and* safer to [extract the prominent colors](https://github.com/Vibrant-Colors/node-vibrant) and create a blurry gradient.
