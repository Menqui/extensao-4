import time
from collections import defaultdict, deque
from threading import Lock

from fastapi import HTTPException, Request


class InMemoryRateLimiter:
    def __init__(self, limit: int, period_seconds: int) -> None:
        self.limit = limit
        self.period_seconds = period_seconds
        self._attempts: dict[str, deque[float]] = defaultdict(deque)
        self._lock = Lock()

    def check(self, key: str) -> int | None:
        now = time.monotonic()
        with self._lock:
            events = self._attempts[key]
            while events and events[0] <= now - self.period_seconds:
                events.popleft()
            if len(events) >= self.limit:
                return max(1, int(self.period_seconds - (now - events[0])))
            events.append(now)
        return None


def enforce_response_limit(request: Request) -> None:
    limiter: InMemoryRateLimiter = request.app.state.rate_limiter
    client_host = request.client.host if request.client else "desconhecido"
    retry_after = limiter.check(client_host)
    if retry_after is not None:
        raise HTTPException(
            status_code=429,
            detail={
                "codigo": "LIMITE_EXCEDIDO",
                "mensagem": "Limite de solicitações excedido.",
            },
            headers={"Retry-After": str(retry_after)},
        )
