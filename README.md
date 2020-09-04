# synthpass-standalone
Little web app to generate synthpass-compatible passwords when you can't use an extension.

The algorithm is the same as that of SynthPass, available from https://synthpass.com, or right here at Github: https://github.com/fruiz500/synthpass

Differences:
* The standalone needs you to input the website URL (just the end will do), as in google.com or amazon.co.uk
* The standalone does not use storage (can be added if users request it, though), so users have to remember their user ID, password length, and serial, if used.
* But it runs on mobile devices, which the extension doesn't, because mobile browsers do not (yet) support extensions.

GNU License 3.0. Enjoy!
