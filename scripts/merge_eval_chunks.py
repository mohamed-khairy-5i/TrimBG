#!/usr/bin/env python3
"""Merge chunked evaluator summaries into one aggregate summary."""
from __future__ import annotations

import argparse
import json
from pathlib import Path
import numpy as np


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--inputs", nargs="+", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    summaries = [json.loads(p.read_text()) for p in args.inputs]
    records = [r for s in summaries for r in s.get("records", [])]
    seconds = [r["seconds"] for r in records]
    maes = [r["mae"] for r in records if r.get("mae") is not None]
    base = summaries[0]
    merged = {
        "model": base["model"],
        "model_bytes": base["model_bytes"],
        "input_size": base["input_size"],
        "image_count": len(records),
        "mean_seconds": round(float(np.mean(seconds)), 4),
        "median_seconds": round(float(np.median(seconds)), 4),
        "mean_mae": round(float(np.mean(maes)), 6),
        "providers": base.get("providers", []),
        "output_count": base.get("output_count"),
        "records": records,
        "source_chunks": [str(p) for p in args.inputs],
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(merged, indent=2), encoding="utf-8")
    print(json.dumps({k: merged[k] for k in ("model_bytes", "image_count", "mean_seconds", "median_seconds", "mean_mae")}, indent=2))


if __name__ == "__main__":
    main()
