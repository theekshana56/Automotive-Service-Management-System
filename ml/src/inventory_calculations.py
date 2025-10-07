"""Inventory related calculation utilities: ROP, Safety Stock, EOQ."""
from math import sqrt
from typing import Optional


def safety_stock(std_daily_usage: float, lead_time_days: float, service_level_z: float = 1.65) -> float:
    if lead_time_days <= 0 or std_daily_usage <= 0:
        return 0.0
    return service_level_z * std_daily_usage * (lead_time_days ** 0.5)


def reorder_point(avg_daily_usage: float, lead_time_days: float, safety_stock_val: float) -> float:
    if lead_time_days <= 0 or avg_daily_usage < 0:
        return safety_stock_val
    return (avg_daily_usage * lead_time_days) + safety_stock_val


def eoq(annual_demand: float, ordering_cost: float, holding_cost_per_unit: float) -> Optional[float]:
    if annual_demand <= 0 or ordering_cost <= 0 or holding_cost_per_unit <= 0:
        return None
    return sqrt((2 * annual_demand * ordering_cost) / holding_cost_per_unit)


def next_reorder_date_projection(current_stock: float, avg_daily_usage: float, rop: float):
    """Estimate days until stock falls below ROP (simple linear consumption)."""
    if avg_daily_usage <= 0:
        return 0
    # Days until stock reaches ROP threshold
    delta = current_stock - rop
    if delta <= 0:
        return 0
    return max(0, delta / avg_daily_usage)
