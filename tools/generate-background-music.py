"""Compose original, seamless instrumental backgrounds for Viet Phuc Remix.

Requires Python 3.10+, numpy, scipy and ffmpeg (PATH, FFMPEG_BINARY, or
`pip install imageio-ffmpeg`). Run from any directory; outputs go to public/audio.
No samples, external songs, voices or generative-music services are used.
"""

from __future__ import annotations

import argparse
import json
import math
import os
from pathlib import Path
import shutil
import subprocess
import tempfile

import numpy as np
from scipy import signal
from scipy.io import wavfile

SAMPLE_RATE = 44100
OUTPUT = Path(__file__).resolve().parents[1] / "ai-studio-app" / "public" / "audio"

# These are newly composed atmospheric pieces, not reproductions of folk music.
# Each tuple is: filename, tempo, base MIDI pitch, pentatonic scale, lead,
# motif (scale-degree indices; None is a rest), ambience and deterministic seed.
TRACKS = [
    ("overview", 72, 48, [0, 2, 4, 7, 9], "flute", [4, 6, 7, None, 6, 4, 2, None], "open", 401),
    ("bac-bo", 76, 50, [0, 2, 5, 7, 9], "silk", [4, 5, 7, 6, 4, None, 2, 4], "water", 402),
    ("tay-bac", 80, 48, [0, 3, 5, 7, 10], "flute", [4, 7, 6, None, 5, 4, 2, None], "mountain", 403),
    ("hue-trung-bo", 68, 50, [0, 2, 5, 7, 9], "silk", [7, None, 6, 4, 5, None, 2, 4], "court", 404),
    ("tay-nguyen", 80, 45, [0, 3, 5, 7, 10], "wood", [4, 4, 6, None, 7, 6, 4, 2], "forest", 405),
    ("nam-bo", 76, 48, [0, 2, 4, 7, 9], "silk", [2, 4, 5, 7, 6, None, 4, 2], "river", 406),
    ("thu-do", 66, 48, [0, 2, 4, 7, 9], "piano", [4, None, 7, None, 6, None, 4, None], "rest", 407),
    ("trang-chu", 76, 48, [0, 2, 4, 7, 9], "piano", [4, 6, 7, None, 9, 7, 6, 4], "warm", 408),
    ("kham-pha", 84, 50, [0, 2, 4, 7, 9], "wood", [4, 6, 7, 6, 9, 7, 4, 2], "walk", 409),
    ("huong-dan", 66, 48, [0, 2, 5, 7, 9], "piano", [4, None, None, 6, 5, None, None, 2], "quiet", 410),
    ("gioi-thieu", 70, 48, [0, 2, 4, 7, 9], "flute", [7, None, 6, 4, 5, None, 4, 2], "elegant", 411),
]


def frequency(midi: float) -> float:
    return 440.0 * 2.0 ** ((midi - 69.0) / 12.0)


def degree_pitch(base: int, scale: list[int], degree: int) -> int:
    octave, index = divmod(degree, len(scale))
    return base + 12 * octave + scale[index]


def tone(kind: str, pitch: int, duration: float, rng: np.random.Generator) -> np.ndarray:
    """Soft acoustic-like timbres, with naturally decaying upper harmonics."""
    t = np.arange(round(duration * SAMPLE_RATE), dtype=np.float64) / SAMPLE_RATE
    f = frequency(pitch)
    if kind == "pad":
        wave = (
            np.sin(2 * np.pi * f * t)
            + 0.28 * np.sin(2 * np.pi * f * 1.0017 * t + 0.2)
            + 0.16 * np.sin(2 * np.pi * f * 2.001 * t)
        ) / 1.44
        env = np.sin(np.pi * np.minimum(1, t / duration)) ** 1.8
    elif kind == "flute":
        phase = 2 * np.pi * f * t + 0.10 * np.sin(2 * np.pi * 4.7 * t)
        breath = signal.sosfilt(
            signal.butter(2, [700, 2500], "bandpass", fs=SAMPLE_RATE, output="sos"),
            rng.normal(0, 1, len(t)),
        )
        wave = (np.sin(phase) + 0.13 * np.sin(2 * phase) + 0.04 * np.sin(3 * phase)) / 1.17
        wave += breath * 0.035
        env = (1 - np.exp(-t / 0.065)) * np.exp(-t / (duration * 1.7))
        env *= np.clip((duration - t) / 0.30, 0, 1) ** 1.5
    elif kind == "bass":
        wave = np.sin(2 * np.pi * f * t) + 0.14 * np.sin(2 * np.pi * f * 2 * t)
        env = (1 - np.exp(-t / 0.035)) * np.exp(-t / 0.85)
    elif kind == "bell":
        wave = np.zeros_like(t)
        for ratio, strength, decay in [(1, 1, 1.25), (2, 0.18, 0.6), (3.005, 0.04, 0.3)]:
            wave += strength * np.sin(2 * np.pi * f * ratio * t) * np.exp(-t / decay)
        env = 1 - np.exp(-t / 0.009)
    else:
        # Detuned string pairs, a felt-piano envelope, or warm wooden overtones.
        settings = {
            "silk": (0.012, 1.15, [1, 0.29, 0.14, 0.065, 0.022]),
            "piano": (0.018, 1.35, [1, 0.20, 0.075, 0.025]),
            "wood": (0.014, 0.65, [1, 0.10, 0.21, 0.025]),
        }
        attack, decay, harmonics = settings[kind]
        wave = np.zeros_like(t)
        for harmonic, strength in enumerate(harmonics, 1):
            detune = 1 + 0.00035 * harmonic
            partial = 0.7 * np.sin(2 * np.pi * f * harmonic * t)
            partial += 0.3 * np.sin(2 * np.pi * f * harmonic * detune * t)
            wave += strength * partial * np.exp(-t * (harmonic - 1) / (decay * 0.60))
        env = (1 - np.exp(-t / attack)) * np.exp(-t / decay)
    # A smooth release avoids discontinuities when an individual voice finishes.
    env *= np.clip((duration - t) / 0.07, 0, 1)
    return (wave * env).astype(np.float32)


