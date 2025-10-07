"""Standalone retraining script (placeholder for future Mongo integration)."""
import argparse
import os
from dotenv import load_dotenv

from .train_baseline import train_models

load_dotenv()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--data', default=os.environ.get('DATA_PATH', 'data/dataset.csv'))
    args = ap.parse_args()
    md = train_models(args.data)
    print(f"Retrained {len(md['models'])} part models.")


if __name__ == '__main__':
    main()
