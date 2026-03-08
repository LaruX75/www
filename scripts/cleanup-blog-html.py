#!/usr/bin/env python3
"""
Blog HTML-to-Markdown cleanup script.

Converts WordPress-migrated HTML in blog .md files to clean Markdown.
Skips files that have intentional custom HTML.
"""

import os
import re
import sys

BLOG_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "src", "blog")

SKIP_FILES = {
    "17.md",
    "silloin-kun-sita-oltiin-larges-securityn-sysop-bbs-muisteluita.md",
}

HTML_ENTITIES = [
    ("&amp;", "&"),
    ("&nbsp;", " "),
    ("&lt;", "<"),
    ("&gt;", ">"),
    ("&quot;", '"'),
    ("&mdash;", "—"),
    ("&ndash;", "–"),
    ("&ldquo;", "\u201c"),
    ("&rdquo;", "\u201d"),
    ("&lsquo;", "\u2018"),
    ("&rsquo;", "\u2019"),
    ("&hellip;", "…"),
    ("&thinsp;", "\u2009"),
    ("&apos;", "'"),
    ("&#8211;", "–"),
    ("&#8212;", "—"),
    ("&#8220;", "\u201c"),
    ("&#8221;", "\u201d"),
    ("&#8216;", "\u2018"),
    ("&#8217;", "\u2019"),
    ("&#8230;", "…"),
    ("&#160;", " "),
    ("&laquo;", "«"),
    ("&raquo;", "»"),
]


def unescape_html(text):
    for entity, char in HTML_ENTITIES:
        text = text.replace(entity, char)
    # Numeric character references &#NNN;
    text = re.sub(r"&#(\d+);", lambda m: chr(int(m.group(1))), text)
    return text


def strip_tags(text):
    """Remove all HTML tags from text."""
    return re.sub(r"<[^>]+>", "", text)


def handle_figure(m):
    """Convert <figure>...</figure> to Markdown."""
    inner = m.group(1).strip()

    # Figure with nested <table> — strip tags, keep text content roughly
    if "<table" in inner:
        # Try to preserve some structure by extracting cell text
        inner_stripped = re.sub(r"<t[dh][^>]*>", " ", inner)
        inner_stripped = re.sub(r"</t[dh]>", " | ", inner_stripped)
        inner_stripped = re.sub(r"<tr[^>]*>", "\n", inner_stripped)
        inner_stripped = re.sub(r"</tr>", "", inner_stripped)
        inner_stripped = strip_tags(inner_stripped)
        inner_stripped = re.sub(r" \| \s*\n", "\n", inner_stripped)
        inner_stripped = re.sub(r"\n +", "\n", inner_stripped)
        inner_stripped = inner_stripped.strip()
        caption_m = re.search(r"<figcaption[^>]*>(.*?)</figcaption>", inner, re.DOTALL)
        caption = ""
        if caption_m:
            caption = strip_tags(caption_m.group(1)).strip()
        result = inner_stripped
        if caption:
            result += f"\n*{caption}*"
        return "\n\n" + result + "\n\n" if result else ""

    # Figure with nested <ul><li> of images — extract images
    if "<ul" in inner:
        imgs = re.findall(r'<img[^>]+src="([^"]+)"[^>]*(?:alt="([^"]*)")?[^>]*/?>',
                          inner, re.DOTALL)
        lines = []
        for src, alt in imgs:
            lines.append(f"![{alt}]({src})")
        return "\n\n" + "\n\n".join(lines) + "\n\n" if lines else ""

    # Plain URL (YouTube or other)
    url_only = re.sub(r"<[^>]+>", "", inner).strip()
    if url_only and re.match(r"https?://", url_only):
        if "youtube" in url_only or "youtu.be" in url_only:
            return f"\n\n[Katso video]({url_only})\n\n"
        return f"\n\n[{url_only}]({url_only})\n\n"

    # Figure with <a><img></a>
    a_img_m = re.search(
        r'<a[^>]*href="([^"]*)"[^>]*>\s*<img[^>]*(?:src="([^"]*)")?[^>]*(?:alt="([^"]*)")?[^>]*/?>',
        inner, re.DOTALL
    )
    if a_img_m:
        href, src, alt = a_img_m.group(1), a_img_m.group(2) or "", a_img_m.group(3) or ""
        caption_m = re.search(r"<figcaption[^>]*>(.*?)</figcaption>", inner, re.DOTALL)
        if caption_m:
            alt = strip_tags(caption_m.group(1)).strip() or alt
        return f"\n\n[![{alt}]({src})]({href})\n\n"

    # Figure with just <img>
    img_m = re.search(r'<img[^>]*src="([^"]*)"[^>]*(?:alt="([^"]*)")?[^>]*/?>',
                      inner, re.DOTALL)
    if img_m:
        src = img_m.group(1)
        alt = img_m.group(2) or ""
        # Skip Facebook emoji images
        if "emoji.php" in src or "fbcdn.net" in src:
            return ""
        caption_m = re.search(r"<figcaption[^>]*>(.*?)</figcaption>", inner, re.DOTALL)
        if caption_m:
            alt = strip_tags(caption_m.group(1)).strip() or alt
        return f"\n\n![{alt}]({src})\n\n"

    # Fallback: strip tags
    text = strip_tags(inner).strip()
    return f"\n\n{text}\n\n" if text else ""