def add_cyclic(mix: np.ndarray, sound: np.ndarray, at: float, gain: float, pan: float) -> None:
    start = round(at * SAMPLE_RATE) % len(mix)
    stereo = sound[:, None] * np.array([
        math.cos((pan + 1) * math.pi / 4), math.sin((pan + 1) * math.pi / 4)
    ], dtype=np.float32)[None, :] * gain
    # Carry tails across the loop boundary instead of fading the entire song.
    offset = 0
    while offset < len(stereo):
        count = min(len(mix) - start, len(stereo) - offset)
        mix[start:start + count] += stereo[offset:offset + count]
        start = 0
        offset += count


def reverberate_cyclic(mix: np.ndarray, rng: np.random.Generator) -> np.ndarray:
    """Circular convolution leaves identical ambience on both sides of a loop."""
    out = mix.copy()
    ir_size = round(1.9 * SAMPLE_RATE)
    for channel in range(2):
        ir = np.zeros(len(mix), dtype=np.float32)
        times = np.arange(ir_size) / SAMPLE_RATE
        noise = rng.normal(0, 1, ir_size)
        noise = signal.sosfilt(
            signal.butter(2, 2800, fs=SAMPLE_RATE, output="sos"), noise
        )
        diffuse = noise * np.exp(-times / 0.40)
        diffuse[:round(0.025 * SAMPLE_RATE)] = 0
        diffuse *= 0.21 / (np.sqrt(np.sum(diffuse ** 2)) + 1e-12)
        ir[:ir_size] += diffuse
        for delay, strength in [(0.11, 0.10), (0.19, 0.075), (0.31, 0.05), (0.47, 0.03)]:
            ir[round((delay + channel * 0.013) * SAMPLE_RATE)] += strength
        wet = np.fft.irfft(np.fft.rfft(mix[:, channel]) * np.fft.rfft(ir), n=len(mix))
        out[:, channel] += wet.astype(np.float32)
    return out


def compose(config: tuple) -> tuple[np.ndarray, dict]:
    name, tempo, base, scale, lead, motif, ambience, seed = config
    rng = np.random.default_rng(seed)
    beat = 60 / tempo
    duration = 48 * beat  # twelve bars in 4/4
    mix = np.zeros((round(duration * SAMPLE_RATE), 2), dtype=np.float32)
    quiet = ambience in {"quiet", "rest"}
    progression = [0, 3, 1, 4, 3, 0]
    for section, root_degree in enumerate(progression):
        start = section * 8 * beat
        chord = [root_degree, root_degree + 2, root_degree + 4]
        for voice, degree in enumerate(chord):
            add_cyclic(mix, tone("pad", degree_pitch(base, scale, degree), 10 * beat, rng),
                       start - beat, 0.065 if quiet else 0.055, (voice - 1) * 0.42)
        for bar in range(2):
            bar_at = start + bar * 4 * beat
            add_cyclic(mix, tone("bass", degree_pitch(base - 12, scale, root_degree), 3.0, rng),
                       bar_at, 0.060 if quiet else 0.072, 0)
            # The accompaniment is deliberately sparse to sit under reading/UI.
            steps = [0, 2] if quiet else [0, 1.5, 2.5, 3.5]
            for step_index, step in enumerate(steps):
                pitch = degree_pitch(base + 12, scale, chord[(step_index + bar) % 3])
                add_cyclic(mix, tone("piano" if quiet else "silk", pitch, 2.8, rng),
                           bar_at + step * beat, 0.055 if quiet else 0.052,
                           -0.30 + 0.60 * (step_index % 2))
            if ambience in {"walk", "forest", "river"}:
                # Low wooden pulse: no sharp hi-hat or percussive transient.
                for pulse in [1, 3]:
                    add_cyclic(mix, tone("wood", base, 0.75, rng),
                               bar_at + pulse * beat, 0.027, 0.16)
        # Each two-bar phrase answers the previous phrase; pentatonic endings.
        for step, degree in enumerate(motif):
            if degree is None:
                continue
            if section == 2 and step in {2, 5}:
                continue
            adjusted = degree + (1 if section == 3 and step < 3 else 0)
            if section == 5 and step >= 6:
                adjusted = 5 if step == 6 else 4
            pitch = degree_pitch(base + 12, scale, adjusted)
            note_duration = (1.55 if lead == "flute" else 2.2) * beat
            add_cyclic(mix, tone(lead, pitch, note_duration, rng),
                       start + (step + 0.12) * beat,
                       (0.082 if quiet else 0.098) * (0.94 + rng.random() * 0.12),
                       0.08 * math.sin(section))
        if section in {0, 3} and not quiet:
            add_cyclic(mix, tone("bell", degree_pitch(base + 24, scale, 2), 3.5, rng),
                       start + 6.5 * beat, 0.032, -0.25)
    mix = reverberate_cyclic(mix, rng)
    # Circular spectral shaping preserves the loop seam and removes rumble.
    frequencies = np.fft.rfftfreq(len(mix), 1 / SAMPLE_RATE)
    equalizer = (1 - np.exp(-(frequencies / 45) ** 4)) / (1 + (frequencies / 5700) ** 8)
    mix = np.fft.irfft(np.fft.rfft(mix, axis=0) * equalizer[:, None], n=len(mix), axis=0)
    mix -= mix.mean(axis=0)
    rms = float(np.sqrt(np.mean(mix ** 2)))
    mix *= (10 ** (-22.0 / 20)) / max(rms, 1e-9)
    peak = float(np.max(np.abs(mix)))
    if peak > 0.72:
        mix *= 0.72 / peak
    mix = mix.astype(np.float32)
    stats = {
        "file": f"{name}.mp3", "tempo_bpm": tempo,
        "duration_seconds": round(len(mix) / SAMPLE_RATE, 3),
        "peak_dbfs": round(20 * math.log10(float(np.max(np.abs(mix)))), 2),
        "rms_dbfs": round(20 * math.log10(float(np.sqrt(np.mean(mix ** 2)))), 2),
        "boundary_sample_delta": round(float(np.max(np.abs(mix[-1] - mix[0]))), 6),
    }
    return mix, stats


