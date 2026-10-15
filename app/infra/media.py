from pathlib import PurePosixPath
from typing import Protocol
from urllib.parse import quote


class MediaStorage(Protocol):
    def public_url(self, relative_path: str) -> str: ...


class LocalMediaStorage:
    def __init__(self, static_base_url: str, dataset_version: str | None = None) -> None:
        self._base_url = static_base_url.rstrip("/") + "/static/"
        self._dataset_version = dataset_version

    def set_dataset_version(self, dataset_version: str) -> None:
        self._dataset_version = dataset_version

    def public_url(self, relative_path: str) -> str:
        normalized = PurePosixPath(relative_path).as_posix()
        url = self._base_url + quote(normalized, safe="/")
        if self._dataset_version is not None:
            url += "?v=" + quote(self._dataset_version, safe="")
        return url
