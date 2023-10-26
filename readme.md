# Krank Portfolio

This is a static side generator used to create the furry art portfolio by [@Krankomat96](https://twitter.com/Krankomat96).


## Installation

1. Make sure to have [NodeJS](https://nodejs.org/) installed.
2. Clone or download this repository.
3. Run `npm install`.
4. Copy your art files into `static/art/`.
5. Run `npm run cli import:art`.
6. Run `npm run cli build`.
7. Run `npm run serve-python` (make sure you have Python 3+ installed).


## CLI Usage

Basic usage: `npm run cli <command> <args?>`. 

`<args?>` is an optional list of arguments with variable length.  
`<command>` is one of the following commands:  

* `clean`
  * Removes all files from `dist/` and `.cache/` (including the folders themselves).
* `import:art`
  * Reads all files from `static/art/` and updates `data/media-art.json` accordingly.
  * If there is no `media-art.json` file, it gets created.
  * **Important:** Normal properties get overwritten, while **manual** properties are kept once created:
    * `title`: Displayed title of the art piece.
    * `description`: Description of the art piece, that gets displayed in the expandable sidebar.
    * `imageAlt`: Alt text for the art piece image.
    * `tags`: Tags used to filter and search art pieces.
    * `palette`: A list of colors that have been used when painting certain art pieces. 
      Should not be confused with `vibrantColors`, which get programmatically extracted from the images when importing.
* `inspect:art`
  * Logs a compact list of all art pieces.
  * This is used to compare what files have changed.
  * The output should be saved to `docs/history/` every time any of the art files changes.
* `build`
  * Runs `build:assets`, `build:html`, and `build:art` in sequence.
* `build:assets`
  * Builds the styles from `style/` to `dist/bundle.css`.
  * Builds the scripts from `lib/main.js` to `dist/bundle.js`.
  * Copies the favicon files from `static/favicon/` to `dist/`.
* `build:html`
  * Builds the HTML files from `pages/` to `dist/`.
  * Optimization:
    * Depending on the project size, hundreds of HTML files are generated on each minor edit.
    * To minimize the number of file written to disk, HTML files are only saved if the content has changed  or if the file doesn't exist yet.
    * For that we use the `.cache/pages.json` file.
    * Remember deleting the cache, if things do not compile as expected.
* `build:art`
  * Copies the art files from `static/art/` to `dist/media/art` with the public file name specified for each art piece in `data/media-art.json`.
  * Creates downsized versions for each art piece at `dist/media/art/<size>p` with max dimensions: `120`, `240`, `480`, `960`, `1440`.
  * Optimization:
    * Reading, processing, copying and generating files  are quite expensive operations.
    * For this reason, art files only get processed if their file size has changed OR if the "file modified" value has changed.
    * In the past, "file modified" values behaved inconsistently across different devices, so we only look at seconds as smallest time value.
* `watch`
  * Runs `watch:assets`, `watch:html`, and `watch:art` and keeps them running in parallel.
  * Press `Ctrl + C` to abort all file watchers.
* `watch:assets`
  * Runs `build:assets` every time files are changed at `lib/` or `style/`.
  * Press `Ctrl + C` to abort the file watcher.
* `watch:html`
  * Runs `build:html` every time files are changed at `pages/`, `layouts/`, `components/` or `data/media-art.json`.
  * Press `Ctrl + C` to abort the file watcher.
* `watch:art`
  * Runs `build:art` every time files are changed at `static/art/` or `data/media-art.json`.
  * Press `Ctrl + C` to abort the file watcher.


## Development

Run `npm run serve-python` to start a `localhost:8000` webserver at `dist/` (make sure you have Python 3+ installed).

On Windows, its a good idea to run the dev servers on WSL (Windows Subsystem for Linux). 
I ran into problems where the Python server could not be shutdown properly and restarting was very buggy.
To run Python on Windows 10 & 11, follow these steps:

1. Keep in mind that your pc/setup might not support WSL, please research if setup does not work.
2. Open start menu and search for `Windows Features`.
3. Run `Turn Windows features on or off`.
4. Activate the options `Virtual Machine Platform` and `Windows Subsystem for Linux`.
5. Reboot Windows.
6. Open a Powershell terminal with admin rights.
7. Run `wsl --list` to list installed Linux distributions.
8. Run `wsl --list --online` to list all distributions that can be installed.
9. Pick your favorite, e.g. `wsl install -d "Ubuntu 22.04 LTS"`.
10. Open Windows Search and open a `Ubuntu` (or other distro) shell.
11. Run `cd /mnt/c` to go to the mounted Windows drive.
12. Run `cd your/path/to/project` till you are in the web dev folder.
13. Run `sudo apt update` to update all packages.
14. Run `sudo apt install nodejs` to install NodeJS.
15. Run `node -v` to check the NodeJS version (just to be safe).
16. Run `npm run serve-python` to start the Python web dev server.
17. Press `Ctrl + C` to abort running the dev server.


## Deployment

1. Update version of project:
   1. Go to [pages/changelog.hbs] and write down the changes for the current version.
   2. Update the version in `package.json` and run `npm install`.
   3. Create a commit `Update to version vX.X.X` with the updated package files `package.json` and `package-lock.json`.
   4. Create an annotated tag with `git tag -a vX.X.X -m "my version X.X.X"`.
   5. Push the annotated tag to the repository with `git push --follow-tags`.
2. Run `npm run cli clean` so no residual files are left.
3. Change `config/config.dev.js`, so `path.base` reflects the URL of the deployed server.  
   > **Note:** These changes should not be committed to the repository, because they will break certain features of the development environment.
4. Run `npm run cli build` to build all files.
5. Connect to your webserver via FTP and copy all files from `dist/` there.
6. This project uses URLs without the `.html` extension, so we have to set up routing properly on the target web server.
7. Copy the appropriate files from `www/` onto the webserver. Currently these languages are supported:
   * PHP: Copy `www/.htaccess` to the webserver.
   * Python: Copy `server.py` to the webserver.
8. Revert the changes in `config/config.dev.js`.



## Ideas

* Add 404 page.
* Add art filtering via tags.
* Add title, description, etc. to each art piece.
* Add missing art pieces from 2019-2023.
* Add category for gifts and prepare files.
* Add comment feature with MiiVerse-like comment drawing.


## See also

* Favicons generated with https://favicon.io/favicon-converter/.
* How `srcset` and `sizes` in `<img>` works: https://stackoverflow.com/a/35143131/8177138-how-to-use-srcset-and-sizes-for-responsive-images.


## Credis

Krank (c) 2023
