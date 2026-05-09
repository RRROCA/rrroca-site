from __future__ import annotations

import hashlib
import json
import re
import sys
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable
from urllib.parse import urljoin, urlparse
import xml.etree.ElementTree as ET

import requests
from bs4 import BeautifulSoup, Comment, Tag
from markdownify import markdownify as to_markdown


ROOT = Path(__file__).resolve().parents[1]
CONTENT_DIR = ROOT / "content"
STATIC_UPLOADS_DIR = ROOT / "static" / "images" / "uploads"
SITEMAP_URLS = [
    "https://rrroca.org/en/page-sitemap.xml",
    "https://rrroca.org/en/post-sitemap.xml",
]
ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
MAX_IMAGE_BYTES = 5 * 1024 * 1024
REQUEST_DELAY_SECONDS = 0.5
SITE_SUFFIXES = [
    " - Rocky Ridge Royal Oak Community Association Calgary Canada",
    " - Rocky Ridge Royal Oak Community Association",
]


@dataclass(frozen=True)
class PageTarget:
    url: str
    output: str
    category: str


TARGETS: list[PageTarget] = [
    PageTarget("https://rrroca.org/en/about-rrroca-calgary/", "about\\_index.md", "about"),
    PageTarget(
        "https://rrroca.org/en/about-rrroca-calgary/rrroca-board-of-directors/rrroca-meeting-minutes/",
        "about\\meeting-minutes.md",
        "about",
    ),
    PageTarget("https://rrroca.org/en/about-rrroca-calgary/bylaws/", "about\\bylaws.md", "about"),
    PageTarget(
        "https://rrroca.org/en/about-rrroca-calgary/president-message/",
        "about\\president-message.md",
        "about",
    ),
    PageTarget("https://rrroca.org/en/rrroca-community/safety/", "safety\\_index.md", "safety"),
    PageTarget(
        "https://rrroca.org/en/rrroca-community/safety/wild-animal-safety/",
        "safety\\wild-animal-safety.md",
        "safety",
    ),
    PageTarget(
        "https://rrroca.org/en/rrroca-community/safety/winter-safety/",
        "safety\\winter-safety.md",
        "safety",
    ),
    PageTarget(
        "https://rrroca.org/en/rrroca-community/safety/electrical-safety/",
        "safety\\electrical-safety.md",
        "safety",
    ),
    PageTarget("https://rrroca.org/en/rrroca-community/", "community\\_index.md", "community"),
    PageTarget("https://rrroca.org/en/rrroca-community/groups/", "community\\groups.md", "community"),
    PageTarget(
        "https://rrroca.org/en/rrroca-community/rrroca-calgary-community-garden/",
        "community\\community-garden.md",
        "community",
    ),
    PageTarget(
        "https://rrroca.org/en/rrroca-community/baby-sitter-registry/",
        "community\\babysitter-registry.md",
        "community",
    ),
    PageTarget("https://rrroca.org/en/rrroca-community/home-owners/", "community\\home-owners.md", "community"),
    PageTarget("https://rrroca.org/en/rrroca-community/schools/", "community\\schools.md", "community"),
    PageTarget(
        "https://rrroca.org/en/rrroca-community/community-park-project/",
        "community\\community-park.md",
        "community",
    ),
    PageTarget("https://rrroca.org/en/rrroca-events-calgary/", "events\\_index.md", "events"),
    PageTarget(
        "https://rrroca.org/en/rrroca-events-calgary/block-party-ideas/",
        "events\\block-party-ideas.md",
        "events",
    ),
    PageTarget("https://rrroca.org/en/join-rrroca/", "get-involved\\_index.md", "get-involved"),
    PageTarget("https://rrroca.org/en/join-rrroca/sponsorship/", "get-involved\\sponsorship.md", "get-involved"),
    PageTarget("https://rrroca.org/en/volunteer-application/", "get-involved\\volunteer.md", "get-involved"),
    PageTarget("https://rrroca.org/en/businesses_discount/", "business-directory\\_index.md", "business-directory"),
    PageTarget("https://rrroca.org/en/sport/", "sports\\_index.md", "sports"),
    PageTarget("https://rrroca.org/en/sport/sport-clubs/", "sports\\sport-clubs.md", "sports"),
    PageTarget("https://rrroca.org/en/sport/spring-sports/", "sports\\spring-sports.md", "sports"),
    PageTarget("https://rrroca.org/en/baseball/", "sports\\baseball.md", "sports"),
    PageTarget(
        "https://rrroca.org/en/news-freedom_mobile_proposed_tower/",
        "news\\freedom-mobile-tower.md",
        "news",
    ),
    PageTarget("https://rrroca.org/en/news-community-avid-readers/", "news\\community-avid-readers.md", "news"),
    PageTarget("https://rrroca.org/en/presidentsmessage2022/", "news\\presidents-message-2022.md", "news"),
    PageTarget("https://rrroca.org/en/news-royal-vista-business-park/", "news\\royal-vista-business-park.md", "news"),
    PageTarget(
        "https://rrroca.org/en/news-newdevelopmentpermitapplication/",
        "news\\new-development-permit.md",
        "news",
    ),
    PageTarget("https://rrroca.org/en/contact-us/terms-of-use/", "terms-of-use.md", "legal"),
    PageTarget("https://rrroca.org/en/contact-us/privacy-statement/", "privacy-statement.md", "legal"),
    PageTarget("https://rrroca.org/en/ward-1-forum/", "about\\ward-1-forum.md", "about"),
    PageTarget("https://rrroca.org/en/gallery/", "gallery.md", "gallery"),
    PageTarget("https://rrroca.org/en/news/past-community-newsletters/", "news\\past-newsletters.md", "news"),
]


