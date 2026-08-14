#!/usr/bin/env python3
"""Print ONNX inputs and outputs for a model."""
from __future__ import annotations
import sys
import onnxruntime as ort

if len(sys.argv) != 2:
    raise SystemExit(f"usage: {sys.argv[0]} MODEL.onnx")
session = ort.InferenceSession(sys.argv[1], providers=["CPUExecutionProvider"])
for item in session.get_inputs():
    print("INPUT", item.name, item.shape, item.type)
for item in session.get_outputs():
    print("OUTPUT", item.name, item.shape, item.type)
print("PROVIDERS", session.get_providers())
