#!/usr/bin/env python3
"""
Lukee opinnäyte-PDF:n ja tulostaa Avainsanat/Keywords-rivin sisällön.
Käyttö: python3 extract-keywords.py <pdf-tiedosto>
"""
import sys
import re

def main():
    if len(sys.argv) < 2:
        sys.exit(0)
    try:
        import pypdf
        reader = pypdf.PdfReader(sys.argv[1])
        for i in range(min(6, len(reader.pages))):
            text = reader.pages[i].extract_text() or ''
            # Etsitään Avainsanat / Keywords / Nyckelord -rivi
            m = re.search(
                r'(?:Avainsanat|Keywords|Nyckelord)\s*:?\s*(.+?)(?:\n|\r|$)',
                text,
                re.IGNORECASE
            )
            if m:
                print(m.group(1).strip())
                sys.exit(0)
    except Exception as e:
        sys.stderr.write(str(e) + '\n')

main()