class PoliteSession:
    def __init__(self) -> None:
        self.session = requests.Session()
        self.session.headers.update(
            {
                "User-Agent": (
                    "RRROCA Hugo Importer/1.0 "
                    "(https://github.com/github/copilot-cli; migration tooling)"
                )
            }
        )
        self._last_request_at = 0.0

    def get(self, url: str, **kwargs) -> requests.Response:
        attempts = kwargs.pop("attempts", 4)
        for attempt in range(1, attempts + 1):
            elapsed = time.monotonic() - self._last_request_at
            if elapsed < REQUEST_DELAY_SECONDS:
                time.sleep(REQUEST_DELAY_SECONDS - elapsed)
            try:
                response = self.session.get(url, timeout=45, **kwargs)
                self._last_request_at = time.monotonic()
                if response.status_code >= 500 and attempt < attempts:
                    response.close()
                    time.sleep(attempt)
                    continue
                return response
            except requests.RequestException:
                self._last_request_at = time.monotonic()
                if attempt >= attempts:
                    raise
                time.sleep(attempt)
        raise RuntimeError(f"Request failed unexpectedly: {url}")


def log(message: str) -> None:
    print(message, flush=True)


def fetch_sitemap_lastmods(client: PoliteSession) -> dict[str, str]:
    lastmods: dict[str, str] = {}
    for sitemap_url in SITEMAP_URLS:
        try:
            response = client.get(sitemap_url)
            response.raise_for_status()
            root = ET.fromstring(response.text)
            for url_node in root.findall(".//{*}url"):
                loc = url_node.findtext("{*}loc")
                lastmod = url_node.findtext("{*}lastmod")
                if loc and lastmod:
                    lastmods[loc.strip()] = lastmod.strip()
        except Exception as exc:  # noqa: BLE001
            log(f"[warn] Failed to read sitemap {sitemap_url}: {exc}")
    return lastmods


def clean_title(raw_title: str) -> str:
    title = re.sub(r"\s+", " ", raw_title.replace("\xa0", " ")).strip()
    for suffix in SITE_SUFFIXES:
        if title.endswith(suffix):
            title = title[: -len(suffix)].strip()
    return title


def collect_json_ld(soup: BeautifulSoup) -> list[dict]:
    items: list[dict] = []
    for node in soup.select('script[type="application/ld+json"]'):
        if not node.string:
            continue
        try:
            payload = json.loads(node.string)
        except json.JSONDecodeError:
            continue
        if isinstance(payload, dict) and "@graph" in payload and isinstance(payload["@graph"], list):
            for item in payload["@graph"]:
                if isinstance(item, dict):
                    items.append(item)
        elif isinstance(payload, list):
            items.extend([item for item in payload if isinstance(item, dict)])
        elif isinstance(payload, dict):
            items.append(payload)
    return items


