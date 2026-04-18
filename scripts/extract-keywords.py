#!/usr/bin/env python3
"""
Lukee opinnäyte-PDF:n ja tulostaa Avainsanat/Keywords-rivin sisällön.
Käyttö: python3 extract-keywords.py <pdf-tiedosto>

Yrittää ensin pdftotext (poppler), sitten pypdf.
"""
import sys
import re
import subprocess

def collect_keyword_lines(text, start_pos):
    """Collect keyword lines starting at start_pos.
    A continuation line must contain a comma (looks like a keyword list),
    must not be a known section header, and must be short enough.
    """
    STOP_WORDS = re.compile(
        r'^\s*(?:Tiivistelmä|Abstract|Sisältö|Contents|Johdanto|Introduction|'
        r'Acknowledgements?|Kiitokset|Table of|1\s|2\s|\d+\s+\w)',
        re.IGNORECASE
    )
    lines = text[start_pos:].split('\n')
    result = []
    for line in lines:
        stripped = line.strip()
        if not stripped:
            if result:  # blank line after content = stop
                break
            continue
        if STOP_WORDS.match(stripped):
            break
        result.append(stripped)
        # Stop after two content lines to avoid runaway
        if len(result) >= 2:
            break
    return ' '.join(result)


def find_keywords(text):
    # Strategy 1: label at line start, optional colon, keywords on same line
    # e.g. "Avainsanat: tunnetaidot, ..." or "Asiasanat 21st century skills, ..."
    m = re.search(
        r'(?m)^[ \t]*(?:Avainsanat|Asiasanat|Keywords|Nyckelord)[ \t]*:?[ \t]+(.+)',
        text,
        re.IGNORECASE
    )
    if m:
        kw = m.group(1).strip()
        # If the line ends without comma, the list may wrap to the next line
        if not kw.endswith(','):
            after = text[m.end():]
            lines_after = [l.strip() for l in after.split('\n') if l.strip()]
            if lines_after and ',' in lines_after[0]:
                kw = kw + ' ' + lines_after[0]
        return kw

    # Strategy 2: label alone on a line, keywords on the next non-empty line
    # e.g. "Keywords\n\nSocial media, networked learning, ..."
    m = re.search(
        r'(?m)^[ \t]*(?:Avainsanat|Asiasanat|Keywords|Nyckelord)[ \t]*:?[ \t]*$',
        text,
        re.IGNORECASE
    )
    if m:
        kw = collect_keyword_lines(text, m.end())
        if kw:
            return kw

    return None

def extract_with_pdftotext(pdf_path):
    try:
        # -l 6 = vain 6 ensimmäistä sivua, nopea
        result = subprocess.run(
            ['pdftotext', '-l', '6', pdf_path, '-'],
            capture_output=True, text=True, timeout=20
        )
        return result.stdout if result.returncode == 0 else None
    except Exception:
        return None

def extract_with_pypdf(pdf_path):
    try:
        import pypdf
        reader = pypdf.PdfReader(pdf_path)
        pages = []
        for i in range(min(6, len(reader.pages))):
            pages.append(reader.pages[i].extract_text() or '')
        return '\n'.join(pages)
    except Exception:
        return None

def main():
    if len(sys.argv) < 2:
        sys.exit(0)
    pdf_path = sys.argv[1]

    text = extract_with_pdftotext(pdf_path) or extract_with_pypdf(pdf_path)
    if not text:
        sys.exit(0)

    kw = find_keywords(text)
    if kw:
        print(kw)

main()
