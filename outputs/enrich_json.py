#!/usr/bin/env python3
"""
Parses outputs/canva-esitysten-analyysi.md (summary table + deep sections)
and enriches src/_data/canva-presentations.json.

Strategy:
  1. Parse summary table (rows 7-81) → full metadata for all 75 entries,
     keyed by canva_link (matches JSON exactly).
  2. Parse deep analysis sections → jarjestaja + paikkakunta (keyed by
     canva_link; fall back to title-prefix match for the ~14 where agent
     used a different link).
  3. Merge and write updated JSON.

Fields updated:
  summary              ← seo_kuvaus  (from table col 8)
  location             ← paikkakunta  (from deep section, if useful)
  keywords             ← merged with table avainsanat
  jarjestaja           (new, from deep section)
  kategoria            (new, from table col 7)
  paakortti            (new bool, from table col 9)
  asiantuntijaprofiili (new list, from table col 10)
  sivuyhteys           (new list, from table col 11)
"""

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent
ANALYSIS = ROOT / "outputs" / "canva-esitysten-analyysi.md"
DATAFILE = ROOT / "src" / "_data" / "canva-presentations.json"

NON_INFORMATIVE_PLACE = {
    "", "ei tiedossa", "ei tiedossa dioilta", "ei mainittu dioilla",
    "webinaari (verkossa)", "webinaari", "verkossa",
}


def normalize_link(link: str) -> str:
    return link.strip().rstrip("/").lower()


# ---------------------------------------------------------------------------
# 1. Parse summary table
# ---------------------------------------------------------------------------
def parse_summary_table(text: str) -> dict:
    """Return dict keyed by normalised canva_link → metadata dict."""
    result = {}
    for line in text.splitlines():
        line = line.strip()
        if not line.startswith("|") or "canva" not in line.lower():
            continue
        parts = [p.strip() for p in line.split("|")]
        # Expected columns (0-indexed after split by |):
        # 0='' 1=# 2=title 3=date 4=link 5=kohdeyleisö 6=avainsanat
        # 7=kategoria 8=seo_kuvaus 9=paakortti 10=asiantuntijaprofiili 11=sivuyhteys 12=''
        if len(parts) < 12:
            continue
        try:
            link = parts[4].strip()
            if not link.startswith("http"):
                continue
            avainsanat_raw = parts[6]
            asiantuntija_raw = parts[10]
            sivuyhteys_raw = parts[11]
            result[normalize_link(link)] = {
                "title": parts[2].strip(),
                "kategoria": parts[7].strip(),
                "seo_kuvaus": parts[8].strip(),
                "paakortti": parts[9].strip().lower() == "kyllä",
                "avainsanat": [k.strip() for k in avainsanat_raw.split(",") if k.strip()],
                "asiantuntijaprofiili": [a.strip() for a in asiantuntija_raw.split(",") if a.strip()],
                "sivuyhteys": [s.strip() for s in sivuyhteys_raw.split(",") if s.strip() and s.strip() != "-"],
            }
        except (IndexError, ValueError):
            continue
    return result


# ---------------------------------------------------------------------------
# 2. Parse deep analysis sections (### headers)
# ---------------------------------------------------------------------------
def parse_deep_sections(text: str) -> dict:
    """
    Return two lookups for jarjestaja+paikkakunta:
      by_link  : normalize_link(canva_link) → {jarjestaja, paikkakunta}
      by_title : lower(title_prefix)        → {jarjestaja, paikkakunta}
    """
    sections = re.split(r"\n(?=### )", text)
    by_link = {}
    by_title = {}

    for sec in sections:
        if "**canva_link**" not in sec:
            continue
        m = re.match(r"### (.+)", sec)
        title = m.group(1).strip() if m else ""

        def field(name):
            pat = rf"\*\*{name}\*\*:\s*(.+)"
            m2 = re.search(pat, sec)
            return m2.group(1).strip() if m2 else ""

        link = normalize_link(field("canva_link"))
        jarjestaja = field("jarjestaja")
        paikkakunta = field("paikkakunta")
        data = {"jarjestaja": jarjestaja, "paikkakunta": paikkakunta}

        if link:
            by_link[link] = data
        if title:
            # Store by first ~30 chars lowercase for fuzzy fallback
            by_title[title.lower()[:40]] = data

    return by_link, by_title


