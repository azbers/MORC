import http.server, functools, json
class H(http.server.SimpleHTTPRequestHandler):
    def translate_path(self, path):
        p=path.split('?')[0]
        if not p.startswith('/shopify/'):
            p='/_mock'+p
        return super().translate_path(p)
    def do_POST(self):
        self.send_response(200); self.send_header('Content-Type','application/json'); self.end_headers()
        self.wfile.write(json.dumps({"items":[],"discount_codes":[],"total_discount":0}).encode())
    def log_message(self,*a): pass
http.server.ThreadingHTTPServer(('127.0.0.1',8765),functools.partial(H,directory='/home/claude/MORC')).serve_forever()
