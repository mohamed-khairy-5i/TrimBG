#!/usr/bin/env python3
from pathlib import Path
import argparse
import pyarrow.parquet as pq

parser = argparse.ArgumentParser()
parser.add_argument("--file", type=Path, required=True)
args = parser.parse_args()
table = pq.read_table(args.file, columns=None)
print(table.schema)
print(f"rows={table.num_rows}")
for name in table.column_names:
    value = table[name][0].as_py()
    print(name, type(value).__name__, repr(value)[:300])
