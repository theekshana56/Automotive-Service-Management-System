#!/usr/bin/env python3
'''
Train ML models with MongoDB data
Run this script to train Prophet and Linear Regression models
'''

import sys
import os
sys.path.append('src')

from data_pipeline import MLDataPipeline
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def main():
    try:
        # Initialize pipeline
        pipeline = MLDataPipeline()
        
        # Check health
        health = pipeline.get_health_status()
        logger.info(f"Pipeline health: {health}")
        
        # Train models
        logger.info("Training models with MongoDB data...")
        success = pipeline.train_models(use_prophet=True)
        
        if success:
            logger.info("Model training completed successfully!")
            
            # Get statistics
            stats = pipeline.get_model_statistics()
            logger.info(f"Trained {stats['total_models']} models")
            
        else:
            logger.error("Model training failed")
            return 1
        
        return 0
        
    except Exception as e:
        logger.error(f"Training error: {e}")
        return 1
    finally:
        if 'pipeline' in locals():
            pipeline.close()

if __name__ == "__main__":
    exit(main())