def extract_title(soup: BeautifulSoup) -> str:
    for selector in ("meta[property='og:title']", "meta[name='twitter:title']", "h1.entry-title", "h1"):
        node = soup.select_one(selector)
        if not node:
            continue
        value = node.get("content") if node.name == "meta" else node.get_text(" ", strip=True)
        if value:
            return clean_title(value)
    if soup.title and soup.title.string:
        return clean_title(soup.title.string)
    return "Untitled"


def extract_date(soup: BeautifulSoup, sitemap_lastmod: str | None) -> str:
    if sitemap_lastmod:
        return sitemap_lastmod

    for selector in (
        "meta[property='article:modified_time']",
        "meta[property='article:published_time']",
        "meta[name='article:modified_time']",
        "meta[name='article:published_time']",
    ):
        node = soup.select_one(selector)
        if node and node.get("content"):
            return node["content"].strip()

    for item in collect_json_ld(soup):
        for key in ("dateModified", "datePublished"):
            value = item.get(key)
            if isinstance(value, str) and value.strip():
                return value.strip()

    return "1970-01-01T00:00:00+00:00"


def first_meaningful_paragraph(container: Tag | None) -> str:
    if not container:
        return ""
    for paragraph in container.find_all(["p", "li"]):
        text = normalize_text(paragraph.get_text(" ", strip=True))
        if len(text) >= 40:
            return text
    for paragraph in container.find_all(["p", "li", re.compile(r"^h[1-6]$")]):
        text = normalize_text(paragraph.get_text(" ", strip=True))
        if len(text) >= 10:
            return text
    return ""


def extract_keywords(values: Iterable[str]) -> list[str]:
    tags: list[str] = []
    seen: set[str] = set()
    for value in values:
        for part in re.split(r"[,|/]", value):
            cleaned = normalize_text(part).strip(" -")
            if cleaned and cleaned.lower() not in seen:
                tags.append(cleaned)
                seen.add(cleaned.lower())
    return tags


def normalize_text(text: str) -> str:
    return re.sub(r"\s+", " ", text.replace("\xa0", " ")).strip()


def extract_tags(soup: BeautifulSoup) -> list[str]:
    values: list[str] = []
    keywords = soup.select_one("meta[name='keywords']")
    if keywords and keywords.get("content"):
        values.append(keywords["content"])

    for item in collect_json_ld(soup):
        for key in ("keywords", "articleSection"):
            value = item.get(key)
            if isinstance(value, str):
                values.append(value)
            elif isinstance(value, list):
                values.extend([str(entry) for entry in value if entry])

    for anchor in soup.select("a[href*='/tag/'], a[rel~='tag'], a[href*='/category/']"):
        text = normalize_text(anchor.get_text(" ", strip=True))
        if text:
            values.append(text)

    return extract_keywords(values)


def strip_comments(soup: BeautifulSoup) -> None:
    for comment in soup.find_all(string=lambda value: isinstance(value, Comment)):
        comment.extract()


def remove_unwanted_nodes(container: Tag) -> None:
    selectors = [
        "script",
        "style",
        "noscript",
        "iframe",
        "form",
        "input",
        "button",
        "select",
        "textarea",
        "svg",
        "object",
        "embed",
        "header",
        "footer",
        "nav",
        "aside",
        ".comment-respond",
        ".comments-area",
        ".sharedaddy",
        ".jp-relatedposts",
        ".et_pb_code",
        ".et_pb_newsletter",
        ".et_pb_signup",
        ".et_pb_social_media_follow",
        ".et_pb_sidebar",
        ".sidebar",
        ".widget",
        ".wp-block-search",
        ".wpforms-container",
    ]
    for selector in selectors:
        for node in container.select(selector):
            node.decompose()

    for node in container.find_all(True):
        classes = set(node.get("class", []))
        element_id = node.get("id", "")
        joined = " ".join(classes) + " " + element_id
        lowered = joined.lower()
        if any(
            token in lowered
            for token in (
                "comment",
                "login",
                "signin",
                "register",
                "auth",
                "captcha",
                "search-form",
            )
        ):
            node.decompose()


