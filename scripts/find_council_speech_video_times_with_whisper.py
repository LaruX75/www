#!/usr/bin/env python3
"""Find council speech timestamps from YouTube videos using a local Whisper CLI.

This is the Lehmus-friendly version of the Node.js helper. It only needs Python,
yt-dlp and the `whisper` command provided by `module load whisper`.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
import unicodedata
from dataclasses import dataclass
from pathlib import Path
from typing import Any


ROOT = Path.cwd()
PUBLICATIONS_DIR = ROOT / "src" / "publications"
VIDEO_DATA_PATH = ROOT / "src" / "_data" / "councilSpeechVideos.json"
CACHE_DIR = ROOT / ".cache" / "council-youtube" / "whisper"
AUDIO_DIR = CACHE_DIR / "audio"
TRANSCRIPT_DIR = CACHE_DIR / "transcripts"
REPORT_PATH = ROOT / "reports" / "council-speech-video-whisper-candidates.json"


STOP_WORDS = {
    "arvoisa",
    "puheenjohtaja",
    "hyvat",
    "hyvät",
    "valtuutetut",
    "kiitos",
    "oulun",
    "kaupungin",
    "kaupunginvaltuusto",
    "puheenvuoro",
    "kohdassa",
    "kasitteli",
    "käsitteli",
    "tassa",
    "tässä",
    "etta",
    "että",
    "joka",
    "joita",
    "tulee",
    "pitää",
    "pitaa",
    "myos",
    "myös",
    "ovat",
    "olla",
    "olen",
    "asia",
    "asiassa",
    "kysyin",
    "kysymys",
    "esitin",
    "koski",
    "keskustelussa",
}


@dataclass
class Speech:
    file: str
    permalink: str
    title: str
    date: str
    description: str
    event: str
    body: str

    @property
    def text(self) -> str:
        return f"{self.title} {self.description} {self.event} {strip_to_text(self.body)}"


@dataclass
class Target:
    url: str
    speech: Speech
    entry: dict[str, Any]


def run(command: list[str], *, check: bool = True) -> subprocess.CompletedProcess[str]:
    print("$ " + " ".join(command), flush=True)
    return subprocess.run(command, cwd=ROOT, text=True, check=check)


def read_json(path: Path, fallback: Any = None) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        return fallback


def write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def parse_frontmatter(raw: str) -> tuple[dict[str, str], str]:
    match = re.match(r"^---\n([\s\S]*?)\n---", raw)
    if not match:
        return {}, raw

    frontmatter = match.group(1)
    body = raw[match.end() :]
    data: dict[str, str] = {}
    for line in frontmatter.splitlines():
        key_match = re.match(r"^([A-Za-z0-9_-]+):\s*['\"]?([^'\"]*)['\"]?\s*$", line)
        if key_match:
            data[key_match.group(1)] = key_match.group(2).strip()
    return data, body


def to_permalink(file_name: str, date: str) -> str:
    if not re.match(r"^\d{4}-\d{2}-\d{2}$", date or ""):
        return ""
    slug = re.sub(r"\.md$", "", file_name)
    slug = re.sub(r"^\d{4}-\d{2}-\d{2}-", "", slug)
    return f"/{date[0:4]}/{date[5:7]}/{date[8:10]}/{slug}/"


def strip_to_text(value: str) -> str:
    text = re.sub(r"^---[\s\S]*?---", " ", value)
    text = re.sub(r"```[\s\S]*?```", " ", text)
    text = re.sub(r"<script[\s\S]*?</script>", " ", text, flags=re.I)
    text = re.sub(r"<style[\s\S]*?</style>", " ", text, flags=re.I)
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"https?://\S+", " ", text)
    text = re.sub(r"[#*_>`()[\]{}|]", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def normalize_text(value: str) -> str:
    text = strip_to_text(value).lower()
    text = "".join(
        char for char in unicodedata.normalize("NFD", text)
        if unicodedata.category(char) != "Mn"
    )
    text = re.sub(r"[^a-z0-9åäö\s-]", " ", text, flags=re.I)
    return re.sub(r"\s+", " ", text).strip()


def important_terms(text: str, limit: int = 240) -> list[str]:
    words = normalize_text(text).split()
    return [word for word in words if len(word) >= 5 and word not in STOP_WORDS][:limit]


def extract_anchor_phrases(text: str) -> list[str]:
    phrases = re.split(r"(?<=[.!?])\s+|\n+", strip_to_text(text))
    normalized = [normalize_text(phrase) for phrase in phrases]
    return [phrase for phrase in normalized if 28 <= len(phrase) <= 180][:30]


def load_speeches() -> dict[str, Speech]:
    speeches: dict[str, Speech] = {}
    for path in sorted(PUBLICATIONS_DIR.glob("*.md")):
        raw = path.read_text(encoding="utf-8")
        data, body = parse_frontmatter(raw)
        permalink = to_permalink(path.name, data.get("date", ""))
        if not permalink:
            continue
        speeches[permalink] = Speech(
            file=str(path.relative_to(ROOT)),
            permalink=permalink,
            title=data.get("title", ""),
            date=data.get("date", ""),
            description=data.get("description", ""),
            event=data.get("event", ""),
            body=body,
        )
    return speeches


def load_targets(args: argparse.Namespace) -> list[Target]:
    data = read_json(VIDEO_DATA_PATH, {"byUrl": {}})
    speeches = load_speeches()
    targets: list[Target] = []
    only_urls = set(args.url or [])
    only_ids = set(args.youtube_id or [])

    for url, entries in data.get("byUrl", {}).items():
        if only_urls and url not in only_urls:
            continue
        speech = speeches.get(url)
        if not speech or not isinstance(entries, list):
            continue
        for entry in entries:
            youtube_id = entry.get("youtubeId")
            if not youtube_id:
                continue
            if entry.get("start") and not args.all:
                continue
            if only_ids and youtube_id not in only_ids:
                continue
            targets.append(Target(url=url, speech=speech, entry=entry))

    unique: list[Target] = []
    seen: set[tuple[str, str]] = set()
    for target in targets:
        key = (target.url, target.entry["youtubeId"])
        if key in seen:
            continue
        seen.add(key)
        unique.append(target)

    return unique[: args.limit] if args.limit else unique


def audio_path(video_id: str) -> Path:
    return AUDIO_DIR / f"{video_id}.wav"


def transcript_path(video_id: str) -> Path:
    return TRANSCRIPT_DIR / f"{video_id}.json"


def download_audio(video_id: str, force: bool) -> Path:
    AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    final_path = audio_path(video_id)
    if final_path.exists() and not force:
        return final_path

    run([
        "yt-dlp",
        "-f",
        "ba",
        "-x",
        "--audio-format",
        "wav",
        "--audio-quality",
        "0",
        "-o",
        str(AUDIO_DIR / f"{video_id}.%(ext)s"),
        f"https://www.youtube.com/watch?v={video_id}",
    ])

    if not final_path.exists():
        raise RuntimeError(f"Audio download did not create {final_path}")
    return final_path


def transcribe(video_id: str, file_path: Path, args: argparse.Namespace) -> Path:
    TRANSCRIPT_DIR.mkdir(parents=True, exist_ok=True)
    final_path = transcript_path(video_id)
    if final_path.exists() and not args.force_transcript:
        return final_path

    command = [
        args.whisper_bin,
        str(file_path),
        "--language",
        "Finnish",
        "--task",
        "transcribe",
        "--model",
        args.model,
        "--output_format",
        "json",
        "--output_dir",
        str(TRANSCRIPT_DIR),
        "--verbose",
        "False",
    ]
    command.extend(args.whisper_arg or [])
    run(command)

    generated = TRANSCRIPT_DIR / f"{file_path.stem}.json"
    if generated != final_path and generated.exists():
        generated.rename(final_path)
    if not final_path.exists():
        raise RuntimeError(f"Whisper did not create {final_path}")
    return final_path


def transcript_rows(path: Path) -> list[dict[str, Any]]:
    data = read_json(path, {})
    rows = []
    for segment in data.get("segments", []):
        text = str(segment.get("text", "")).strip()
        if text:
            rows.append({
                "start": float(segment.get("start", 0)),
                "end": float(segment.get("end", segment.get("start", 0))),
                "text": text,
            })
    return rows


def score_window(speech: Speech, rows: list[dict[str, Any]], start_index: int, window_seconds: int) -> dict[str, Any]:
    speech_terms = set(important_terms(speech.text))
    anchors = extract_anchor_phrases(speech.body)
    start = rows[start_index]["start"]
    window_rows = [row for row in rows[start_index:] if row["start"] - start <= window_seconds]
    window_text = " ".join(row["text"] for row in window_rows)
    normalized = normalize_text(window_text)
    window_terms = set(important_terms(window_text))
    overlap = sum(1 for term in speech_terms if term in window_terms)
    speaker_boost = 20 if re.search(r"jari\s+laru|valtuutettu\s+laru|laru\s+ole\s+hyvä|laru\s+olkaa\s+hyvä", window_text, re.I) else 0
    anchor_hits = 0

    for anchor in anchors:
        anchor_terms = important_terms(anchor)
        if not anchor_terms:
            continue
        hits = sum(1 for term in anchor_terms if term in window_terms)
        if hits >= min(4, max(1, round(len(anchor_terms) * 0.45))):
            anchor_hits += 1

    exactish_boost = 25 if any(anchor and anchor[:35] in normalized for anchor in anchors) else 0

    return {
        "score": overlap + anchor_hits * 12 + speaker_boost + exactish_boost,
        "overlap": overlap,
        "anchorHits": anchor_hits,
        "speakerBoost": speaker_boost,
        "exactishBoost": exactish_boost,
        "preview": re.sub(r"\s+", " ", window_text)[:700],
    }


def find_candidates(speech: Speech, rows: list[dict[str, Any]], window_seconds: int) -> list[dict[str, Any]]:
    candidates = []
    for index, row in enumerate(rows):
        scored = score_window(speech, rows, index, window_seconds)
        if scored["score"] <= 0:
            continue
        candidates.append({
            "start": max(0, round(row["start"])),
            "end": max(0, round(row["end"])),
            **scored,
        })
    candidates.sort(key=lambda item: (-item["score"], item["start"]))
    return candidates[:12]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Find council speech YouTube timestamps with Whisper.")
    parser.add_argument("--model", default="large")
    parser.add_argument("--whisper-bin", default="whisper")
    parser.add_argument("--whisper-arg", action="append", default=[])
    parser.add_argument("--list-targets", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--all", action="store_true")
    parser.add_argument("--url", action="append")
    parser.add_argument("--youtube-id", action="append")
    parser.add_argument("--limit", type=int, default=0)
    parser.add_argument("--window-seconds", type=int, default=90)
    parser.add_argument("--force-audio", action="store_true")
    parser.add_argument("--force-transcript", action="store_true")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    targets = load_targets(args)

    if not targets:
        print("No targets found. Use --all, --url, or check missing start fields in councilSpeechVideos.json.")
        return 0

    if args.list_targets or args.dry_run:
        print(json.dumps({
            "targetCount": len(targets),
            "targets": [
                {
                    "title": target.speech.title,
                    "file": target.speech.file,
                    "url": target.url,
                    "youtubeId": target.entry["youtubeId"],
                    "youtubeUrl": f"https://www.youtube.com/watch?v={target.entry['youtubeId']}",
                    "label": target.entry.get("label", ""),
                }
                for target in targets
            ],
        }, ensure_ascii=False, indent=2))
        return 0

    report_rows = []
    for index, target in enumerate(targets, start=1):
        youtube_id = target.entry["youtubeId"]
        print(f"\n[{index}/{len(targets)}] {target.speech.title}", flush=True)
        print(f"Video: https://www.youtube.com/watch?v={youtube_id}", flush=True)
        audio = download_audio(youtube_id, args.force_audio)
        transcript = transcribe(youtube_id, audio, args)
        rows = transcript_rows(transcript)
        candidates = find_candidates(target.speech, rows, args.window_seconds)
        report_rows.append({
            "title": target.speech.title,
            "file": target.speech.file,
            "url": target.url,
            "youtubeId": youtube_id,
            "youtubeUrl": f"https://www.youtube.com/watch?v={youtube_id}",
            "audio": str(audio.relative_to(ROOT)),
            "transcript": str(transcript.relative_to(ROOT)),
            "segmentCount": len(rows),
            "bestStart": candidates[0]["start"] if candidates else None,
            "bestUrl": f"https://www.youtube.com/watch?v={youtube_id}&t={candidates[0]['start']}s" if candidates else "",
            "candidates": [
                {
                    **candidate,
                    "url": f"https://www.youtube.com/watch?v={youtube_id}&t={candidate['start']}s",
                }
                for candidate in candidates
            ],
        })

    report = {
        "generatedAt": __import__("datetime").datetime.now(__import__("datetime").timezone.utc).isoformat(),
        "engine": "openai-whisper-cli",
        "whisperBin": args.whisper_bin,
        "model": args.model,
        "windowSeconds": args.window_seconds,
        "targetCount": len(report_rows),
        "rows": report_rows,
    }
    write_json(REPORT_PATH, report)
    print(f"\nReport written to {REPORT_PATH.relative_to(ROOT)}", flush=True)
    print(json.dumps({
        "targetCount": len(report_rows),
        "reportPath": str(REPORT_PATH.relative_to(ROOT)),
        "best": [
            {
                "title": row["title"],
                "bestStart": row["bestStart"],
                "bestUrl": row["bestUrl"],
                "score": row["candidates"][0]["score"] if row["candidates"] else 0,
                "preview": row["candidates"][0]["preview"] if row["candidates"] else "",
            }
            for row in report_rows
        ],
    }, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
