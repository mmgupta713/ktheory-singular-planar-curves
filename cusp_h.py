"""
The function h from Hesselholt--Nikolaus, "Algebraic K-theory of planar
cuspidal curves" (arXiv:1903.08295), Introduction.

For relatively prime a, b >= 2, r >= 0, a prime p, and m' >= 1 not divisible by p,

    K_{2r}(k[x,y]/(y^a - x^b), (x,y))  ~=  prod_{m' in N'} W_h(k),   h = h(a,b,r,p,m').

Definitions (paper's notation):
  l(a,b,m)   = #{(i,j) in Z_{>0}^2 : a*i + b*j = m}
  s          = the unique integer with l(p^{s-1} m') <= r < l(p^s m'), and 0 if none exists.
               Since d | m implies l(d) <= l(m), the sequence l(p^v m') is non-decreasing
               in v, so s = min{v >= 0 : l(p^v m') > r}  (= 0 exactly when l(m') > r).
  WLOG p does not divide b (swap a, b otherwise); write a = p^u * a' with p not dividing a'.
  h = s            if neither a' nor b divides m',
      min(s, u)    if a' but not b divides m',
      0            if b divides m'.

Arguments are ordered (a, b, r, p, m') as in the paper.
"""

from math import gcd
import sys


def ell(a, b, m):
    """Number of pairs (i, j) of positive integers with a*i + b*j = m."""
    count = 0
    i = 1
    while a * i + b <= m:
        if (m - a * i) % b == 0:
            count += 1
        i += 1
    return count


def is_prime(p):
    return p >= 2 and all(p % d for d in range(2, int(p ** 0.5) + 1))


def _check_args(a, b, r, p, mp):
    if a < 2 or b < 2 or gcd(a, b) != 1:
        raise ValueError("need relatively prime integers a, b >= 2")
    if r < 0:
        raise ValueError("need r >= 0")
    if not is_prime(p):
        raise ValueError("p must be prime")
    if mp < 1 or mp % p == 0:
        raise ValueError("m' must be a positive integer not divisible by p")


def s_value(a, b, r, p, mp):
    """s(a,b,r,p,m') = min{v >= 0 : l(a,b,p^v m') > r}."""
    _check_args(a, b, r, p, mp)
    v = 0
    while ell(a, b, p ** v * mp) <= r:
        v += 1
    return v


def h(a, b, r, p, mp):
    """h(a,b,r,p,m'): the length of the factor W_h(k) indexed by m'."""
    _check_args(a, b, r, p, mp)
    if b % p == 0:          # WLOG p does not divide b
        a, b = b, a
    u, a1 = 0, a            # a = p^u * a'
    while a1 % p == 0:
        a1 //= p
        u += 1

    if mp % b == 0:
        return 0
    s = s_value(a, b, r, p, mp)
    if mp % a1 == 0:
        return min(s, u)
    return s


def nonzero_factors(a, b, r, p):
    """All m' with h(a,b,r,p,m') > 0, as a dict {m': h}.

    h > 0 forces l(a,b,m') <= r, and l(m) >= floor(m/(ab)) - 1, so m' <= (r+2)*a*b suffices.
    """
    bound = (r + 2) * a * b
    out = {}
    for mp in range(1, bound + 1):
        if mp % p:
            val = h(a, b, r, p, mp)
            if val:
                out[mp] = val
    return out


def h_multiplicities(factors):
    """Given the output of nonzero_factors, return {h: number of m' with that h}.

    E.g. {1: 2, 5: 2, 7: 2, 11: 1, 13: 1, 17: 1} -> {2: 3, 1: 3}, i.e. W_2(k)^3 x W_1(k)^3.
    """
    counts = {}
    for val in factors.values():
        counts[val] = counts.get(val, 0) + 1
    return dict(sorted(counts.items(), reverse=True))


def total_length(a, b, r, p):
    """Sum of h over m'. The paper states this equals (2r+1)(a-1)(b-1)/2."""
    return sum(nonzero_factors(a, b, r, p).values())


def _self_test():
    for a in range(2, 9):
        for b in range(2, 9):
            if gcd(a, b) != 1:
                continue
            for p in (2, 3, 5, 7):
                for r in range(0, 5):
                    got = total_length(a, b, r, p)
                    want = (2 * r + 1) * (a - 1) * (b - 1) // 2
                    assert got == want, (a, b, r, p, got, want)
    print("OK: sum over m' of h(a,b,r,p,m') == (2r+1)(a-1)(b-1)/2 for all tested cases")


if __name__ == "__main__":
    if len(sys.argv) == 6:
        a, b, r, p, mp = map(int, sys.argv[1:])
        print(h(a, b, r, p, mp))
    elif len(sys.argv) == 5:
        a, b, r, p = map(int, sys.argv[1:])
        fac = nonzero_factors(a, b, r, p)
        print(f"K_{2*r} relative group ~= " +
              (" x ".join(f"W_{v}(k)" for v in fac.values()) or "0"))
        for mp, v in fac.items():
            print(f"  m' = {mp:4d}: h = {v}")
        print(f"h multiplicities = {h_multiplicities(fac)}")
        print(f"total length = {sum(fac.values())}")
    else:
        _self_test()