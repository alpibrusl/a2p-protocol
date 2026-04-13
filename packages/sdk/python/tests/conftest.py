"""Pytest configuration for SDK tests."""

import glob
import os

# Ignore adapter tests — they require optional adapter packages
collect_ignore_glob = [os.path.join(os.path.dirname(__file__), "test_adapter_*.py")]
collect_ignore = glob.glob(os.path.join(os.path.dirname(__file__), "test_adapter_*.py"))
