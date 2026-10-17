"""
JSON-friendly wrapper around cusp_h for the web explorer.

Every public function returns plain dicts/lists/ints, or {"error": msg} if
cusp_h rejects the arguments.
"""

from functools import wraps

import cusp_h


def _catch(fn):
    @wraps(fn)
    def wrapper(*args):
        try:
            return fn(*args)
        except ValueError as e:
            return {"error": str(e)}
    return wrapper


def _case(a, b, p, mp):
    """Which branch of the definition of h applies to m' (see cusp_h.h)."""
    if b % p == 0:
        a, b = b, a
    a1 = a
    while a1 % p == 0:
        a1 //= p
    if mp % b == 0:
        return "b | m'"
    if mp % a1 == 0:
        return "a' | m'"
    return "generic"


def _row(a, b, r, p, mp):
    if mp % p == 0:
        return {"m": mp, "excluded": True, "h": None, "ell": None, "s": None, "case": None}
    return {
        "m": mp,
        "excluded": False,
        "h": cusp_h.h(a, b, r, p, mp),
        "ell": cusp_h.ell(a, b, mp),
        "s": cusp_h.s_value(a, b, r, p, mp),
        "case": _case(a, b, p, mp),
    }


@_catch
def decompose(a, b, r, p):
    cusp_h._check_args(a, b, r, p, 1)
    factors = cusp_h.nonzero_factors(a, b, r, p)
    return {
        "factors": [_row(a, b, r, p, mp) for mp in factors],
        "multiplicities": [[k, v] for k, v in cusp_h.h_multiplicities(factors).items()],
        "total": sum(factors.values()),
        "expected": (2 * r + 1) * (a - 1) * (b - 1) // 2,
    }


@_catch
def series(a, b, r, p):
    cusp_h._check_args(a, b, r, p, 1)
    return [_row(a, b, r, p, mp) for mp in range(1, (r + 2) * a * b + 1)]


@_catch
def grid(a, b, p, R):
    cusp_h._check_args(a, b, R, p, 1)
    M = (R + 2) * a * b
    return {
        "M": M,
        "rows": [
            [None if mp % p == 0 else cusp_h.h(a, b, r, p, mp) for mp in range(1, M + 1)]
            for r in range(R + 1)
        ],
    }
