from __future__ import annotations

import hashlib
import re
import time
from pathlib import Path
from urllib.parse import urlparse

import requests
from bs4 import BeautifulSoup


OWASP_ALLOWED_HOST = "cheatsheetseries.owasp.org"

CACHE_DIR = Path(__file__).resolve().parent.parent / "cache" / "owasp"

CACHE_TTL_SECONDS = 24 * 60 * 60

REQUEST_TIMEOUT_SECONDS = 15

MAX_CONTENT_CHARACTERS = 18_000

USER_AGENT = (
    "SecurePromptGenerator/1.0 "
    "(academic security research; OWASP Cheat Sheet retrieval)"
)


class OwaspResourceError(Exception):
    """Raised when an OWASP resource cannot be safely retrieved."""


def _validate_owasp_url(url: str) -> None:
    parsed = urlparse(url)

    if parsed.scheme != "https":
        raise OwaspResourceError(
            "Only HTTPS OWASP resources are allowed."
        )

    if parsed.hostname != OWASP_ALLOWED_HOST:
        raise OwaspResourceError(
            f"OWASP resource host is not allowed: {parsed.hostname}"
        )

    if not parsed.path.startswith("/cheatsheets/"):
        raise OwaspResourceError(
            "Only OWASP Cheat Sheet resources are allowed."
        )


def _cache_path(url: str) -> Path:
    digest = hashlib.sha256(url.encode("utf-8")).hexdigest()
    return CACHE_DIR / f"{digest}.txt"


def _read_cache(url: str) -> str | None:
    path = _cache_path(url)

    if not path.exists():
        return None

    age = time.time() - path.stat().st_mtime

    if age > CACHE_TTL_SECONDS:
        return None

    try:
        return path.read_text(encoding="utf-8")
    except OSError:
        return None


def _write_cache(url: str, content: str) -> None:
    CACHE_DIR.mkdir(parents=True, exist_ok=True)

    path = _cache_path(url)

    try:
        path.write_text(content, encoding="utf-8")
    except OSError:
        # Cache failure must not make OWASP retrieval fail.
        pass


def _clean_text(value: str) -> str:
    value = value.replace("\xa0", " ")
    value = value.replace("¶", "")
    value = value.replace("Â¶", "")

    value = re.sub(r"[ \t]+", " ", value)
    value = re.sub(r"\n[ \t]+", "\n", value)
    value = re.sub(r"\n{3,}", "\n\n", value)

    return value.strip()


def _extract_cheat_sheet_content(html: str) -> str:
    soup = BeautifulSoup(html, "html.parser")

    for element in soup(
        [
            "script",
            "style",
            "noscript",
            "svg",
            "nav",
            "footer",
            "header",
        ]
    ):
        element.decompose()

    main = soup.find("main")

    if main is None:
        main = soup.find("article")

    if main is None:
        main = soup.body

    if main is None:
        raise OwaspResourceError(
            "Unable to locate the OWASP Cheat Sheet content."
        )

    text = main.get_text(separator="\n", strip=True)
    text = _clean_text(text)

    if not text:
        raise OwaspResourceError(
            "The OWASP Cheat Sheet contains no extractable text."
        )

    if len(text) > MAX_CONTENT_CHARACTERS:
        text = (
            text[:MAX_CONTENT_CHARACTERS]
            + "\n\n[OWASP content truncated by Secure Prompt Generator]"
        )

    return text


def fetch_owasp_resource(url: str) -> str:
    """
    Retrieve and extract an approved OWASP Cheat Sheet.

    Only cheatsheetseries.owasp.org HTTPS Cheat Sheet URLs are accepted.
    A local cache is used to avoid downloading the same resource repeatedly.
    """

    _validate_owasp_url(url)

    cached_content = _read_cache(url)

    if cached_content:
        return cached_content

    try:
        response = requests.get(
            url,
            timeout=REQUEST_TIMEOUT_SECONDS,
            headers={
                "User-Agent": USER_AGENT,
                "Accept": "text/html,application/xhtml+xml",
            },
            allow_redirects=True,
        )

        response.raise_for_status()

    except requests.RequestException as exc:
        raise OwaspResourceError(
            f"Unable to retrieve OWASP resource: {exc}"
        ) from exc

    # Validate the final URL too, because requests follows redirects.
    _validate_owasp_url(response.url)

    content_type = response.headers.get(
        "Content-Type",
        "",
    ).lower()

    if "text/html" not in content_type:
        raise OwaspResourceError(
            f"Unexpected OWASP content type: {content_type}"
        )

    content = _extract_cheat_sheet_content(response.text)

    _write_cache(url, content)

    return content


def fetch_owasp_resources(resources: list[dict]) -> list[dict]:
    """
    Retrieve several OWASP resources independently.

    Failure of one resource does not prevent the remaining resources
    from being returned.
    """

    results = []

    for resource in resources:
        title = str(resource.get("title", "")).strip()
        url = str(resource.get("url", "")).strip()

        if not title or not url:
            continue

        try:
            content = fetch_owasp_resource(url)

            results.append(
                {
                    "title": title,
                    "url": url,
                    "content": content,
                    "status": "success",
                }
            )

        except OwaspResourceError as exc:
            results.append(
                {
                    "title": title,
                    "url": url,
                    "content": "",
                    "status": "error",
                    "error": str(exc),
                }
            )

    return results

