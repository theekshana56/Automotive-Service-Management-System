"""Train per-part simple linear regression models forecasting next month's total usage.

If a part has <3 months of history, fallback to moving average.
"""
from __future__ import annotations
import argparse
import json
from pathlib import Path
import joblib
import pandas as pd
from sklearn.linear_model import LinearRegression

from .data_prep import load_dataset, aggregate_daily_to_monthly, prepare_model_frame, compute_daily_stats, get_lead_time_map

MODELS_DIR = Path(__file__).resolve().parent.parent / 'models'
MODELS_DIR.mkdir(exist_ok=True, parents=True)


def train_models(data_path: str, min_points: int = 3):
    raw = load_dataset(data_path)
    monthly = aggregate_daily_to_monthly(raw)
    monthly = prepare_model_frame(monthly)
    stats = compute_daily_stats(raw)
    lead_time_map = get_lead_time_map(raw)

    metadata = {"models": [], "strategy": "linear_regression_fallback_avg"}
    for part_id, grp in monthly.groupby('part_id'):
        if len(grp) >= min_points:
            # Convert to numpy arrays explicitly for type checkers / sklearn
            X = grp[['t']].to_numpy(dtype=float)
            y = grp['quantity_used'].to_numpy(dtype=float)
            model = LinearRegression()
            model.fit(X, y)
            joblib.dump(model, MODELS_DIR / f"linear_part_{part_id}.pkl")
            method = 'linear'
        else:
            # Store fallback data (last average) as JSON
            avg_usage = grp['quantity_used'].mean()
            payload = {"avg_usage": avg_usage, "points": len(grp)}
            with open(MODELS_DIR / f"fallback_part_{part_id}.json", 'w') as f:
                json.dump(payload, f)
            method = 'avg'

        part_stats = stats[stats.part_id == part_id].iloc[0].to_dict()
        metadata['models'].append({
            'part_id': part_id,
            'method': method,
            'n_months': int(len(grp)),
            'latest_month': grp['month_start'].max().strftime('%Y-%m-%d'),
            'avg_daily_usage': part_stats['avg_daily_usage'],
            'std_daily_usage': part_stats['std_daily_usage'],
            'days_observed': int(part_stats['days_observed']),
            'lead_time_days': int(lead_time_map.get(part_id, 7))
        })

    with open(MODELS_DIR / 'model_metadata.json', 'w') as f:
        json.dump(metadata, f, indent=2)
    return metadata


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--data', default='data/dataset.csv')
    ap.add_argument('--min-points', type=int, default=3)
    args = ap.parse_args()
    md = train_models(args.data, args.min_points)
    print(f"Trained {len(md['models'])} part models.")


if __name__ == '__main__':
    main()
