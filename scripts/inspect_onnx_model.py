import argparse
import json
import onnxruntime as ort

parser = argparse.ArgumentParser()
parser.add_argument('model')
args = parser.parse_args()
session = ort.InferenceSession(args.model, providers=['CPUExecutionProvider'])
print(json.dumps({'inputs': [{'name': x.name, 'shape': x.shape, 'type': x.type} for x in session.get_inputs()], 'outputs': [{'name': x.name, 'shape': x.shape, 'type': x.type} for x in session.get_outputs()]}, indent=2))
