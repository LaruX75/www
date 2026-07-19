#!/bin/bash
#SBATCH --partition=normal
#SBATCH --gres=gpu:a30:1
#SBATCH --mem=24G
#SBATCH --cpus-per-task=4
#SBATCH --time=08:00:00
#SBATCH --job-name=council-whisper-times
#SBATCH --output=council-whisper-times-%j.out

set -euo pipefail

# Copy the site repository to Lehmus first, then set REPO_DIR to that path.
REPO_DIR="${REPO_DIR:-$HOME/jarilaru-eleventy-final-v2}"
MODEL="${MODEL:-large}"

echo "Repository: $REPO_DIR"
echo "Whisper model: $MODEL"

cd "$REPO_DIR"

echo "Load Whisper"
module load whisper

if command -v yt-dlp >/dev/null 2>&1; then
  echo "yt-dlp: $(yt-dlp --version)"
else
  echo "ERROR: yt-dlp command was not found. Install/load yt-dlp or predownload the audio files." >&2
  exit 1
fi

echo "Start council speech timestamp search"
python scripts/find_council_speech_video_times_with_whisper.py \
  --model "$MODEL" \
  --whisper-arg=--device \
  --whisper-arg=cuda \
  --whisper-arg=--fp16 \
  --whisper-arg=True

echo "Done"
echo "Report: $REPO_DIR/reports/council-speech-video-whisper-candidates.json"
