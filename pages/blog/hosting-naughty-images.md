# Hosting NSFW images
> Written on 11 January 2025, reworked XX August 2025

**I've drawn lots of things over the years, including NSFW artwork (ehem, *pornography* 💅).**
Spicy artwork, hidden deep in folder structures, on encrypted drives and niche social media accounts.
Being sneaky is fun and **security through obscurity** is one strategy to handle these files.

It's just not very reliable or convenient.

> **Table of Content**:
- [Hosting NSFW images](#hosting-nsfw-images)
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
  - [Folder structure](#folder-structure)
  - [Version control](#version-control)
    - [Backup](#backup)
    - [Restore](#restore)
  - [User Experience](#user-experience)
  - [Failed approach: Steganography](#failed-approach-steganography)
    - [Cancelled: Container format](#cancelled-container-format)


Sharing my art with distinguished people usually happens by sending the file directly.
People have no reliable way to link back to my work tho.
It also makes it annoying for myself, I want to have a catalogue of all the art I created over the years at a moment's notice.

A far better approach is **security by design**.

![Illustration showing how files are encrypted, stored on the server and then decrypted by the client.](/media/blog/image-encryption-v1.png)
bla bla

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


## Folder structure

```ini
static/               # Folder for binary media files
  240p/               # Includes subfolders for resizesets
  480p/
  bun-fun.png
temp/                 # Intermediary step; We need to rename files + prepare
encryption-sets.json  # Defines which password unlocks which post
media-nsfw.json       # Title, meta data, manually written description, etc.
```

`encryption-sets.json`:
```js
[{ password: "supersecret123",
   title: "General naughty art",
   posts: [ "bun-fun", "sticky-situation", "foxy-after-dark" ]},
{ password: "bananabread42",
  title: "Experimental",
  posts: [
    [ "nsfw/240p/crazy-art.webm", "nsfw/crazy-art.png", "nsfw/data/crazy-art.json"],
  ]}];
```

Posts have the same structure as posts in `data/media-art.json`.
Additionally they have two more fields:

* `pathHash` since the actual `path` is considered private too.
* `fileNameEncrypted` to hide the pathname + date.
* `hashColors` are used to create the image placeholders, the colors are derived from the path hash.
  > We actually use the OKLCH color space here, so colors have the same perceived lightness, this is 
  > quite helpful so visually the colors mix better: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/color_value/oklch

`media-nsfw.json`:
```js
[{ active: true,
   path: "bun-fun",
   pathHash: "P4XS",
   date: "2023-12-30",
   fileNamePublic: "bun-fun_2023-12-30.png",
   fileNameInternal: "Bun Fun 2023-12-30 Release.png",
   fileNameEncrypted: "P4XS.png.enc",
   fileType: "png",
   fileSize: 1470698,
   fileHash: "dZOjRTmxfieTSYIClV9tejJeVDb4fph_yiJZYtVpcSk",
   width: 2400,
   height: 2400,
   aspectRatio: "1:1",
   orientation: "square",
   ratioFactor: 1,
   vibrantColors: {
     vibrant: "#d0b44c",
     darkVibrant: "#594728",
     lightVibrant: "#a6d0de",
     muted: "#5f90a1",
     darkMuted: "#6b5930",
     lightMuted: "#cdb3ac"
   },
   hashColors: [
     "oklch(65.1% 0.182 194.8)",
     "oklch(59.1% 0.202 205.8)",
     "oklch(64.1% 0.132 163.3)"
   ],
   title: "Bun fun",
   description: [
     "Here is a very cool description of the nsfw art post ",
     "It's actually an array of strings to make semantic formatting easier."
   ],
   tags: [
     "cheeseCake", "cocky", "colored", "digitalArt", "food", "gift",
     "krita", "pokemon", "purple", "sableye", "smiling", "yellow"
   ],
   imageAlt: "Cute buns having fun!",
   palette: [] }]
```



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
3. Copy `nsfw/static/` into a new folder `media` inside the temp folder.
   > You need to manually copy the files.
   > Git LFS in this case is useful to track what files there are and if any of them have changed.
4. Zip temp folder contents (or move as-is, zipping binary files does not compress much).


### Restore

1. Copy the backup folder or zip onto the device and unpack.
2. Navigate into `nsfw/` and fetch changes from bundle with `git fetch path/to/portfolio-nsfw.bundle`.
3. Pull changes after review with `git pull path/to/portfolio-nsfw.bundle`.
4. Copy Git LFS objects into `nsfw/static/`.


## User Experience

When the user provides a password in the nsfw overview page, it is not clear what post can be unlocked with it.
Instead the browser will start generating an AES-128 key for each thumbnail and try decrypting it.
Kinda like you get handed a big keychain and then you try to see on which locks the key works on.

With our current design, each post gets a unique salt.
That means, all subrequests for a post have the same derived key from password + salt.
The nonce guarantees that each cipher encryption is unique and the authentification tag proves that the cipher has not been tempered with.

This is a lengthy process by design, the key derivation is what provides the security with AES-128-GCM.
So if a post could successfully be unlocked, we wanna save it in a key cache in localStorage``.
Saving the derived key instead of the password lets us skip the lengthy derivation the next time and also guarantees 
that no password is being saved as clear text.

Problem is, that we need to derive all keys at once and cannot queue them in a pipeline (even though thats the time-intense step).
That means on the overview page, we need to implement a progress bar and/or status feedback, so the user knows that the decryption
is still ongoing.

This key cache is then saved in IndexedDB, so on repeated loads the content gets decrypted almost immediately 
(decrypting a cipher with the key is super fast on current hardware).
The key cache would be a Map, so values are sorted by key, value (URL, base64 encoded AES-128 hash).
Here is the proposed structure in JSON:

```js
// Key
["post", "nsfw", "bun-fun"];

// Value
{
  pathHash: string;  // Unique Base32 hash (primary key)
  key: ArrayBuffer;  // raw AES key bytes (16 bytes)
  created: number;   // unix timestamp (ms); first successful decryption
  lastUsed: number;  // unix timestamp (ms); last successful decryption
  version: number;   // cache schema version (should be 1; useful for migrations)
  title: string;     // readable title so navigation shows meaningful name
  pathName: string;  // readable pathname (the actual internal ID)
  tags: string[];    // gets aggregated on overview page with all known tags
}
```

Example key-value in IndexedDB store:
```js
["post", "nsfw", "bun-fun"];
{
  pathHash: "P4XS",
  key: CryptoKey,
  created: 1768492360270,
  lastUsed: 1768492360270,
  version: 1,
  title: "Bun Fun",
  pathName: "bun fun",
  tags: [
    "cheeseCake", "cocky", "colored", "digitalArt", "food", "gift",
    "krita", "pokemon", "purple", "sableye", "smiling", "yellow"
  ],
}
```

For the actual decryption process on the overview page, we will not actually decrypt the thumbnail images.
Rather we will attempt to decrypt `media/nsfw/HASH.json.enc`, since we will get some helpful information in the process 
which we can use to make the posts in the overview page and in the navigation readable.
Once we have proven that the current key works to decrypt the current post, we can easily store it in the IndexedDB
and then decrypt the thumbnail image, so the user can actually see what they have just unlocked (:

The tags are also super helpful because we can aggregate them to build the familiar tag filtering list.
Each unlocked post actually updates the current tag list and makes the post sortable.
Sweet!

Keep in mind that on the user side there will be no information left what the underlying encryption sets are.
They simply have a list of unlocked posts and they don't know which encryption list they belong to internally.
That also means there is only one password input field and the passwords are immediately forgotten after trying all posts with it.

Cycling through all posts also takes considerable time due to the pbkdf2, so just spamming passwords will not allow users
to unlock posts at random (lol, good luck poor interested fellas).
We will also store

16^4 (hex, 4 digits) = 65536

https://krank.love/nsfw/P4XS

C4WPN7LA
T5GMH2EV
Z6KQP4XS

Since the path name also reveals information about the contents (e.g. `/art/krystal-sandwich`), we need a non-descript ID.
We could use the sequential upload number, but I actually prefer using a four digit base32 random number.
It should always be displayed in uppercase, in URL, HTML file name and on the site preview when link shows embed.
There is a few special rules, like I need to make sure the hashes do not accidentally form reserved filenames 
(e.g. `COM2`, `LPT5` on [Windows](https://learn.microsoft.com/en-US/windows/win32/fileio/naming-a-file#file-and-directory-names)),
special names like `NULL` might have [unforseen consequences](https://arstechnica.com/cars/2019/08/wiseguy-changes-license-plate-to-null-gets-12k-in-parking-tickets/))
and *theoretically* I could have a profanity filter for words like `DICK`, `C0CK`, `T1TS`, etc.
Landing any of these is quite rare with a hash range from 1 to 32^4 (1,048,576), but it's actually not that unlikely 
there is at least 1 match in any of these categories.


```json
{
  "version": 1,
  "lastAccessed": 1768235276970,
  "cache": {
    // The original media file. If the user visists on desktop, most likely this 
    // will get transferred and decrypted.
    "/media/nsfw/bun-fun.png.enc": "C7C7Ye8j6rCXzqhpGqf0ng==",
    
    // We use source sets as bandwidth optimization. This also means that we need 
    // to derive a new key for each variant. We actually need to implement custom 
    // source set loading, since the binary files are not natively handled.
    // Only one of these will be loaded if the screen width is smaller than 1920p 
    // and unless the viewport resizes a lot.
    "/media/nsfw/120p/bun-fun.png.enc": "lqjkjRtpUcREuQ+RDUpmLg==",
    "/media/nsfw/240p/bun-fun.png.enc": "yb2reK34MErqhnnE+Zbv6g==",
    "/media/nsfw/480p/bun-fun.png.enc": "vnCR8egHxVUGRILY5LPgEg==",
    "/media/nsfw/960p/bun-fun.png.enc": "TBKX4CBSKIZn4FQh/PUxBA==",
    "/media/nsfw/1440p/bun-fun.png.enc": "4uubhL7G6ytLKyuJ+iq/wg==",
    "/media/nsfw/s160p/bun-fun.png.enc": "TNEvB1Em04A61vzNuQ5Qvw==",

    // This represents all the post information like title, description, image 
    // dimensions, palette, tags, etc. Since this meta data describes the contents 
    // of the media item, we need to encrypt it too
    "/data/nsfw/bun-fun.json.enc": "VDu6VYpOAHwk5cxg04VBMw==",

    // JSON data to build the comment list. We dont want to expose who commented on 
    // naughty art, this needs to be encrypted too. Since the target parameter 
    // includes "nsfw", we will return a .JSON.ENC file from the PHP endpoint.
    "/api/comments?target=/nsfw/bun-fun": "KXKNMI79aGggCbe2PtXQ0w==",

    // Binary files for each individual comment, these get loaded via a custom 
    // encryption serving script. We will need to adapt `.htaccess`, so raw 
    // unencrypted files are not served, and only .ENC types.
    // The amount of sent files scales with the amount of comments.
    "/uploads_nsfw/comment_LGa6DJFZOww.png.enc": "uvNvI5M38HXEI92Qum3gKg==",
    "/uploads_nsfw/comment_LGa6DJFZOww.brsh.enc": "pdpGCAaTxxrI4g5gV6Qb0Q=="
  }
}
```

So when requesting an encrypted post, you'll end up with these HTTP calls for example:

| URL                                          | Description        |
| -------------------------------------------- | ------------------ |
| `/media/nsfw/bun-fun.png.enc`                | Image file         |
| `/data/nsfw/bun-fun.json.enc`                | Image data         |
| `/api/comments?target=/nsfw/bun-fun`         | Comment data       |
| `/uploads_nsfw/comment_LGa6DJFZOww.png.enc`  | Comment #1 image   |
| `/uploads_nsfw/comment_LGa6DJFZOww.brsh.enc` | Comment #1 history |
| `/uploads_nsfw/comment_HfMegZ6A46R.png.enc`  | Comment #2 image   |
| `/uploads_nsfw/comment_HfMegZ6A46R.brsh.enc` | Comment #2 history |

We need to keep in mind that localStorage has a size limit of about 2-5 MB per origin.
I did a rough size test with a 100 posts in the cache, all source sets variants loaded and a single comment each.
It came out at 136 KB (localStorage is UTF16 encoded sadly), so with a safety margin we can assume that 100 posts take up 200 KB in the local storage.
That means the pratical maximum for the key cache would be 1 MB (500 posts).
For now that should be sufficient, but that limit is definitely reachable (as of now, there are 512 SFW art posts).

Ok I just learned about IndexedDB and I wanna try using it since this seems a lot more sensible approach to store this amount of data
instead of in local storage that seems to be intended more like settings, bookmarks and other utility functions.

I particularly like that you can use compound keys for the key-value pairs to build up hierarchy, e.g.

```js
["post", "bun-fun", "image", "original"]
["post", "bun-fun", "image", "120"]
["post", "bun-fun", "meta"]
["post", "bun-fun", "comment", commentId]
```


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


### Cancelled: Container format

For decryption we need to actually get the binary files.
We will use the encrypted post data because they are tiny files (~ 2KB each).
Problem is, I do not want to send a hundred requests.
A single request with a 100KB file would make much more sense (and cache that file).

> **2025-JAN-21:**
> We will simply send the hundred requests.
> Its identical with how on the art overview page, each thumbnail gets sent in a request.
> This is not very network friendly, nor efficient, but it's easy and established (and less error-prone).
> Should the performance penalty be too severe (or another need for binary packing arise), I will revisit this idea.

|      | Field           |     Size | Type     | Description                                   |
| ---: | --------------- | -------: | -------- | --------------------------------------------- |
|  *0* | Magic bytes     |  4 bytes | char[4]  | `KBIN` (Krank binary container)               |
|  *4* | Version         |   1 byte | uint8    | Format version, is 1                          |
|  *5* | Packing date    |  8 bytes | char[8]  | `YYYYMMDD` in UTC+0                           |
| *13* | Author          | 19 bytes | char[19] | `https://krank.love/`                         |
| *32* | Number of files |  4 bytes | uint32   | Number of files                               |
| *36* | File Length N   |  4 bytes | uint32   | Length of file N (repeats for each file)      |
|    M | Payload N       | variable | bin[N]   | Arbitrary binary data (repeats for each file) |
