"""
Serve the Next.js static export (frontend) from Django.
Handles catch-all for client-side routing and dynamic route placeholders.
"""
import os
from pathlib import Path

from django.http import FileResponse, Http404, HttpResponse
from django.views.static import serve as static_serve


# Frontend output directory (set by start_server or Dockerfile)
BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_ROOT = BASE_DIR / "frontend_out"

# Dynamic route patterns: (path_regex, placeholder_path)
# Maps /invoices/123 to /invoices/_/index.html
DYNAMIC_PATTERNS = [
    (r"/dashboard/finance/invoices/[^/]+/?$", "dashboard/finance/invoices/_/index.html"),
    (r"/dashboard/finance/bank-reconciliation/[^/]+/?$", "dashboard/finance/bank-reconciliation/_/index.html"),
    (r"/dashboard/hr/performance/reviews/[^/]+/?$", "dashboard/hr/performance/reviews/_/index.html"),
    (r"/dashboard/hr/recruitment/[^/]+/?$", "dashboard/hr/recruitment/_/index.html"),
    (r"/reset-password/[^/]+/[^/]+/?$", "reset-password/_/_/index.html"),
]


def serve_frontend(request, path=""):
    """Serve frontend static files with fallback for SPA routing."""
    if not FRONTEND_ROOT.exists():
        return HttpResponse(
            "<h1>Frontend not built</h1><p>Run: cd LEXIE_ERP/Frontend && npm run build</p>",
            status=503,
        )

    # Normalize path: empty or trailing slash -> index
    path = (path or "").strip("/")
    if not path:
        path = "index"
    if not path.endswith(".html") and not path.startswith("_next/") and "/" not in path or not any(c in path for c in [".", "_next"]):
        # Could be a directory - try index.html
        pass

    # Try exact path first
    full_path = FRONTEND_ROOT / path
    if full_path.is_file():
        return FileResponse(open(full_path, "rb"), filename=path)

    # Try path/index.html (Next.js static export with trailingSlash)
    index_path = FRONTEND_ROOT / path / "index.html"
    if index_path.is_file():
        return FileResponse(open(index_path, "rb"), filename=f"{path}/index.html")

    # Try path.html (e.g. /login -> login.html)
    html_path = FRONTEND_ROOT / f"{path}.html"
    if html_path.is_file():
        return FileResponse(open(html_path, "rb"), filename=f"{path}.html")

    # Map dynamic routes to placeholder pages
    path_with_slash = f"/{path}/" if path != "index" else "/"
    import re
    for pattern, placeholder in DYNAMIC_PATTERNS:
        if re.match(pattern, path_with_slash):
            placeholder_path = FRONTEND_ROOT / placeholder
            if placeholder_path.exists():
                return FileResponse(open(placeholder_path, "rb"), filename=placeholder)

    # Fallback: serve index.html for SPA client-side routing
    index_html = FRONTEND_ROOT / "index.html"
    if index_html.exists():
        return FileResponse(open(index_html, "rb"), filename="index.html")

    raise Http404("Frontend file not found")
