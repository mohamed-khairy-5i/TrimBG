#!/usr/bin/env python3
"""Create a dynamically quantized ONNX copy for local benchmarking."""
from __future__ import annotations

import argparse
from pathlib import Path

from onnxruntime.quantization import QuantType, quantize_dynamic


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    quantize_dynamic(
        model_input=str(args.input),
        model_output=str(args.output),
        weight_type=QuantType.QInt8,
        per_channel=True,
        reduce_range=False,
        extra_options={"MatMulConstBOnly": True},
    )
    print({"input_bytes": args.input.stat().st_size, "output_bytes": args.output.stat().st_size})


if __name__ == "__main__":
    main()
