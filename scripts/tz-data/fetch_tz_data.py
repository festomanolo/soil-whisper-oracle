#!/usr/bin/env python3
"""
Mbolea Sahihi - Tanzania data pipeline.

Scrapes real, open datasets for every Tanzanian region and writes compact JSON
files the app bundles for fully-offline use (src/data/tz/*.json):

  1. NASA POWER  - 30-year monthly climatology (rainfall, temperature, humidity)
                   and elevation for a farmland point in each region.
  2. ISRIC SoilGrids v2 - modelled topsoil (0-30 cm) pH, total N, organic
                   carbon, clay and CEC for the same point. Used as the regional
                   soil baseline when the farmer has no sensor/lab test.
  3. WFP VAM (via HDX) - wholesale market prices (TZS/100 kg) for the staple
                   crops, per region, most recent 12 months.

Only the Python standard library is used. Run from the project root:

    python3 scripts/tz-data/fetch_tz_data.py            # everything
    python3 scripts/tz-data/fetch_tz_data.py --only prices

SoilGrids allows ~5 requests/minute, so the soil step takes ~10 minutes.
"""
import argparse
import csv
import io
import json
import os
import statistics
import sys
import time
import urllib.request
from datetime import date

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT = os.path.join(ROOT, 'src', 'data', 'tz')

# Farmland sampling points near each regional HQ (lat, lon).
# Rainfall regime follows the Tanzania Meteorological Authority (TMA) grouping
# used in its seasonal outlooks; zone is the administrative zone used by TFRA
# for indicative fertilizer prices.
REGIONS = [
    # id,             name,             lat,    lon,   regime,     zone
    ('arusha',        'Arusha',        -3.30, 36.75, 'bimodal',  'northern'),
    ('dar-es-salaam', 'Dar es Salaam', -6.95, 39.15, 'bimodal',  'eastern'),
    ('dodoma',        'Dodoma',        -6.10, 35.85, 'unimodal', 'central'),
    ('geita',         'Geita',         -2.95, 32.30, 'bimodal',  'lake'),
    ('iringa',        'Iringa',        -7.85, 35.60, 'unimodal', 'southern-highlands'),
    ('kagera',        'Kagera',        -1.45, 31.70, 'bimodal',  'lake'),
    ('katavi',        'Katavi',        -6.45, 31.15, 'unimodal', 'western'),
    ('kigoma',        'Kigoma',        -4.80, 29.85, 'unimodal', 'western'),
    ('kilimanjaro',   'Kilimanjaro',   -3.30, 37.45, 'bimodal',  'northern'),
    ('lindi',         'Lindi',         -10.05, 39.55, 'unimodal', 'southern'),
    ('manyara',       'Manyara',       -4.30, 35.70, 'bimodal',  'northern'),
    ('mara',          'Mara',          -1.65, 33.95, 'bimodal',  'lake'),
    ('mbeya',         'Mbeya',         -8.95, 33.60, 'unimodal', 'southern-highlands'),
    ('morogoro',      'Morogoro',      -6.90, 37.55, 'bimodal',  'eastern'),
    ('mtwara',        'Mtwara',        -10.40, 39.95, 'unimodal', 'southern'),
    ('mwanza',        'Mwanza',        -2.65, 33.05, 'bimodal',  'lake'),
    ('njombe',        'Njombe',        -9.25, 34.65, 'unimodal', 'southern-highlands'),
    ('pwani',         'Pwani',         -6.85, 38.75, 'bimodal',  'eastern'),
    ('rukwa',         'Rukwa',         -8.05, 31.70, 'unimodal', 'southern-highlands'),
    ('ruvuma',        'Ruvuma',        -10.60, 35.75, 'unimodal', 'southern-highlands'),
    ('shinyanga',     'Shinyanga',     -3.55, 33.30, 'bimodal',  'lake'),
    ('simiyu',        'Simiyu',        -2.75, 34.10, 'bimodal',  'lake'),
    ('singida',       'Singida',       -4.90, 34.85, 'unimodal', 'central'),
    ('songwe',        'Songwe',        -9.15, 32.80, 'unimodal', 'southern-highlands'),
    ('tabora',        'Tabora',        -5.10, 32.90, 'unimodal', 'western'),
    ('tanga',         'Tanga',         -5.15, 38.95, 'bimodal',  'northern'),
    ('unguja',        'Unguja (Zanzibar)', -6.05, 39.30, 'bimodal', 'zanzibar'),
    ('pemba',         'Pemba (Zanzibar)',  -5.20, 39.75, 'bimodal', 'zanzibar'),
]

MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
DAYS = [31, 28.25, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

WFP_CSV = ('https://data.humdata.org/dataset/5090d858-a300-49fe-a953-4ec4e3526fc2/'
           'resource/2ff38c1a-a8f7-45b2-9209-090200c859da/download/wfp_food_prices_tza.csv')

# WFP commodity name -> app crop id
WFP_CROPS = {
    'Maize': 'maize',
    'Rice': 'rice',
    'Beans': 'beans',
    'Sorghum': 'sorghum',
    'Millet (finger)': 'finger-millet',
    'Potatoes (Irish)': 'irish-potato',
    'Wheat': 'wheat',
}


def get(url, timeout=120, retries=3):
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'MboleaSahihi-data/1.0'})
            with urllib.request.urlopen(req, timeout=timeout) as r:
                return r.read()
        except Exception as e:  # noqa: BLE001 - network flakiness, retry
            print(f'  retry {attempt + 1}/{retries} {url[:80]}: {e}', file=sys.stderr)
            time.sleep(5 * (attempt + 1))
    raise RuntimeError(f'failed: {url}')


def write(name, payload):
    os.makedirs(OUT, exist_ok=True)
    path = os.path.join(OUT, name)
    with open(path, 'w') as f:
        json.dump(payload, f, ensure_ascii=False, indent=1)
    print(f'wrote {os.path.relpath(path, ROOT)}')


def fetch_climate():
    regions = []
    for rid, name, lat, lon, regime, zone in REGIONS:
        url = ('https://power.larc.nasa.gov/api/temporal/climatology/point'
               f'?parameters=PRECTOTCORR,T2M,T2M_MAX,T2M_MIN,RH2M&community=AG'
               f'&longitude={lon}&latitude={lat}&format=JSON')
        data = json.loads(get(url))
        p = data['properties']['parameter']
        elevation = round(data['geometry']['coordinates'][2])
        rain = [round(p['PRECTOTCORR'][m] * d) for m, d in zip(MONTHS, DAYS)]
        regions.append({
            'id': rid, 'name': name, 'lat': lat, 'lon': lon,
            'regime': regime, 'zone': zone, 'elevation': elevation,
            'rainfallMm': rain,
            'annualRainMm': sum(rain),
            'tempC': [round(p['T2M'][m], 1) for m in MONTHS],
            'tempMaxC': [round(p['T2M_MAX'][m], 1) for m in MONTHS],
            'tempMinC': [round(p['T2M_MIN'][m], 1) for m in MONTHS],
            'humidity': [round(p['RH2M'][m]) for m in MONTHS],
        })
        print(f'  climate {name}: {sum(rain)} mm/yr, {elevation} m')
        time.sleep(1)
    return regions


def soilgrids_point(lat, lon):
    url = ('https://rest.isric.org/soilgrids/v2.0/properties/query'
           f'?lon={lon}&lat={lat}'
           '&property=phh2o&property=nitrogen&property=soc&property=clay&property=cec'
           '&depth=0-5cm&depth=5-15cm&depth=15-30cm&value=mean')
    data = json.loads(get(url, timeout=180))
    out = {}
    for layer in data['properties']['layers']:
        factor = layer['unit_measure']['d_factor']
        vals, weights = [], []
        for d in layer['depths']:
            v = d['values']['mean']
            if v is None:
                continue
            vals.append(v / factor)
            weights.append(d['range']['bottom_depth'] - d['range']['top_depth'])
        if vals:
            out[layer['name']] = sum(v * w for v, w in zip(vals, weights)) / sum(weights)
    return out


