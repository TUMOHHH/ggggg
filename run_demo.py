import http.server
import socketserver
import threading
import webbrowser

PORT = 8000
DEMO_FILE = "lando_wave_mask_demo.html"


def start_server():
    handler = http.server.SimpleHTTPRequestHandler
    with socketserver.TCPServer(("0.0.0.0", PORT), handler) as httpd:
        print(f"Serving at http://localhost:{PORT}/{DEMO_FILE}")
        httpd.serve_forever()


def main():
    threading.Thread(target=start_server, daemon=True).start()
    url = f"http://localhost:{PORT}/{DEMO_FILE}"
    print(f"Opening {url} in your browser...")
    webbrowser.open(url)
    try:
        threading.Event().wait()
    except KeyboardInterrupt:
        print("\nShutting down server...")


if __name__ == "__main__":
    main()
