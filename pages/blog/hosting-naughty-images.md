# Hosting NSFW images
Written on 11 January 2025

 I've ran a lot of things ever the years  including NSFW  artwork.
 I want to host it on my website,  but there is legal ramifications  about hosting adult content.
Depending on the country, you are not allow to host specific kinds of pornography.

 to ben problem I'm facing is that you have to make sure  that if you is over eighteen years old.
 because I cannot reliably guarantee that he uses over eighteen years old comer,  we will encrypt all nsfw  images.
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