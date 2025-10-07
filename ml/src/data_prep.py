"""Data loading & preparation utilities."""
from __future__ import annotations
import pandas as pd
from pathlib import Path
from typing import Optional

REQUIRED_COLUMNS = {"date", "part_id", "quantity_used"}


def load_dataset(path: str | Path) -> pd.DataFrame:
    path = Path(path)
    if not path.exists():
        raise FileNotFoundError(f"Dataset not found: {path}")
    df = pd.read_csv(path)
    missing = REQUIRED_COLUMNS - set(df.columns)
    if missing:
        raise ValueError(f"Missing required columns: {missing}")
    df['date'] = pd.to_datetime(df['date'])
    df = df.sort_values('date')
    return df


def aggregate_daily_to_monthly(df: pd.DataFrame) -> pd.DataFrame:
    """Aggregate daily usage to monthly totals per part."""
    df['year_month'] = df['date'].dt.to_period('M')
    monthly = (df.groupby(['part_id', 'year_month'])['quantity_used']
                 .sum()
                 .reset_index())
    monthly['month_start'] = monthly['year_month'].dt.to_timestamp()
    monthly = monthly.sort_values(['part_id', 'month_start'])
    return monthly


def compute_daily_stats(df: pd.DataFrame) -> pd.DataFrame:
    """Compute average & std daily usage per part."""
    stats = (df.groupby('part_id')['quantity_used']
               .agg(['mean', 'std', 'count'])
               .reset_index()
               .rename(columns={'mean': 'avg_daily_usage', 'std': 'std_daily_usage', 'count': 'days_observed'}))
    # Handle std = NaN for single observation
    stats['std_daily_usage'] = stats['std_daily_usage'].fillna(0.0)
    return stats


def prepare_model_frame(monthly: pd.DataFrame) -> pd.DataFrame:
    """Add a time index per part for simple regression (t=0..n-1)."""
    monthly['t'] = monthly.groupby('part_id').cumcount()
    return monthly


def get_lead_time_map(df: pd.DataFrame) -> dict:
    if 'lead_time_days' in df.columns:
        # Take latest or mode
        latest = (df.sort_values('date')
                    .groupby('part_id')['lead_time_days']
                    .last()
                    .to_dict())
        return latest
    return {}
