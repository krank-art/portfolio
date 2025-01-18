# Hosting NSFW images
Written on 11 January 2025

I've drawn a lot of things over the years, including NSFW artwork (ehem, *pornography* 💅).
I've hidden artworks deep in folder structures, on encrypted drives and niche social media accounts.
Being sneaky is fun and it also gives you security in this very sensitive area.

> Just think if you had a breach in a social domain, like coworkers finding out about your fruity side. Oof, no thanks.

Still, being sneaky makes it quite annoying to share  distinguished artwork with distinguished people.
It also makes it annoying for myself, I want to have a catalogue of all the art I created over the years.

For a while now I've been thinking on how to best restrict access to it.
There is legal ramifications about hosting adult content, you need to ensure that the viewer is over 18 years old.
The content should not be available to the general public,  including random visitors and search engines.
 furthermore I don't want to host the images directly on my webserver.
 if I mess up the security configuration,  things could leak.
 if  people from my hosting provider

Also I only want to expose this side of me to selected people.
The worst case would be that images appear in the image search when typing in my user handle.

All the content on my website are my responsibility. 
I'm renting a webserver, so platform availability is out of my domain.
As a nsfw website owner you have to make sure that the viewer is over eighteen years old.
I cannot reliably guarantee that every user is over eighteen years old, but I can do so to my best judgment.

 we will encrypt all nsfw  images.
 you need to insert a password to decrypt the images.
 stirring the images in  encrypted form  on the server has also the benefit that no sensitive images can leak if there is some kind of configuration problem.


 if a person wants to get axes to the forbidden side of this website,  the need to ask  the author for password.
 the images can also be encrypted with the new password  to put the old password out of circulation.


 encryption

 all encrypted and decrypt that images will be hosted as pngs.
 we then take the pixel data and use the AES-128-CBC algorithm.
 this way the resulting image

 because the encrypted image is just some gobbled pixels,  we want to present I you with something nicer.
 we will use steganography  to embed the encrypted image (the actual payload) in a blurred preview image.

 the problem we face is that the user needs to decrypt the image on the client.
 I don't want to use a lot of dependency ease and include them with to cly in javascript.
 so the decryption process should be relatively straightforward.


##  approaches

###  naive

*  just take the image as a whole and encrypt all of it with AES-128-CBC.
*   the downside is that the resulting image  is no longer a valid PNG.  it doesn't even have the file type  signifier anymore.
*  this corrupted ping fell also cannot be the you'd in the baraza or in the file system


###  symmetric encryption

*  for this approach we take all the pixel data,  encrypt only the pixel data,  and keep the resulting foul size similar