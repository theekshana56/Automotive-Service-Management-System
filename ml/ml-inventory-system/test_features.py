#!/usr/bin/env python3
"""
Test script to demonstrate all ML features
"""

import requests
import json
from datetime import datetime

def test_ml_features():
    base_url = "http://localhost:8001"
    
    print("🚀 ML Inventory System - Feature Testing")
    print("=" * 50)
    
    # 1. Health Check
    print("\n1. 🏥 Health Check")
    try:
        response = requests.get(f"{base_url}/health")
        health_data = response.json()
        print(f"✅ Status: {health_data['status']}")
        print(f"✅ Models Loaded: {health_data['models_loaded']}")
        print(f"✅ Available Parts: {len(health_data['available_parts'])}")
    except Exception as e:
        print(f"❌ Health check failed: {e}")
        return
    
    # 2. Predictive Analytics - 30-Day Forecasts
    print("\n2. 📈 Predictive Analytics - 30-Day Forecasts")
    try:
        response = requests.post(f"{base_url}/predict", json={
            "part_ids": ["ENG-001", "BAT-005"],
            "days": 7
        })
        predictions = response.json()
        
        for pred in predictions:
            print(f"\n📦 {pred['part_name']} ({pred['part_id']})")
            print("   Next 7 days predictions:")
            for day_pred in pred['predictions'][:7]:
                print(f"   {day_pred['date']}: {day_pred['predicted_usage']} units")
    except Exception as e:
        print(f"❌ Predictions failed: {e}")
    
    # 3. Seasonal Pattern Recognition
    print("\n3. 🔮 Seasonal Pattern Recognition")
    try:
        response = requests.post(f"{base_url}/predict", json={
            "part_ids": ["BAT-005", "RAD-009"],
            "days": 30
        })
        seasonal_data = response.json()
        
        for pred in seasonal_data:
            print(f"\n🌡️ {pred['part_name']} - Seasonal Analysis:")
            # Calculate average usage
            usages = [p['predicted_usage'] for p in pred['predictions']]
            avg_usage = sum(usages) / len(usages)
            print(f"   Average daily usage: {avg_usage:.1f} units")
            print(f"   Usage range: {min(usages):.1f} - {max(usages):.1f} units")
    except Exception as e:
        print(f"❌ Seasonal analysis failed: {e}")
    
    # 4. JIT Inventory Optimization - Reorder Points
    print("\n4. 📦 JIT Inventory Optimization - Reorder Points")
    try:
        response = requests.get(f"{base_url}/reorder-recommendations")
        reorder_data = response.json()
        
        print(f"✅ Total Parts: {reorder_data['total_parts']}")
        print(f"🚨 High Priority: {reorder_data['high_priority']}")
        
        print("\n📋 Reorder Recommendations:")
        for rec in reorder_data['recommendations'][:5]:
            print(f"   {rec['part_name']} ({rec['part_id']})")
            print(f"     Priority: {rec['priority']}")
            print(f"     Current Stock: {rec['current_stock']}")
            print(f"     Reorder Point: {rec['reorder_point']}")
            print(f"     Recommended Qty: {rec['recommended_order_quantity']:.0f}")
            print(f"     Days until reorder: {rec['days_until_reorder']}")
            print()
    except Exception as e:
        print(f"❌ Reorder recommendations failed: {e}")
    
    # 5. Economic Order Quantity (EOQ)
    print("\n5. 💰 Economic Order Quantity (EOQ)")
    try:
        response = requests.get(f"{base_url}/inventory-optimization")
        eoq_data = response.json()
        
        print(f"💰 Total Inventory Value: ${eoq_data['total_inventory_value']:,.2f}")
        print(f"📊 Annual Holding Cost: ${eoq_data['total_holding_cost_annual']:,.2f}")
        
        print("\n📈 EOQ Analysis (Top 5):")
        for insight in eoq_data['optimization_insights'][:5]:
            print(f"   {insight['part_name']}")
            print(f"     Inventory Value: ${insight['inventory_value']:,.2f}")
            print(f"     Annual Holding Cost: ${insight['holding_cost_annual']:,.2f}")
            print(f"     Annual Ordering Cost: ${insight['ordering_cost_annual']:,.2f}")
            if insight['insights']:
                print(f"     💡 Insights: {', '.join(insight['insights'])}")
            print()
    except Exception as e:
        print(f"❌ EOQ analysis failed: {e}")
    
    # 6. Safety Stock Optimization
    print("\n6. 🛡️ Safety Stock Optimization")
    try:
        response = requests.get(f"{base_url}/reorder-recommendations")
        safety_data = response.json()
        
        print("🛡️ Safety Stock Analysis:")
        for rec in safety_data['recommendations'][:5]:
            safety_stock = rec['reorder_point'] - (rec['current_stock'] - rec['recommended_order_quantity'])
            print(f"   {rec['part_name']}")
            print(f"     Safety Stock: {rec['safety_stock']:.1f} units")
            print(f"     Lead Time: {rec['lead_time_days']} days")
            print(f"     Service Level: 95%")
            print()
    except Exception as e:
        print(f"❌ Safety stock analysis failed: {e}")
    
    # 7. Lead Time Considerations
    print("\n7. ⏰ Lead Time Considerations")
    try:
        response = requests.get(f"{base_url}/model-stats")
        leadtime_data = response.json()
        
        print("⏰ Lead Time Analysis:")
        for model in leadtime_data['models'][:5]:
            print(f"   {model['part_name']} ({model['part_id']})")
            print(f"     Lead Time: {model['lead_time_days']} days")
            print(f"     Avg Usage: {model['avg_usage']:.1f} units/day")
            print(f"     Impact: {model['lead_time_days'] * model['avg_usage']:.1f} units during lead time")
            print()
    except Exception as e:
        print(f"❌ Lead time analysis failed: {e}")
    
    # 8. Priority Alerts
    print("\n8. 🚨 Priority Alerts (HIGH/MEDIUM/LOW)")
    try:
        response = requests.get(f"{base_url}/reorder-recommendations")
        priority_data = response.json()
        
        # Group by priority
        priorities = {"HIGH": [], "MEDIUM": [], "LOW": []}
        for rec in priority_data['recommendations']:
            priorities[rec['priority']].append(rec)
        
        for priority, items in priorities.items():
            if items:
                print(f"🚨 {priority} Priority ({len(items)} items):")
                for item in items[:3]:
                    print(f"   {item['part_name']} - Stock: {item['current_stock']}, Reorder: {item['reorder_point']}")
                print()
    except Exception as e:
        print(f"❌ Priority analysis failed: {e}")
    
    # 9. Cost Optimization Insights
    print("\n9. 💵 Cost Optimization Insights")
    try:
        response = requests.get(f"{base_url}/inventory-optimization")
        cost_data = response.json()
        
        print("💵 Cost Optimization Summary:")
        print(f"   Total Inventory Value: ${cost_data['total_inventory_value']:,.2f}")
        print(f"   Annual Holding Cost: ${cost_data['total_holding_cost_annual']:,.2f}")
        
        # Find most expensive items
        expensive_items = sorted(cost_data['optimization_insights'], 
                               key=lambda x: x['inventory_value'], reverse=True)[:3]
        
        print("\n💰 Most Expensive Inventory Items:")
        for item in expensive_items:
            print(f"   {item['part_name']}: ${item['inventory_value']:,.2f}")
            if item['insights']:
                print(f"     💡 {item['insights'][0]}")
        print()
    except Exception as e:
        print(f"❌ Cost optimization failed: {e}")
    
    # 10. Model Performance Metrics
    print("\n10. 📈 Model Performance Metrics")
    try:
        response = requests.get(f"{base_url}/model-stats")
        stats_data = response.json()
        
        print("📈 Model Performance Summary:")
        total_mae = sum(model['mae'] for model in stats_data['models'])
        total_rmse = sum(model['rmse'] for model in stats_data['models'])
        avg_mae = total_mae / len(stats_data['models'])
        avg_rmse = total_rmse / len(stats_data['models'])
        
        print(f"   Average MAE: {avg_mae:.2f} (lower is better)")
        print(f"   Average RMSE: {avg_rmse:.2f} (lower is better)")
        print(f"   Total Models: {stats_data['total_models']}")
        
        print("\n🏆 Best Performing Models (lowest MAE):")
        best_models = sorted(stats_data['models'], key=lambda x: x['mae'])[:3]
        for model in best_models:
            print(f"   {model['part_name']}: MAE={model['mae']:.2f}, RMSE={model['rmse']:.2f}")
        print()
    except Exception as e:
        print(f"❌ Model performance analysis failed: {e}")
    
    print("🎉 Feature testing completed!")
    print("\n📖 For detailed testing instructions, see: TESTING_GUIDE.md")
    print("🌐 Web interface available at: http://localhost:8001/docs")

if __name__ == "__main__":
    test_ml_features()