def choose_content_container(soup: BeautifulSoup) -> Tag | None:
    selectors = [
        "article .entry-content",
        ".entry-content",
        ".et_pb_post_content",
        "main article",
        "article",
        "main",
        "#main-content",
        "#content-area",
        ".post-content",
        ".page-content",
    ]
    candidates: list[Tag] = []
    seen: set[int] = set()
    for selector in selectors:
        for node in soup.select(selector):
            if isinstance(node, Tag) and id(node) not in seen:
                seen.add(id(node))
                candidates.append(node)

    best: Tag | None = None
    best_score = -1
    for node in candidates:
        text_length = len(normalize_text(node.get_text(" ", strip=True)))
        paragraph_count = len(node.find_all(["p", "li"]))
        heading_count = len(node.find_all(re.compile(r"^h[1-6]$")))
        score = text_length + (paragraph_count * 80) + (heading_count * 60)
        if score > best_score:
            best = node
            best_score = score
    return best


def filename_for_url(url: str) -> str:
    parsed = urlparse(url)
    return Path(parsed.path).name


def is_allowed_image_url(url: str) -> bool:
    parsed = urlparse(url)
    if parsed.scheme not in {"http", "https"}:
        return False
    if parsed.netloc not in {"rrroca.org", "www.rrroca.org"}:
        return False
    if not parsed.path.startswith("/en/wp-content/uploads/"):
        return False
    extension = Path(parsed.path).suffix.lower()
    return extension in ALLOWED_IMAGE_EXTENSIONS


def safe_image_name(url: str, used_names: dict[str, str]) -> str:
    parsed = urlparse(url)
    filename = filename_for_url(url)
    existing = used_names.get(filename.lower())
    if not existing or existing == url:
        used_names[filename.lower()] = url
        return filename

    digest = hashlib.sha1(url.encode("utf-8")).hexdigest()[:8]
    path = Path(filename)
    renamed = f"{path.stem}-{digest}{path.suffix.lower()}"
    used_names[renamed.lower()] = url
    return renamed


def download_image(
    client: PoliteSession,
    source_url: str,
    image_cache: dict[str, str],
    used_names: dict[str, str],
) -> str | None:
    if source_url in image_cache:
        return image_cache[source_url]
    if not is_allowed_image_url(source_url):
        return None

    try:
        response = client.get(source_url, stream=True)
        response.raise_for_status()
    except Exception as exc:  # noqa: BLE001
        log(f"[warn] Failed image {source_url}: {exc}")
        return None

    length_header = response.headers.get("Content-Length")
    if length_header and length_header.isdigit() and int(length_header) > MAX_IMAGE_BYTES:
        log(f"[skip] Image too large: {source_url}")
        response.close()
        return None

    filename = safe_image_name(source_url, used_names)
    target_path = STATIC_UPLOADS_DIR / filename
    total = 0

    try:
        with target_path.open("wb") as handle:
            for chunk in response.iter_content(chunk_size=8192):
                if not chunk:
                    continue
                total += len(chunk)
                if total > MAX_IMAGE_BYTES:
                    handle.close()
                    target_path.unlink(missing_ok=True)
                    log(f"[skip] Image exceeded 5MB: {source_url}")
                    return None
                handle.write(chunk)
    finally:
        response.close()

    image_cache[source_url] = f"/images/uploads/{filename}"
    return image_cache[source_url]


def sanitize_content_html(container: Tag, page_url: str, client: PoliteSession, image_cache: dict[str, str], used_names: dict[str, str]) -> str:
    working = BeautifulSoup(str(container), "html.parser")
    root = working.find()
    if root is None:
        return ""

    remove_unwanted_nodes(root)

    for node in root.find_all(True):
        if node.name == "img":
            src = node.get("src") or node.get("data-src") or node.get("data-lazy-src")
            if not src:
                node.decompose()
                continue
            absolute_src = urljoin(page_url, src)
            local_src = download_image(client, absolute_src, image_cache, used_names)
            if local_src:
                node.attrs = {
                    "src": local_src,
                    "alt": normalize_text(node.get("alt", "")),
                    "title": normalize_text(node.get("title", "")),
                }
            else:
                node.decompose()
        elif node.name == "a":
            href = node.get("href")
            if href:
                absolute_href = urljoin(page_url, href)
                if is_allowed_image_url(absolute_href):
                    local_href = download_image(client, absolute_href, image_cache, used_names)
                    node.attrs = {"href": local_href or absolute_href}
                else:
                    node.attrs = {"href": absolute_href}
            else:
                node.attrs = {}
        else:
            node.attrs = {}

    for node in root.find_all(["span", "font"]):
        node.unwrap()

    return str(root)


