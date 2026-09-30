#!/usr/bin/env python3
"""Servidor local sin caché para que los cambios aparezcan inmediatamente."""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()


if __name__ == "__main__":
    server = ThreadingHTTPServer(("0.0.0.0", 4173), NoCacheHandler)
    print("Galería disponible en http://0.0.0.0:4173", flush=True)
    server.serve_forever()
