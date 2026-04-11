#!/usr/bin/env python3
"""
Lukee opinnäyte-PDF:n ja tulostaa Avainsanat/Keywords-rivin sisällön.
Käyttö: python3 extract-keywords.py <pdf-tiedosto>

Yrittää ensin pdftotext (poppler), sitten pypdf.
"""
import sys
import re
import subprocess

def find_keywords(text):
    m = re.search(
        r'(?:Avainsanat|Asiasanat|Keywords|Nyckelord)\s*:?\s*(.+?)(?:\n|\r|$)',
        text,
        re.IGNORECASE
    )
    return m.group(1).strip() if m else None

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
