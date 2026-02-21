"""Version constants derived from package metadata."""

from importlib.metadata import PackageNotFoundError
from importlib.metadata import version as _get_version

try:
    PROTOCOL_VERSION = _get_version("a2p-sdk")
except PackageNotFoundError:
    PROTOCOL_VERSION = "0.0.0"
