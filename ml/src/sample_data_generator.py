"""Generate synthetic daily usage dataset for parts.

Example:
python -m src.sample_data_generator --days 120 --parts 10
"""
import argparse
import random
from datetime import datetime, timedelta
from pathlib import Path
import csv


def generate(days: int, parts: int, out_path: str):
    start = datetime.utcnow().date() - timedelta(days=days)
    part_ids = [f"PRT-{i:03d}" for i in range(1, parts + 1)]
    rows = []
    for day_idx in range(days):
        current_date = start + timedelta(days=day_idx)
        for pid in part_ids:
            base = random.randint(1, 15)
            seasonal = 1 + 0.3 * (1 if current_date.month in (11,12) else 0)  # Higher in Nov/Dec
            noise = random.uniform(0.7, 1.3)
            qty = max(0, int(base * seasonal * noise))
            stock = 500 - (day_idx * qty * 0.05)  # crude diminishing stock pattern
            lead_time = random.choice([5,7,10])
            unit_cost = random.choice([5.0, 7.5, 12.0, 20.0])
            rows.append({
                'date': current_date.isoformat(),
                'part_id': pid,
                'quantity_used': qty,
                'stock_on_hand': int(stock),
                'lead_time_days': lead_time,
                'unit_cost': unit_cost
            })

    out_file = Path(out_path)
    out_file.parent.mkdir(parents=True, exist_ok=True)
    new_file = not out_file.exists()
    with open(out_file, 'w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=rows[0].keys())
        writer.writeheader()
        writer.writerows(rows)
    print(f"Wrote {len(rows)} rows to {out_file} (parts={parts}, days={days}). New file: {new_file}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--days', type=int, default=120)
    ap.add_argument('--parts', type=int, default=8)
    ap.add_argument('--out', default='data/dataset.csv')
    args = ap.parse_args()
    generate(args.days, args.parts, args.out)


if __name__ == '__main__':
    main()