def handle_blockquote(m):
    """Convert <blockquote>...</blockquote> to Markdown > quote."""
    inner = m.group(1)

    # Extract <cite>
    cite_m = re.search(r"<cite[^>]*>(.*?)</cite>", inner, re.DOTALL)
    cite_text = ""
    if cite_m:
        cite_text = unescape_html(strip_tags(cite_m.group(1))).strip()
        inner = inner[: cite_m.start()] + inner[cite_m.end() :]

    # Remove <p> tags (just the tags, keep text)
    inner = re.sub(r"<p[^>]*>", "", inner)
    inner = re.sub(r"</p>", "\n", inner)
    # Remove <br>
    inner = re.sub(r"<br\s*/?>", "\n", inner)
    # Strip remaining tags
    inner = strip_tags(inner)
    inner = unescape_html(inner).strip()

    lines = inner.split("\n")
    result_lines = []
    for line in lines:
        stripped = line.rstrip()
        if stripped:
            result_lines.append(f"> {stripped}")
        else:
            if result_lines and result_lines[-1] != ">":
                result_lines.append(">")

    if cite_text:
        result_lines.append(f">\n> — {cite_text}")

    # Remove trailing bare ">"
    while result_lines and result_lines[-1] == ">":
        result_lines.pop()

    return "\n\n" + "\n".join(result_lines) + "\n\n" if result_lines else ""


def handle_list_ul(m):
    inner = m.group(1)
    items = re.findall(r"<li[^>]*>(.*?)</li>", inner, re.DOTALL)
    lines = []
    for item in items:
        # strip_tags after inline conversion already happened
        item_clean = strip_tags(item).strip()
        item_clean = re.sub(r"\n+", " ", item_clean)
        if item_clean:
            lines.append(f"- {item_clean}")
    return "\n" + "\n".join(lines) + "\n\n" if lines else ""


def handle_list_ol(m):
    inner = m.group(1)
    items = re.findall(r"<li[^>]*>(.*?)</li>", inner, re.DOTALL)
    lines = []
    for i, item in enumerate(items, 1):
        item_clean = strip_tags(item).strip()
        item_clean = re.sub(r"\n+", " ", item_clean)
        if item_clean:
            lines.append(f"{i}. {item_clean}")
    return "\n" + "\n".join(lines) + "\n\n" if lines else ""


