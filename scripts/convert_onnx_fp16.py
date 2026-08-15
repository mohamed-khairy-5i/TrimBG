#!/usr/bin/env python3
"""Convert an ONNX model to mixed FP16 while preserving a safe output graph."""
from __future__ import annotations

import argparse
from pathlib import Path

import onnx
from onnxruntime.transformers.float16 import convert_float_to_float16


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    model = onnx.load(str(args.input))
    converted = convert_float_to_float16(model, keep_io_types=True, disable_shape_infer=False)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    onnx.save(converted, str(args.output))
    print({"input_bytes": args.input.stat().st_size, "output_bytes": args.output.stat().st_size})


if __name__ == "__main__":
    main()
