#! /usr/bin/env python3

import sys
import http.server

port = 3000 if len(sys.argv) == 1 else int(sys.argv[1])
httpd = http.server.HTTPServer(
  ('localhost', port), http.server.SimpleHTTPRequestHandler)
httpd.serve_forever()