def html_to_markdown(html: str, title: str) -> str:
    markdown = to_markdown(
        html,
        heading_style="ATX",
        bullets="-",
        escape_asterisks=False,
        escape_underscores=False,
        strong_em_symbol="*",
    )
    markdown = markdown.replace("\r\n", "\n").replace("\xa0", " ")
    markdown = re.sub(r"(?m)^\[(?:/?[A-Za-z0-9_-]+[^\]\n]*)\]\s*$", "", markdown)
    markdown = re.sub(r"\n{3,}", "\n\n", markdown)
    markdown = re.sub(r"[ \t]+\n", "\n", markdown)
    markdown = markdown.strip()

    normalized_title = normalize_text(title)
    title_variants = {
        normalize_text(f"# {normalized_title}"),
        normalize_text(f"## {normalized_title}"),
        normalized_title,
    }
    lines = markdown.splitlines()
    while lines and normalize_text(lines[0]) in title_variants:
        lines.pop(0)
        while lines and not lines[0].strip():
            lines.pop(0)
    return "\n".join(lines).strip()


def build_front_matter(title: str, date: str, description: str, category: str, tags: list[str]) -> str:
    safe_title = json.dumps(title, ensure_ascii=False)
    safe_description = json.dumps(description, ensure_ascii=False)
    tags_json = json.dumps(tags, ensure_ascii=False)
    categories_json = json.dumps([category], ensure_ascii=False)
    return (
        "---\n"
        f"title: {safe_title}\n"
        f'date: "{date}"\n'
        f"description: {safe_description}\n"
        f"categories: {categories_json}\n"
        f"tags: {tags_json}\n"
        "draft: false\n"
        "---\n\n"
    )


def import_page(
    target: PageTarget,
    client: PoliteSession,
    sitemap_lastmods: dict[str, str],
    image_cache: dict[str, str],
    used_names: dict[str, str],
) -> tuple[bool, str | None]:
    try:
        response = client.get(target.url)
        if response.status_code == 404:
            return False, f"404: {target.url}"
        response.raise_for_status()
    except Exception as exc:  # noqa: BLE001
        return False, f"{target.url} -> {exc}"

    soup = BeautifulSoup(response.text, "html.parser")
    strip_comments(soup)
    container = choose_content_container(soup)
    remove_unwanted_nodes(soup)

    title = extract_title(soup)
    date = extract_date(soup, sitemap_lastmods.get(target.url))
    description = normalize_text(
        (soup.select_one("meta[name='description']") or {}).get("content", "")  # type: ignore[union-attr]
    )
    if not description:
        description = first_meaningful_paragraph(container)[:200]
    tags = extract_tags(soup)

    if container is None:
        return False, f"No content container found: {target.url}"

    sanitized_html = sanitize_content_html(container, target.url, client, image_cache, used_names)
    markdown_body = html_to_markdown(sanitized_html, title)
    if not markdown_body:
        markdown_body = first_meaningful_paragraph(container)
    if not markdown_body:
        return False, f"No clean content extracted: {target.url}"

    output_path = CONTENT_DIR / Path(target.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(
        build_front_matter(title, date, description, target.category, tags) + markdown_body + "\n",
        encoding="utf-8",
    )
    return True, None


def main() -> int:
    CONTENT_DIR.mkdir(parents=True, exist_ok=True)
    STATIC_UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

    client = PoliteSession()
    sitemap_lastmods = fetch_sitemap_lastmods(client)
    image_cache: dict[str, str] = {}
    used_names: dict[str, str] = {}
    imported = 0
    errors: list[str] = []

    for target in TARGETS:
        log(f"[page] {target.url}")
        ok, error = import_page(target, client, sitemap_lastmods, image_cache, used_names)
        if ok:
            imported += 1
        elif error:
            errors.append(error)
            log(f"[warn] {error}")

    log("")
    log("Summary")
    log(f"- Pages imported: {imported}/{len(TARGETS)}")
    log(f"- Images downloaded: {len(image_cache)}")
    log(f"- Errors: {len(errors)}")
    for error in errors:
        log(f"  - {error}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