def find_ffmpeg() -> str:
    binary = os.environ.get("FFMPEG_BINARY") or shutil.which("ffmpeg")
    if binary:
        return binary
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except ImportError as exc:
        raise SystemExit("Install ffmpeg or run: python -m pip install imageio-ffmpeg") from exc


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--track", choices=[track[0] for track in TRACKS])
    args = parser.parse_args()
    OUTPUT.mkdir(parents=True, exist_ok=True)
    ffmpeg = find_ffmpeg()
    statistics = []
    for config in TRACKS:
        if args.track and config[0] != args.track:
            continue
        mix, stats = compose(config)
        destination = OUTPUT / stats["file"]
        with tempfile.TemporaryDirectory(prefix="vietphuc-music-") as temporary:
            wav = Path(temporary) / "original.wav"
            wavfile.write(wav, SAMPLE_RATE, mix)
            subprocess.run([
                ffmpeg, "-hide_banner", "-loglevel", "error", "-y", "-i", str(wav),
                "-codec:a", "libmp3lame", "-b:a", "96k", "-ar", str(SAMPLE_RATE),
                "-write_xing", "1", "-id3v2_version", "3",
                "-metadata", f"title=Viet Phuc Remix - {config[0]}",
                "-metadata", "artist=Viet Phuc Remix",
                "-metadata", "comment=Original procedural instrumental composition; no external recordings.",
                str(destination),
            ], check=True)
            # Decode the actual MP3, checking codec overshoot and loop length.
            decoded = subprocess.run([
                ffmpeg, "-hide_banner", "-loglevel", "error", "-i", str(destination),
                "-f", "f32le", "-ac", "2", "-ar", str(SAMPLE_RATE), "pipe:1",
            ], check=True, capture_output=True).stdout
            decoded_audio = np.frombuffer(decoded, dtype="<f4").reshape(-1, 2)
            stats["decoded_peak_dbfs"] = round(20 * math.log10(float(np.max(np.abs(decoded_audio)))), 2)
            stats["decoded_samples"] = len(decoded_audio)
            stats["boundary_rms_dbfs"] = round(20 * math.log10(float(np.sqrt(np.mean(
                np.concatenate([decoded_audio[-4410:], decoded_audio[:4410]]) ** 2
            )))), 2)
            assert len(decoded_audio) == len(mix), "Gapless decode must retain the exact loop duration"
            assert np.max(np.abs(decoded_audio)) < 0.98, "Decoded audio must never clip"
            assert np.isfinite(decoded_audio).all(), "Decoded audio must contain valid samples"
        stats["bytes"] = destination.stat().st_size
        statistics.append(stats)
        print(json.dumps(stats, ensure_ascii=False), flush=True)
    if not args.track:
        (OUTPUT / "manifest.json").write_text(
            json.dumps({"sample_rate": SAMPLE_RATE, "codec": "mp3", "bitrate_kbps": 96,
                        "origin": "original procedural instrumental compositions", "tracks": statistics},
                       ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Total: {sum(item['bytes'] for item in statistics):,} bytes", flush=True)


if __name__ == "__main__":
    main()