def html_to_markdown(content):
    # 1. Remove HTML comments
    content = re.sub(r"<!--.*?-->", "", content, flags=re.DOTALL)

    # 2. Remove WP smiley images and Facebook emoji imgs
    content = re.sub(r'<img[^>]*(?:smilies|fidisk|emoji\.php|fbcdn\.net)[^>]*/?>', "", content)

    # 3. Decode HTML entities early (so URLs are clean)
    content = unescape_html(content)

    # 4. Handle <figure> blocks
    content = re.sub(r"<figure[^>]*>(.*?)</figure>", handle_figure, content, flags=re.DOTALL)

    # 5. Headings (strip inner tags)
    for level in range(1, 7):
        tag = f"h{level}"
        prefix = "#" * level

        def replace_heading(m, p=prefix):
            inner = strip_tags(m.group(1)).strip()
            inner = unescape_html(inner)
            inner = re.sub(r"\s+", " ", inner)
            return f"\n{p} {inner}\n\n"

        content = re.sub(fr"<{tag}[^>]*>(.*?)</{tag}>", replace_heading, content, flags=re.DOTALL)

    # 6. Inline elements (order: strong before em so nested **_text_** works)
    content = re.sub(r"<strong[^>]*>(.*?)</strong>", r"**\1**", content, flags=re.DOTALL)
    content = re.sub(r"<b[^>]*>(.*?)</b>", r"**\1**", content, flags=re.DOTALL)
    content = re.sub(r"<em[^>]*>(.*?)</em>", r"*\1*", content, flags=re.DOTALL)
    content = re.sub(r"<i[^>]*>(.*?)</i>", r"*\1*", content, flags=re.DOTALL)

    # Links (double-quoted href) — strip whitespace/newlines from link text
    def make_link(m):
        href = m.group(1)
        text = re.sub(r"\s+", " ", m.group(2)).strip()
        return f"[{text}]({href})"

    content = re.sub(r'<a[^>]*href="([^"]*)"[^>]*>(.*?)</a>', make_link, content, flags=re.DOTALL)
    content = re.sub(r"<a[^>]*href='([^']*)'[^>]*>(.*?)</a>", make_link, content, flags=re.DOTALL)

    # 7. Blockquotes
    content = re.sub(r"<blockquote[^>]*>(.*?)</blockquote>", handle_blockquote, content, flags=re.DOTALL)

    # 8. Lists (nested lists: process inner lists first by repeating)
    for _ in range(3):
        content = re.sub(r"<ul[^>]*>(.*?)</ul>", handle_list_ul, content, flags=re.DOTALL)
        content = re.sub(r"<ol[^>]*>(.*?)</ol>", handle_list_ol, content, flags=re.DOTALL)

    # 9. Remaining <img> tags
    def replace_img(m):
        tag = m.group(0)
        src_m = re.search(r'src="([^"]*)"', tag)
        alt_m = re.search(r'alt="([^"]*)"', tag)
        if not src_m:
            return ""
        src = src_m.group(1)
        alt = alt_m.group(1) if alt_m else ""
        # Skip emoji / smiley images
        if any(x in src for x in ("emoji.php", "fbcdn.net", "smilies", "fidisk")):
            return ""
        return f"![{alt}]({src})"

    content = re.sub(r"<img[^>]*/?>", replace_img, content)

    # 10. Paragraphs
    content = re.sub(
        r"<p[^>]*>(.*?)</p>",
        lambda m: m.group(1).strip() + "\n\n",
        content,
        flags=re.DOTALL,
    )

    # 11. <br> tags
    content = re.sub(r"<br\s*/?>", "\n", content)

    # 12. Remove all remaining HTML tags
    content = re.sub(r"<[^>]+>", "", content)

    # 13. Fix non-breaking spaces and thin spaces
    content = content.replace("\u00a0", " ")
    content = content.replace("\u2009", " ")

    # 14. Fix multiple consecutive blank lines → max 2
    content = re.sub(r"\n{3,}", "\n\n", content)

    # 15. Strip trailing whitespace from each line
    lines = [line.rstrip() for line in content.split("\n")]
    content = "\n".join(lines)

    return content.strip()


def split_frontmatter(raw):
    """Split raw file content into (frontmatter, body)."""
    if not raw.startswith("---"):
        return "", raw
    end = raw.find("---", 3)
    if end == -1:
        return raw, ""
    frontmatter = raw[: end + 3]
    body = raw[end + 3 :]
    return frontmatter, body


def process_file(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        raw = f.read()

    frontmatter, body = split_frontmatter(raw)

    # Skip files that don't have any HTML to clean
    if not re.search(r"<[a-zA-Z][^>]*>", body):
        return raw  # no changes needed

    new_body = html_to_markdown(body)
    if new_body:
        return frontmatter + "\n\n" + new_body + "\n"
    else:
        return frontmatter + "\n"


def main():
    dry_run = "--dry-run" in sys.argv
    verbose = "--verbose" in sys.argv or "-v" in sys.argv

    files_processed = 0
    files_changed = 0

    for filename in sorted(os.listdir(BLOG_DIR)):
        if not filename.endswith(".md"):
            continue
        if filename in SKIP_FILES:
            if verbose:
                print(f"  SKIP:    {filename}")
            continue

        filepath = os.path.join(BLOG_DIR, filename)

        with open(filepath, "r", encoding="utf-8") as f:
            original = f.read()

        try:
            result = process_file(filepath)
        except Exception as e:
            print(f"  ERROR:   {filename}: {e}")
            import traceback
            traceback.print_exc()
            continue

        files_processed += 1

        if result != original:
            if not dry_run:
                with open(filepath, "w", encoding="utf-8") as f:
                    f.write(result)
            print(f"  CHANGED: {filename}")
            files_changed += 1
        elif verbose:
            print(f"  OK:      {filename}")

    mode = " (DRY RUN)" if dry_run else ""
    print(f"\n{mode}Processed {files_processed} files, changed {files_changed}.")


if __name__ == "__main__":
    main()