def fetch_soil(regions):
    offsets = [(0, 0), (0.08, 0.08), (-0.08, 0.08), (0.08, -0.08), (-0.08, -0.08), (0.2, 0), (0, 0.2)]
    for r in regions:
        soil = {}
        for dlat, dlon in offsets:
            try:
                soil = soilgrids_point(round(r['lat'] + dlat, 3), round(r['lon'] + dlon, 3))
            except RuntimeError as e:
                print(f'  {e}', file=sys.stderr)
            time.sleep(13)  # SoilGrids fair-use limit: 5 requests/minute
            if 'phh2o' in soil:
                break
        if 'phh2o' not in soil:
            print(f'  soil {r["name"]}: no data', file=sys.stderr)
            r['soil'] = None
            continue
        r['soil'] = {
            'ph': round(soil['phh2o'], 1),
            'totalNitrogenGkg': round(soil.get('nitrogen', 0), 2),   # g/kg
            'organicCarbonGkg': round(soil.get('soc', 0), 1),        # g/kg
            'clayPct': round(soil.get('clay', 0), 1),                # %
            'cecCmolKg': round(soil.get('cec', 0), 1),               # cmol(c)/kg
            'source': 'ISRIC SoilGrids v2.0 (0-30 cm, modelled)',
        }
        print(f'  soil {r["name"]}: pH {r["soil"]["ph"]}, N {r["soil"]["totalNitrogenGkg"]} g/kg')
    return regions


def fetch_prices():
    print('downloading WFP Tanzania food prices (~9 MB)...')
    raw = get(WFP_CSV, timeout=600).decode('utf-8')
    rows = [r for r in csv.DictReader(io.StringIO(raw))
            if r['commodity'] in WFP_CROPS and r['pricetype'] == 'Wholesale'
            and r['currency'] == 'TZS' and r['unit'] == '100 KG']
    latest = max(r['date'] for r in rows)
    y, m, _ = (int(x) for x in latest.split('-'))
    cutoff = f'{y - 1}-{m:02d}-01'
    recent = [r for r in rows if r['date'] >= cutoff]

    by_region, national = {}, {}
    for r in recent:
        crop = WFP_CROPS[r['commodity']]
        region = r['admin1'].lower().replace(' ', '-')  # matches REGIONS ids, e.g. 'dar-es-salaam'
        per_kg = float(r['price']) / 100.0
        by_region.setdefault(region, {}).setdefault(crop, []).append(per_kg)
        national.setdefault(crop, []).append(per_kg)

    def med(xs):
        return round(statistics.median(xs))

    return {
        'source': 'WFP VAM Food Prices via HDX (CC BY-IGO); wholesale, median of last 12 months',
        'unit': 'TZS/kg',
        'periodStart': cutoff,
        'periodEnd': latest,
        'national': {c: med(v) for c, v in national.items()},
        'byRegion': {reg: {c: med(v) for c, v in crops.items()} for reg, crops in by_region.items()},
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--only', choices=['climate', 'soil', 'prices'])
    args = ap.parse_args()

    if args.only in (None, 'climate', 'soil'):
        path = os.path.join(OUT, 'regions.json')
        if args.only == 'soil' and os.path.exists(path):
            regions = json.load(open(path))['regions']
        else:
            regions = fetch_climate()
        if args.only in (None, 'soil'):
            regions = fetch_soil(regions)
        write('regions.json', {
            'generated': date.today().isoformat(),
            'sources': [
                'NASA POWER climatology (AG community), https://power.larc.nasa.gov',
                'ISRIC SoilGrids v2.0, https://soilgrids.org',
                'Rainfall regimes: Tanzania Meteorological Authority seasonal outlook grouping',
            ],
            'regions': regions,
        })

    if args.only in (None, 'prices'):
        write('market-prices.json', {'generated': date.today().isoformat(), **fetch_prices()})


if __name__ == '__main__':
    main()
