# a2p Protocol Documentation

**Single Source of Truth** for all a2p protocol documentation.

This folder contains all documentation served via [MkDocs](https://www.mkdocs.org/) and [Material for MkDocs](https://squidfunk.github.io/mkdocs-material/).

## Structure

```
docs/
├── mkdocs.yml              # MkDocs configuration
├── index.md                # Home page
├── documentation/          # Core documentation
│   ├── what-is-a2p.md
│   ├── core-concepts.md
│   └── ...
├── spec/                   # Protocol specification
│   ├── index.md           # Comprehensive spec
│   ├── overview.md
│   └── ...
├── tutorials/              # Tutorials
├── sdk/                    # SDK reference
├── adapters/               # Framework adapters
├── community/              # Community docs
├── compliance/             # Compliance docs
├── specification/          # API reference
├── legal/                  # Legal/compliance docs
├── assets/                 # Images, logos
└── overrides/              # Theme overrides
```

## Development

### Setup

```bash
cd docs
python3 -m venv .venv
source .venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
```

### Preview Locally

```bash
source .venv/bin/activate
mkdocs serve --dev-addr=127.0.0.1:8001
```

Open http://127.0.0.1:8001

### Build

```bash
mkdocs build
```

Output is in `site/` folder.

## Protocol Specification

The comprehensive protocol specification is at:
- **`spec/index.md`** - Full specification

This is the **authoritative source** for the a2p protocol specification.

---

**Last Updated**: 2026-01-11  
**Status**: Active - Single Source of Truth
