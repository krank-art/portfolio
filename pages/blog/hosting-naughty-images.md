# Hosting NSFW images
> Written on 11 January 2025, reworked XX August 2025

**I've drawn lots of things over the years, including NSFW artwork (ehem, *pornography* 💅).**
Spicy artwork, hidden deep in folder structures, on encrypted drives and niche social media accounts.
Being sneaky is fun and **security through obscurity** is one strategy to handle these files.

It's just not very reliable or convenient.

> **Table of Content**:
- [Requirements](#requirements)
  - [Whitelist](#whitelist)
  - [Legality](#legality)
  - [Encryption](#encryption)
  - [Password](#password)
- [Implementation](#implementation)
  - [Custom File Type](#custom-file-type)
  - [Source set](#source-set)
  - [Path](#path)
  - [Post data](#post-data)
- [Version control](#version-control)
  - [Backup](#backup)
  - [Restore](#restore)
- [Failed approach: Steganography](#failed-approach-steganography)


Sharing my art with distinguished people usually happens by sending the file directly.
People have no reliable way to link back to my work tho.
It also makes it annoying for myself, I want to have a catalogue of all the art I created over the years at a moment's notice.

A far better approach is **security by design**.

![Illustration showing how files are encrypted, stored on the server and then decrypted by the client.](./media/image-encryption-v1.png)


## Requirements

Besides being secure *and* convenient, with encryption I can solve all the requirements I have for hosting nsfw artwork:

* Access is restricted to  people of my  choosing **(whitelist)**.
* Access is restricted to adult people **(legality)**.
* Files are saved encrypted and only decrypted for viewing **(encryption)**.
* Password should be easy to remember and secure **(password)**.


### Whitelist

The way I want to implement it is with a shared secret that I hand out to people.
This **shared secret simply is a password** that grants access to specific images encrypted with the password.
Depending on the category, I can encrypt images with different passwords, so people only gain access to a specific images.

To revoke access to certain parts of my images, we can simply rotate the password for the set **(shared secret revocation)**.


### Legality

In my country, when hosting adult content, you need to ensure that the viewer is over 18 years old.
I'm not going to ask visitors to show me their ID, that goes against the strong data privacy aspect of interacting online with people.
Access will be granted by myself to people via private messages and only after asking if they are 18+ years old.

The content should not be available to the general public, including random visitors and search engines.
Furthermore I don't want to host the images unencrypted on my webserver.
If I mess up the configuration, things could leak without verification.


### Encryption

In development, we encrypt the images with a specific password.
Then we store the images on the web server,  which functions as a dumb vault.
On the client side, people can provide a password which forms the key to the encrypted files.
This is **end-to-end encryption (E2EE)** by the way.

We will **encrypt our images with [AES-128-GCM](https://en.wikipedia.org/wiki/Galois/Counter_Mode) and for the key generation we will use `pbkdf2`**, because it is available natively in the [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Pbkdf2Params).
`argon2` would be more secure but that would require additional libraries for the client.

This approach is *not incredibly* secure, because the decryption happens on the client.
People can just download the files and start brute-forcing the password.
We just need to make it annoying enough, so that in practical term it is not crackable.


### Password

We will use [Diceware](https://theworld.com/~reinhold/diceware.html) (developed by Arnold G. Reinhold) to come up with passwords that have high entropy but still are easy to use.
Reinhold recommends using 6 words, so an example would be `turtle aspirin galaxy river muffin engine`.
That is way cleaner and easier to remember than `wEr42?38=bmpw23GGRs§`.

Passwords should have a sufficiently high entropy rating to be secure.
Diceware has 7776 words in it's table  at the author recommends using 6 picked at random.
This gives us about 78 bits of entropy (80 is very high and 128 is insanely good):

<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
  <mtable>
    <tr><td>
      <mi>E</mi><mo>=</mo>
      <msub><mi>log</mi><mn>2</mn></msub>
      <mrow><msup><mi>R</mi><mi>L</mi></msup></mrow>
    </td></tr>
    <tr><td>
      <mi>E</mi><mo>=</mo>
      <msub><mi>log</mi><mn>2</mn></msub>
      <mrow><msup><mn>7776</mn><mn>6</mn></msup></mrow>
      <mo>≈</mo>
      <mrow><mn>77.59</mn><mo>&#x2009;</mo><mtext>bits of entropy</mtext></mrow>
    </td></tr>
  </mtable>
</math>

> **Goofy Idea:**\
> Create custom word list for Diceware from  slang terms defined on https://www.urbandictionary.com/.
> Who wouldn't want to type in a password like this: `rizz bussin gyatt wisenheimer brotox clanker`


## Implementation

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

|      | Field           |     Size | Type     | Description              |
| ---: | --------------- | -------: | -------- | ------------------------ |
|  *0* | Magic bytes     |  4 bytes | char[4]  | `KENC` (Krank encrypted) |
|  *4* | Version         |   1 byte | uint8    | Format version, is 1     |
|  *5* | Encryption date |  8 bytes | char[8]  | `YYYYMMDD` in UTC+0      |
| *13* | Author          | 19 bytes | char[19] | `https://krank.love/`    |
| *32* | Payload length  |  4 bytes | uint32   | Length of payload data   |
| *36* | Salt            | 16 bytes | bin[16]  | Salt for key derivation  |
| *52* | Nonce (IV)      | 12 bytes | bin[12]  | GCM nonce (iv)           |
| *64* | Auth tag        | 16 bytes | bin[16]  | GCM authentification tag |
| *80* | Payload         | variable | bin[N]   | Arbitrary binary data    |

Byte order is **Big Endian**. 
In the crypto world that is more common than Little Endian.

`author` \
This field tracks the original creator of the file.
In this case it links back to my own website.
Should I ever lose the current domain, I need to update this file spec because then also the size of the author field increases.
There are of course multiple places to reach out to me:

| Bytes | URL                                            |
| ----: | ---------------------------------------------- |
|    46 | https://www.furaffinity.net/user/krankthebear/ |
|    42 | https://bsky.app/profile/krank.bsky.social     |
|    19 | https://krank.love/ **(current)**              |

`payload length` \
AES-GCM internally uses a 32-bit block counter, maximum number of blocks is 2^32 - 2.
Each block has a size of 16 bytes, so max plaintext size is 2^32 * 16 bytes = ~64 GiB.
When using 64-bit Node.js, we can stream file sizes of arbitrary size.
With uint32 for the payload length, we can represent 2^32 = 4 GiB maximum with the encrypted file container.
This should be more than enough for a file hosted on a **web**server, for any larger files I'd need to come up with a different solution.

`encryption date` \
We need the *encryption date* because passwords  can be rotated to revoke access to sets of files.
I will keep track when a new password is used and store it in a history file (inaccessible to public).
Given the encryption date and the history of passwords, I can decrypt a file manually if need be.

Using Unix time (millis since epoch) would be more space efficient  and also a well known standard.
But I want to avoid the [Year 2038 problem](https://en.wikipedia.org/wiki/Year_2038_problem) (as of writing this blog post there are **only 13 years left**).
Unix time is encoded as int32,  so it takes up 4 bytes of space.
We can avoid the Y38 problem by increasing the bit size to 48 or 64.
But that would be 6/8 bytes.
Let's just represent the date with `YYYYMMDD`, that way we can read the date at a glance in a hex editor in 8 bytes of space.

`nonce` (IV) \
The [specification NIST 800-38D](https://csrc.nist.gov/pubs/sp/800/38/d/final) recommends either using a random nonce or deterministically deriving it.
Having a unique nonce is very important, because if a nonce is reused, it causes a catastrophic failure of the encryption (two messages can be diffed with XOR).

We must use a unique nonce *per key*, where each key is derived from the password in combination with the salt.
Since we generate a new salt each time the encryption cycle is started, we do not need to worry if the nonces repeat between different batches of encryption.

To construct the 96 bit nonces, we will follow the specs with a 32 bit  **fixed field** (device identification) and a 64 bit **invocation field** (simple counter).
Since we only have a single device, we will just generate a 32 bit random number.
This is also useful to use as common identifier for the different batches.

> Shuffling the IVs between different encryption batches is unnecessary.
> Each time the encryption batch is run, a new salt is randomly generated and a new key is derived.
> By shuffling the IVs we could obfuscate the order in which key is used for each payload.
> In practical terms, this doesn't matter though because an attacker can just look at the `payload length` as unique identifier for each file.


### Source set

When the user submits a password, it is used in combination with the salt to generate an AES-128 key.

The images hosted are **grouped into Sets &rarr; Posts &rarr; Files**.
We get a new password per set and a new salt per post.
A post has multiple files with the same key, only the nonce changes per file.
In practical terms, we need to derive a **new key for each post** (artwork).

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

We want to fine-tune the KDF (key derivation function) so **each attempt is ~100ms** on average hardware.
It's purposefully slow, so that bruteforce attacks are not viable.
It also must not be too slow, since we try to decrypt *all* images.

> Imagine going into a room full of locked boxes, where each box has a dial and lever.
> You get unlocking instructions ("turn 90° to left, then 30° to right, then turn lever"), but you don't know on which boxes it works.
> It could work on none, a single one or even multiple boxes.
> So for better or worse, you have to **try all with considerable effort**.

Once we derived the correct key, actual decryption is very fast.
Most modern CPUs have hardware acceleration (AES NI instructions), actual physical gates in the silicone so it just takes a single cycle.
**Decryption has succeeded** if the provided authentication tag matches the  newly calculated authentication tag.

We should **cache** the AES key in local storage when decryption has succeeded.
This way images in the overview are quickly loaded and also individual posts are decrypted almost instantaneously.


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


## Version control

It would be awkward to spend so much energy on encryption, but then visitors can just go to my Github and read all the information in plaintext.
We will also need to be sneaky on how to **1) preserve data history**, **2) be private**, and **3) integrate well in current git repository**.

To generate all the encrypted naughty images, we need three things:

1) NSFW images.
2) Post data (compare to `/data/media.json` for SFW artworks)
3) Sets and their passwords.

We will store these in a **local git submodule**, create bundles with and store them on a separate drive only I (the author) have access to.
I can then sync up the repository if necessary.
It needs the following commands to work:

* `git bundle create portfolio.bundle --all` -- Bundles up the repository
* `git clone portfolio.bundle portfolio` -- Clones repository from bundle
* `git fetch portfolio.bundle` -- Fetches changes from bundle without applying them yet

The images themselves are added via Git LFS.
That way we can reliably store a reference to all images without slowing down the git repository with large binary files.
Git LFS is an extension to Git so make sure it is installed by running `git lfs`.
Make sure when you stage images and before you commit that `git diff --staged` gives you output similar to this:

```diff
+version https://git-lfs.github.com/spec/v1
+oid sha256:7593a34539b17e2793498202955f6d7a325e5436f87e987fca225962d5697129
+size 1470698
```

So to share the nsfw images and data between Git repositories:


### Backup

1. Create a bundle of the git submodule at `nsfw/` with `git bundle create portfolio-nsfw.bundle --all` (Git LFS files are excluded).
2. Move `portfolio-nsfw.bundle` into a temp folder.
3. Copy `nsfw/.git/lfs/objects` into a new folder `media` inside the temp folder.
4. Zip temp folder contents (or move as-is, zipping binary files does not compress much).


### Restore

1. Copy the backup folder or zip onto the device and unpack.
2. Navigate into `nsfw/` and fetch changes from bundle with `git fetch path/to/portfolio-nsfw.bundle`.
3. Pull changes after review with `git pull path/to/portfolio-nsfw.bundle`.
4. Copy Git LFS objects into `nsfw/.git/lfs/objects`.


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
