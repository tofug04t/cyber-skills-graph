"""Our own ids: a one-letter prefix and a number that is never reused.

    s skill   r work role   t task   k knowledge   a competency area   c category

data/ids.json records where each id came from (the NICE id it replaced) and the next free number
for each prefix. New items take the next number; numbers are not reused, even for retired items.
Sort ids with natural_key so s10 comes after s9.
"""

import re

_ID = re.compile(r"^([a-z])(\d+)$")


def natural_key(identifier):
    match = _ID.match(identifier)
    return (match.group(1), int(match.group(2))) if match else (identifier, 0)


def is_valid(identifier):
    return bool(_ID.match(identifier))
