#!/usr/bin/env python3
"""Aggregate real flt search stats from session.json + the result cache.

Usage: scenario-stats.py [--since EPOCH_MS] [--label NAME] [--match REGEX]
Every number comes off disk. Nothing here is estimated.
"""
import json, os, re, sys

FLT = os.environ.get('TMPDIR', '/tmp/') + 'flt/'

def add_carriers(name, into):
    """Google reports codeshares as "Air France, Vietnam Airlines" — split them."""
    for part in str(name).split(','):
        part = part.strip()
        if part:
            into.add(part)


def cached(key):
    p = f'{FLT}cache/{key}.json'
    if not os.path.exists(p):
        return None
    try:
        return json.load(open(p))
    except Exception:
        return None

def price_of(offer):
    m = re.search(r'([\d.,]+)', offer.get('price') or '')
    if not m:
        return None
    try:
        return float(m.group(1).replace('.', '').replace(',', ''))
    except ValueError:
        return None

def collect(since=0, label='all', match=None):
    sess = json.load(open(FLT + 'session.json'))
    routes, days, carriers, cabins = set(), set(), set(), set()
    aircraft, stops_seen = set(), set()
    options = 0
    prices = []
    ts = []
    hit = miss = 0

    for s in sess['searches'].values():
        if int(s['timestamp']) < since:
            continue
        if match and not re.search(match, s['query']):
            continue
        options += int(s['offerCount'])
        ts.append(int(s['timestamp']))

        blob = cached(s['cacheKey'])
        if blob is None:
            miss += 1
            # still recoverable from the query string
            parts = s['query'].split(' · ')
            head = parts[0].split()
            if len(head) >= 3:
                routes.add(f'{head[0]}-{head[1]}')
                days.add(head[2])
            if len(parts) > 1:
                cabins.add(parts[1])
            continue

        hit += 1
        p = blob.get('params', {})
        if p.get('from_airport') and p.get('to_airport'):
            routes.add(f"{p['from_airport']}-{p['to_airport']}")
        if p.get('departure_date'):
            days.add(p['departure_date'])
        if p.get('seat'):
            cabins.add(p['seat'])

        for o in blob.get('offers', []):
            if o.get('name'):
                add_carriers(o['name'], carriers)
            for leg in o.get('legs', []):
                n = leg.get('airline_name') or leg.get('airline')
                if n:
                    add_carriers(n, carriers)
                if leg.get('aircraft'):
                    aircraft.add(leg['aircraft'].strip())
            if o.get('stops') is not None:
                stops_seen.add(o['stops'])
            v = price_of(o)
            if v:
                prices.append(v)

    out = {
        'label': label,
        'queries': len(ts),
        'options': options,
        'days': len(days),
        'routes': len(routes),
        'carriers': len(carriers),
        'cabins': len(cabins),
        'aircraft_types': len(aircraft),
        'max_stops_seen': max(stops_seen) if stops_seen else None,
        'cache_hit': hit,
        'cache_miss': miss,
        'elapsed_s': round((max(ts) - min(ts)) / 1000) if len(ts) > 1 else 0,
    }
    if prices:
        out['price_low'] = round(min(prices))
        out['price_high'] = round(max(prices))
        out['price_spread'] = round(max(prices) - min(prices))
    out['carrier_names'] = sorted(carriers)
    out['route_list'] = sorted(routes)
    return out

if __name__ == '__main__':
    a = sys.argv[1:]
    since, label, match = 0, 'all', None
    for i, x in enumerate(a):
        if x == '--since':
            since = int(a[i + 1])
        if x == '--label':
            label = a[i + 1]
        if x == '--match':
            match = a[i + 1]
    print(json.dumps(collect(since, label, match), indent=2))
