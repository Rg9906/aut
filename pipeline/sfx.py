"""Procedural sound effects (no samples, no copyright). All return float32 mono @ 24 kHz."""
import numpy as np

SR = 24000


def _t(dur):
    return np.arange(int(dur * SR)) / SR


def _norm(x, peak):
    m = float(np.max(np.abs(x))) or 1.0
    return (x / m * peak).astype(np.float32)


def pop():
    t = _t(0.10)
    f = 250 + 900 * np.exp(-t * 18)
    return _norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 32), 0.55)


def whoosh():
    n = int(0.36 * SR)
    noise = np.random.RandomState(7).randn(n)
    t = np.arange(n) / n
    fc = 300 + 4200 * np.sin(np.pi * t) ** 2
    a = 1 - np.exp(-2 * np.pi * fc / SR)
    y = np.zeros(n)
    for i in range(1, n):
        y[i] = y[i - 1] + a[i] * (noise[i] - y[i - 1])
    return _norm(y * np.sin(np.pi * t) ** 1.5, 0.30)


def buzz():
    t = _t(0.38)
    sq = np.sign(np.sin(2 * np.pi * 130 * t)) + np.sign(np.sin(2 * np.pi * 138 * t))
    k = 24
    sq = np.convolve(sq, np.ones(k) / k, mode="same")
    env = np.where(t < 0.30, 1.0, np.exp(-(t - 0.30) * 40))
    return _norm(sq * env, 0.40)


def ding():
    t = _t(0.7)
    s = np.sin(2 * np.pi * 988 * t) + 0.6 * np.sin(2 * np.pi * 1480 * t)
    return _norm(s * np.exp(-t * 6.5), 0.45)


def boom():
    t = _t(0.7)
    f = 40 + 90 * np.exp(-t * 9)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 5.5)
    click = np.random.RandomState(3).randn(len(t)) * np.exp(-t * 120) * 0.3
    return _norm(s + click, 0.65)


def boing():
    t = _t(0.55)
    f = 220 + 280 * np.exp(-t * 3) * (1 + 0.6 * np.sin(2 * np.pi * 9 * t))
    return _norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 4.2), 0.5)


def scratch():
    t = _t(0.38)
    f = 80 + 1100 * np.exp(-t * 7)
    saw = 2 * ((np.cumsum(f) / SR) % 1) - 1
    noise = np.random.RandomState(5).randn(len(t)) * 0.25
    return _norm((saw * 0.7 + noise) * np.exp(-t * 4.5), 0.45)


def sparkle():
    out = np.zeros(int(0.7 * SR), dtype=np.float32)
    for i, f in enumerate([784, 988, 1175, 1568]):
        t = _t(0.28)
        n = np.sin(2 * np.pi * f * t) * np.exp(-t * 14)
        s = int(i * 0.06 * SR)
        out[s:s + len(n)] += n.astype(np.float32)
    return _norm(out, 0.4)


BANK = {f.__name__: f for f in (pop, whoosh, buzz, ding, boom, boing, scratch, sparkle)}
_cache = {}


def get(name):
    if name not in _cache:
        _cache[name] = BANK[name]()
    return _cache[name]
