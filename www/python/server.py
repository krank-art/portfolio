#!/usr/bin/env python
import os
import sys
import signal
from http.server import HTTPServer
from http.server import SimpleHTTPRequestHandler

# IP has to be '0.0.0.0', so we can also reach it with other devices in the same LAN network.
IP = '0.0.0.0' 
PORT = 8000 
DIRECTORY = ".." + os.sep + ".." + os.sep + "dist"

web_dir_raw = os.path.join(os.path.dirname(__file__), DIRECTORY)
web_dir = os.path.abspath(web_dir_raw)

class MyHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs, directory=web_dir)
    def do_GET(self):
        path, _, query = self.path.partition('?')
        if self.path != "/" and not "." in self.path:
            self.path = f"{path}.html?{query}" if query else f"{path}.html"
        absolutePath = self.translate_path(self.path)
        if not os.path.exists(absolutePath):
            self.path = "404.html"
        SimpleHTTPRequestHandler.do_GET(self)

def stopServer(server: HTTPServer):
    print(f'Stopping HTTP on {IP}:{PORT}. ')
    server.shutdown()
    sys.exit(0)

if __name__ == '__main__':
    print(f'Serving HTTP on {IP}:{PORT} ...')
    httpd = HTTPServer((IP, PORT), MyHandler)
    signal.signal(signal.SIGINT, lambda signum, frame: stopServer(httpd))
    httpd.serve_forever()
