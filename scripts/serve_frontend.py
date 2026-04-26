from __future__ import annotations

import argparse
import http.server
import socketserver
from pathlib import Path


class SpaRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, directory: str | None = None, **kwargs):
        super().__init__(*args, directory=directory, **kwargs)

    def do_GET(self) -> None:  # noqa: N802
        requested_path = Path(self.translate_path(self.path))
        dist_dir = Path(self.directory or ".").resolve()

        if self.path.startswith("/assets/") or requested_path.exists():
            return super().do_GET()

        self.path = "/index.html"
        return super().do_GET()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=5173)
    parser.add_argument("--directory", default="frontend/dist")
    args = parser.parse_args()

    directory = str(Path(args.directory).resolve())

    with socketserver.TCPServer(("", args.port), lambda *a, **k: SpaRequestHandler(*a, directory=directory, **k)) as httpd:
        print(f"Serving frontend at http://localhost:{args.port}")
        httpd.serve_forever()


if __name__ == "__main__":
    main()