# ---------------------------------------------------------------------------
# 3. Title-prefix fallback matching
# ---------------------------------------------------------------------------
def find_deep_by_title(json_title: str, by_title: dict):
    """
    Try to find a deep section entry whose title prefix matches json_title.
    Uses longest-common-prefix heuristic.
    """
    jt = json_title.lower()
    best_key = None
    best_len = 0
    for key in by_title:
        # Check if json title starts with the key or key starts with json title
        common = min(len(key), len(jt))
        if jt[:common] == key[:common] and common > best_len:
            best_len = common
            best_key = key
    return by_title.get(best_key) if best_len >= 10 else None


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    analysis_text = ANALYSIS.read_text(encoding="utf-8")

    table_data = parse_summary_table(analysis_text)
    print(f"Summary table entries: {len(table_data)}")

    deep_by_link, deep_by_title = parse_deep_sections(analysis_text)
    print(f"Deep sections: {len(deep_by_link)} by link, {len(deep_by_title)} by title")

    presentations = json.loads(DATAFILE.read_text(encoding="utf-8"))
    print(f"JSON entries: {len(presentations)}")

    matched_table = 0
    matched_deep_link = 0
    matched_deep_title = 0
    unmatched_table = []

    for pres in presentations:
        link = normalize_link(pres.get("link", ""))
        title = pres.get("title", "")

        # --- Summary table lookup (always by link) ---
        table = table_data.get(link)
        if table:
            matched_table += 1
            pres["summary"] = table["seo_kuvaus"]
            if table["kategoria"]:
                pres["kategoria"] = table["kategoria"]
            pres["paakortti"] = table["paakortti"]
            if table["asiantuntijaprofiili"]:
                pres["asiantuntijaprofiili"] = table["asiantuntijaprofiili"]
            if table["sivuyhteys"]:
                pres["sivuyhteys"] = table["sivuyhteys"]
            # Merge keywords
            existing = set(pres.get("keywords", []))
            for kw in table["avainsanat"]:
                existing.add(kw)
            pres["keywords"] = sorted(existing)
        else:
            unmatched_table.append(title)

        # --- Deep section lookup for jarjestaja + paikkakunta ---
        deep = deep_by_link.get(link)
        if deep:
            matched_deep_link += 1
        else:
            deep = find_deep_by_title(title, deep_by_title)
            if deep:
                matched_deep_title += 1

        if deep:
            if deep.get("jarjestaja"):
                pres["jarjestaja"] = deep["jarjestaja"]
            paikkakunta = deep.get("paikkakunta", "")
            place_lower = paikkakunta.lower().strip()
            if paikkakunta and place_lower not in NON_INFORMATIVE_PLACE:
                # Only fill location if currently empty
                if not pres.get("location"):
                    pres["location"] = paikkakunta

    print(f"\nTable matches: {matched_table}/75")
    print(f"Deep matches by link: {matched_deep_link}")
    print(f"Deep matches by title: {matched_deep_title}")
    if unmatched_table:
        print(f"\nUnmatched in table ({len(unmatched_table)}):")
        for t in unmatched_table:
            print(f"  - {t}")

    DATAFILE.write_text(
        json.dumps(presentations, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8"
    )
    print(f"\nWritten: {DATAFILE}")

    paakortti_list = [p.get("title", "?") for p in presentations if p.get("paakortti")]
    print(f"\nPääkortteja ({len(paakortti_list)}):")
    for t in paakortti_list:
        print(f"  ✓ {t}")


if __name__ == "__main__":
    main()
