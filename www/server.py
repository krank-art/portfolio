#!/usr/bin/env python
# Based on https://gist.github.com/jdkanani/4503653
import os
from http.server import HTTPServer
from http.server import SimpleHTTPRequestHandler

ROUTES = [
    ('/', '../dist/')
]

DIRECTORY = ".." + os.sep + "dist"


web_dir_raw = os.path.join(os.path.dirname(__file__), DIRECTORY)
web_dir = os.path.abspath(web_dir_raw)
#os.chdir(web_dir)

class MyHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)
    def translate_path(self, path):
        # default root -> cwd        
        root = os.getcwd()
        
        # Add .html extension to requested paths if not already present
        if path != "/" and not "." in path:
            path += ".html"

        # look up routes and get root directory
        for patt, rootDir in ROUTES:
            if path.startswith(patt):                
                path = path[len(patt):]
                root = rootDir
                break
        # new path
        return os.path.join(root, path)    

def handler_from(directory):
    def _init(self, *args, **kwargs):
        return SimpleHTTPRequestHandler.__init__(self, *args, directory=self.directory, **kwargs)
    return type(f'HandlerFrom<{directory}>',
                (SimpleHTTPRequestHandler,),
                {'__init__': _init, 'directory': directory})


if __name__ == '__main__':
    httpd = HTTPServer(('127.0.0.1', 8000), MyHandler)
    httpd.serve_forever()
