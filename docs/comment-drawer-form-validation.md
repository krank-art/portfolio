# Securing the comment upload form against spam

One feature of this site is that uses can draw comments under art posts.
There is no need to create an account, you can draw whatever you want and share it with me + other visitors.

If you're familiar with webservers then you might now have a very worried look on your face:
**Anonymous users can upload to my server, adding records in the database and expose them to other users.**

That means automated bots and malicious clients can just spam my endpoint, upload malformed requests or just be rude.
Oh boy, what a nightmare 😅
Still, want the comment feature to be as accessible as possible. 
Like the guest books in the early days of the internet!

So I'm planning ahead by implementing certain security features which will hopefully prevent the majority of spam:

| Technique | Reasoning |
|---:|---|
| JS-loaded form |  form gets only built upon clicking button, filters out dumb  bots|
| Honey Pot |  hidden input field that automated bots will fill in, request will silently be rejected |
| Rate limiting | requests per hashed IP addresses will be logged to contain spam attacks |
| Input validation |  all of the supplied data gets sanitized and validated |
| Comment moderation |  comments are being manually reviewed by me as admin from time to time|

Keep in mind that  with webservers there is no 100% protection.
The goal is to add friction, so automated attacks become a hassle to execute you and the average visitor has only minor inconveniences.


### JS-loaded form

This is a neat side effect of writing a JavaScript based commenting tool!

The upload form only gets loaded when the user clicks the submit button.
Spam bots need to be able to interpret JavaScript, which requires more advanced tool like `puppeteer`. 
Simple crawlers or HTTP requests like `curl` stand no chance!


### Honey pot

A honeypot is a hidden input field which regular users will not notice, but automated systems will fill in.
Submitted request with a filled out honeypot value will silently be rejected by the server.

This works because dumb automated bots will simply traverse sites on the internet and fill in common fields like "author", "message" and "website" if found.
The key is that the server acts like this was a good request and returns 200 OK,  but internally the request gets discarded.

On my website this will be the "email" field.
Users can only submit two fields, "username" and "website",  contact information is supposed to be reached via the website link (like Twitter, Bluesky, etc).

We must not forget **accessability**, because the input field needs to be in the document flow but also hidden from sight.
This is horrible for screenreader users, because they tab through the controls on the site or navigate website content with the screenreader exploration mode.
To add insult to injury, upon submission the server reports that everything went well --  but the user cannot *see* that it went wrong.

So the honeypot input gets marked with `aria-hidden="true"` and `tabindex="-1"`.


### Rate limiting

Rate limiting is an age old technique to limit how many requests a user can send in a given timeframe.
There are different features you can use to identify users, commonly the incoming IP address, the user agent and other device information.

I thought long and hard how to avoid this but I'm afraid there is no workaround, I gotta save *some part* of the IP address of people that send in comments.
**But instead of saving the actual IP address, I will just save a HMAC-SHA256 hash of it.**

Whenever a request comes into the server, a hash key is generated from the requesting IP address and a server secret.
The server then counts how many times this user has tried to upload a comment in a rolling time window.
If the current tries have exceed the rate limit, then the request will be rejected with "429 Too Many Requests".

The benefit of HMAC-SHA256 is that I myself cannot reverse it, the algorithm is deterministic and one way.



## Further techniques

### Session tokens


POST /comments/upload

and suddenly, 172 empty malicious comments appear on my site

I can generate a signed Token when users open the form and then validate the token when they submit, but that kinda just adds an extra step that they gotta do 

GET /art/{my-post} to get the token and then


### CAPTCHAs

### Account creation

POST /comments/upload

there is the obvious honey trap, a hidden field name="website" (or better name="lol-you-stupid" that dumb bots will fill in and my upload form will detect that they cheated and decline

another technique is CAPTCHA, but there are services now that automatically solve them with AI. ech



Krank — 12:52 AM

I could add rate limiting, so an IP endpoint can only submit 5 comments per minute. or better yet, check how much time a person has spent drawing the comment and then tries to submit it. if a person spent 0.1secs drawing a comment, its either empty or automated 

I had the idea to calculate a complexity rating for a comment. like, how many pixel color changes are there for example. so low complexity comments (like someone just drawing a single line) I can get a warning for and toss out or not allowing to get uploaded at all

in practical terms, there is no way I can make this secure. there are just ways to make it more annoying to add spam. dedicated users will always find a way to send invalid data.

if there is a big problem with spam, then I will turn off that unverified comments get displayed at all and then review comments in the backend before they can appear on the site publicly.



Krank — 11:53 AM

oh yea, thats definitely possible! but then I have to safely store email addresses, and there is quite some legal ramifications about that 😅 thats also why I didnt pursue the newsletter feature

it also shifts the verification process to verifying accounts then. there is services like protonmail or 10minutemail with temporary emails which can be used for spam accounts too

the whole idea of spam protection is to add enough friction so most automated bots wont bother (while still not being too annoying for regular users).