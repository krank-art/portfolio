#!/usr/bin/env python
import os
from http.server import HTTPServer
from http.server import SimpleHTTPRequestHandler

DIRECTORY = ".." + os.sep + "dist"

web_dir_raw = os.path.join(os.path.dirname(__file__), DIRECTORY)
web_dir = os.path.abspath(web_dir_raw)

class MyHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs, directory=web_dir)
    def translate_path(self, path):
        # Omit .html extension for paths
        if path != "/" and not "." in path:
            path += ".html"
        return super().translate_path(path)
    def do_GET(self):
        super().do_GET()

if __name__ == '__main__':
    httpd = HTTPServer(('127.0.0.1', 8000), MyHandler)
    httpd.serve_forever()
