import json
from pathlib import Path

import numpy as np

VOCAB_SIZE = 65536
DTYPE = np.uint16
ATOM_SIZE = 256
DEFAULT_OUTPUT_FILE = "matrix_atoms.bin"
SUPPORTED_SUFFIXES = {".txt", ".md", ".html", ".json"}


def load_and_clean(path: Path) -> str:
    text = path.read_text(encoding="utf-8", errors="ignore")

    if path.suffix.lower() == ".json":
        try:
            obj = json.loads(text)
            text = json.dumps(obj, separators=(",", ":"))
        except json.JSONDecodeError:
            pass

    return text.replace("<", " ").replace(">", " ")


def pi_tokenize(text: str) -> list[int]:
    return [ord(char) % VOCAB_SIZE for char in text]


def pack_directory(input_dir: str, out_file: str = DEFAULT_OUTPUT_FILE) -> None:
    tokens: list[int] = []

    for path in Path(input_dir).rglob("*"):
        if path.suffix.lower() in SUPPORTED_SUFFIXES and path.is_file():
            text = load_and_clean(path)
            tokens.extend(pi_tokenize(text))

    pad = (-len(tokens)) % ATOM_SIZE
    if pad:
        tokens.extend([0] * pad)

    array = np.array(tokens, dtype=DTYPE)
    array.tofile(out_file)

    print(f"[OK] Packed {len(array)} tokens")
    print(f"[OK] Atoms: {len(array) // ATOM_SIZE}")
    print(f"[OK] Output: {out_file}")


if __name__ == "__main__":
    pack_directory("datasets")
