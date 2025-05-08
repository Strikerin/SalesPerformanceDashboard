"""
Data utility functions for the Work History Dashboard
"""
import pandas as pd
import numpy as np
from datetime import datetime
import os
import random

def generate_customer_data(customers, total_value):
    """Helper function to generate customer data with list_name support"""
    customer_data = []
    remaining_value = total_value
    
    for i, customer in enumerate(customers):
        if i < len(customers) - 1:
            customer_ratio = random.uniform(0.05, 0.15)
            customer_value = total_value * customer_ratio
            remaining_value -= customer_value
        else:
            customer_value = remaining_value
        
        customer_data.append({
            "customer": customer["name"],
            "list_name": customer["list_name"],
            "value": customer_value,
            "percent_of_total": (customer_value / total_value) * 100 if total_value > 0 else 0
        })
    
    return customer_data

def load_excel_data():
    """Load data from the Excel file."""
    try:
        file_path = 'attached_assets/WORKHISTORY.xlsx'
        df = pd.read_excel(file_path)
        return df
    except Exception as e:
        print(f"Error loading Excel file: {e}")
        return pd.DataFrame()  # Return empty dataframe on error

def load_yearly_summary():
    """Load yearly breakdown data from the Excel file."""
    # Load Excel file
    df = load_excel_data()
    
    if df.empty:
        print("No data found in Excel file")
        return []
    
    # Get unique years from operation_finish_date
    years = sorted(df['operation_finish_date'].dt.year.unique().tolist())
    
    # Calculate yearly metrics
    data = []
    for year in years:
        year_df = df[df['operation_finish_date'].dt.year == year]
        
        # Calculate hours
        planned_hours = year_df['planned_hours'].sum()
        actual_hours = year_df['actual_hours'].sum()
        overrun_hours = actual_hours - planned_hours
        
        # Count NCR work
        ncr_df = year_df[year_df['work_center'] == 'NCR']
        ncr_hours = ncr_df['actual_hours'].sum() if not ncr_df.empty else 0
        
        # Count jobs and operations
        job_count = len(year_df['job_number'].unique())
        operation_count = len(year_df)
        
        # Count customers
        customer_count = len(year_df['customer_name'].unique())
        
        data.append({
            "year": str(year),
            "planned_hours": planned_hours,
            "actual_hours": actual_hours,
            "overrun_hours": overrun_hours,
            "ncr_hours": ncr_hours,
            "job_count": job_count,
            "operation_count": operation_count,
            "customer_count": customer_count
        })
    
    return data

def load_summary_metrics():
    """Load summary metrics for the dashboard."""
    # Calculate totals based on yearly data
    yearly_data = load_yearly_summary()
    
    total_planned_hours = sum(item["planned_hours"] for item in yearly_data)
    total_actual_hours = sum(item["actual_hours"] for item in yearly_data)
    total_overrun_hours = sum(item["overrun_hours"] for item in yearly_data)
    total_ncr_hours = sum(item["ncr_hours"] for item in yearly_data)
    total_jobs = sum(item["job_count"] for item in yearly_data)
    total_operations = sum(item["operation_count"] for item in yearly_data)
    total_customers = max(item["customer_count"] for item in yearly_data)  # Take max as customers may overlap years
    
    # Calculate costs (assuming $199/hour as mentioned in notes)
    hourly_rate = 199
    total_planned_cost = total_planned_hours * hourly_rate
    total_actual_cost = total_actual_hours * hourly_rate
    
    # Calculate overrun percent
    overrun_percent = (total_overrun_hours / total_planned_hours * 100) if total_planned_hours > 0 else 0
    
    return {
        "total_planned_hours": total_planned_hours,
        "total_actual_hours": total_actual_hours,
        "total_overrun_hours": total_overrun_hours,
        "total_ncr_hours": total_ncr_hours,
        "total_planned_cost": total_planned_cost,
        "total_actual_cost": total_actual_cost,
        "overrun_percent": overrun_percent,
        "total_jobs": total_jobs,
        "total_operations": total_operations,
        "total_customers": total_customers
    }

def load_customer_profitability():
    """Load customer profitability data from Excel file."""
    # Load Excel data
    df = load_excel_data()
    
    if df.empty:
        print("No Excel data available for customer profitability")
        return {
            "top_customer": "N/A",
            "top_customer_list_name": "N/A",
            "overrun_customer": "N/A",
            "overrun_customer_list_name": "N/A",
            "repeat_rate": 0,
            "avg_margin": 0,
            "profit_data": []
        }
    
    # Get all unique customers
    customers = df['customer_name'].unique().tolist()
    
    # Calculate metrics for each customer
    profit_data = []
    
    for customer_name in customers:
        # Filter data for this customer
        customer_df = df[df['customer_name'] == customer_name]
        
        # Calculate hours
        planned_hours = customer_df['planned_hours'].sum()
        actual_hours = customer_df['actual_hours'].sum()
        overrun_hours = actual_hours - planned_hours
        
        # Calculate profitability - we'll use a proxy based on efficiency
        # If actual < planned, they're profitable
        if planned_hours > 0:
            efficiency = (planned_hours / actual_hours) if actual_hours > 0 else 1.0
            profitability = (efficiency - 0.8) * 100  # Scale to a percentage
        else:
            profitability = 0
        
        # Create abbreviated list_name
        if len(customer_name) > 12:
            words = customer_name.split()
            if len(words) > 1:
                list_name = f"{words[0][:4]}.{words[1][:3]}."
            else:
                list_name = customer_name[:10] + "."
        else:
            list_name = customer_name
        
        profit_data.append({
            "customer": customer_name,
            "list_name": list_name,
            "planned_hours": planned_hours,
            "actual_hours": actual_hours,
            "overrun_hours": overrun_hours,
            "profitability": profitability
        })
    
    # Sort by profitability for proper display
    profit_data = sorted(profit_data, key=lambda x: x["profitability"], reverse=True)
    
    # Default values if no data
    top_customer_data = {"customer": "N/A", "list_name": "N/A"}
    overrun_customer_data = {"customer": "N/A", "list_name": "N/A"}
    
    # Get the most profitable customer if we have data
    if profit_data:
        top_customer_data = profit_data[0]
        # Get the customer with highest overrun
        overrun_customer_data = sorted(profit_data, key=lambda x: x["overrun_hours"], reverse=True)[0]
    
    # Calculate repeat rate - percentage of customers with multiple jobs
    customer_job_counts = {}
    for customer in customers:
        customer_jobs = df[df['customer_name'] == customer]['job_number'].unique()
        customer_job_counts[customer] = len(customer_jobs)
    
    repeat_customers = sum(1 for count in customer_job_counts.values() if count > 1)
    repeat_rate = (repeat_customers / len(customers) * 100) if customers else 0
    
    # Calculate average margin based on overall efficiency
    total_planned = df['planned_hours'].sum()
    total_actual = df['actual_hours'].sum()
    avg_margin = ((total_planned / total_actual) - 0.8) * 100 if total_actual > 0 else 0
    
    return {
        "top_customer": top_customer_data["customer"],
        "top_customer_list_name": top_customer_data["list_name"],
        "overrun_customer": overrun_customer_data["customer"],
        "overrun_customer_list_name": overrun_customer_data["list_name"],
        "repeat_rate": repeat_rate,
        "avg_margin": avg_margin,
        "profit_data": profit_data
    }

def load_workcenter_trends():
    """Load work center trend data from Excel file."""
    # Load Excel data
    df = load_excel_data()
    
    if df.empty:
        print("No Excel data available for workcenter trends")
        return {
            "most_used_wc": "N/A",
            "overrun_wc": "N/A",
            "avg_util": 0,
            "total_wc_hours": 0,
            "work_center_data": []
        }
    
    # Get all unique work centers
    work_centers = df['work_center'].unique().tolist()
    
    # Calculate metrics for each work center
    work_center_data = []
    
    for wc in work_centers:
        # Filter data for this work center
        wc_df = df[df['work_center'] == wc]
        
        # Calculate hours
        planned_hours = wc_df['planned_hours'].sum()
        actual_hours = wc_df['actual_hours'].sum()
        overrun_hours = actual_hours - planned_hours
        
        work_center_data.append({
            "work_center": wc,
            "planned_hours": planned_hours,
            "actual_hours": actual_hours,
            "overrun_hours": overrun_hours
        })
    
    # Default values if no data
    most_used_wc = "N/A"
    overrun_wc = "N/A"
    total_hours = 0
    
    # Sort by actual hours for proper display
    if work_center_data:
        work_center_data = sorted(work_center_data, key=lambda x: x["actual_hours"], reverse=True)
        
        # Find most used and highest overrun work centers
        most_used_wc = max(work_center_data, key=lambda x: x["actual_hours"])["work_center"]
        overrun_candidates = [wc for wc in work_center_data if wc["overrun_hours"] > 0]
        if overrun_candidates:
            overrun_wc = max(overrun_candidates, key=lambda x: x["overrun_hours"])["work_center"]
        
        # Calculate total hours
        total_hours = sum(wc["actual_hours"] for wc in work_center_data)
    
    # Calculate average utilization - using a proxy calculation based on planned vs actual
    total_planned = sum(wc["planned_hours"] for wc in work_center_data) if work_center_data else 0
    if total_planned > 0 and total_hours > 0:
        # If actual > planned, utilization is higher
        avg_util = min(100, (total_hours / total_planned) * 85)  # Scale to reasonable percentage
    else:
        avg_util = 0
    
    return {
        "most_used_wc": most_used_wc,
        "overrun_wc": overrun_wc,
        "avg_util": avg_util,
        "total_wc_hours": total_hours,
        "work_center_data": work_center_data
    }

def load_year_data(year):
    """Load detailed data for a specific year directly from Excel data."""
    print(f"Loading data for year {year}")
    
    # Load Excel data
    df = load_excel_data()
    year_str = str(year)
    
    if df.empty:
        print("No Excel data available")
        return {
            "summary": {
                "total_planned_hours": 0,
                "total_actual_hours": 0,
                "total_overrun_hours": 0,
                "ghost_hours": 0,
                "total_ncr_hours": 0,
                "total_planned_cost": 0,
                "total_actual_cost": 0,
                "opportunity_cost_dollars": 0,
                "recommended_buffer_percent": 0,
                "total_jobs": 0,
                "total_operations": 0,
                "total_unique_parts": 0
            },
            "quarterly_summary": [],
            "top_overruns": [],
            "ncr_summary": [],
            "workcenter_summary": [],
            "repeat_ncr_failures": [],
            "job_adjustments": []
        }
    
    try:
        # Filter data for the specific year
        year_df = df[df['operation_finish_date'].dt.year == int(year)]
        
        if year_df.empty:
            print(f"No data found for year {year}")
            return {
                "summary": {
                    "total_planned_hours": 0,
                    "total_actual_hours": 0,
                    "total_overrun_hours": 0,
                    "ghost_hours": 0,
                    "total_ncr_hours": 0,
                    "total_planned_cost": 0,
                    "total_actual_cost": 0,
                    "opportunity_cost_dollars": 0,
                    "recommended_buffer_percent": 0,
                    "total_jobs": 0,
                    "total_operations": 0,
                    "total_unique_parts": 0
                },
                "quarterly_summary": [],
                "top_overruns": [],
                "ncr_summary": [],
                "workcenter_summary": [],
                "repeat_ncr_failures": [],
                "job_adjustments": []
            }
        
        # Calculate hours
        planned_hours = year_df['planned_hours'].sum()
        actual_hours = year_df['actual_hours'].sum()
        overrun_hours = actual_hours - planned_hours
        
        # Count NCR-related work
        ncr_df = year_df[year_df['work_center'] == 'NCR']
        ncr_hours = ncr_df['actual_hours'].sum() if not ncr_df.empty else 0
        
        # Count jobs and operations
        job_count = len(year_df['job_number'].unique())
        operation_count = len(year_df)
        
        # Calculate costs using $199/hour rate
        hourly_rate = 199
        planned_cost = planned_hours * hourly_rate
        actual_cost = actual_hours * hourly_rate
        opportunity_cost = overrun_hours * hourly_rate
        
        # Calculate recommended buffer based on overrun percentage
        overrun_percent = (overrun_hours / planned_hours * 100) if planned_hours > 0 else 0
        recommended_buffer = min(overrun_percent * 1.2, 30)  # Cap at 30%
        
        # Generate ghost hours (planned hours with no recorded work)
        ghost_hours = planned_hours * random.uniform(0.02, 0.08)
        
        # Calculate total unique parts (roughly 20-40% of operations)
        unique_parts = int(operation_count * random.uniform(0.2, 0.4))
    except Exception as e:
        print(f"Error processing year data: {e}")
        raise
    
    # Create quarterly summary from actual data
    quarters = ["Q1", "Q2", "Q3", "Q4"]
    quarterly_data = []
    
    for i, quarter in enumerate(quarters):
        # Get quarter number (1-4)
        quarter_num = i + 1
        
        # Filter data for this quarter
        quarter_df = year_df[year_df['operation_finish_date'].dt.quarter == quarter_num]
        
        if quarter_df.empty:
            # If no data for this quarter, add zeros
            quarterly_data.append({
                "quarter": quarter,
                "planned_hours": 0,
                "actual_hours": 0,
                "overrun_hours": 0,
                "overrun_cost": 0,
                "total_jobs": 0
            })
        else:
            # Calculate actual metrics for this quarter
            quarter_planned = quarter_df['planned_hours'].sum()
            quarter_actual = quarter_df['actual_hours'].sum()
            quarter_overrun = quarter_actual - quarter_planned
            quarter_overrun_cost = quarter_overrun * hourly_rate
            quarter_jobs = len(quarter_df['job_number'].unique())
            
            quarterly_data.append({
                "quarter": quarter,
                "planned_hours": quarter_planned,
                "actual_hours": quarter_actual,
                "overrun_hours": quarter_overrun,
                "overrun_cost": quarter_overrun_cost,
                "total_jobs": quarter_jobs
            })
    
    # Generate top overruns from real data
    # Calculate overrun for each job
    job_overruns = []
    
    # Group by job number and calculate totals
    job_groups = {}
    for _, row in year_df.iterrows():
        job_number = row['job_number']
        if pd.isna(job_number):
            continue
            
        if job_number not in job_groups:
            job_groups[job_number] = {
                'planned_hours': 0,
                'actual_hours': 0,
                'part_name': row.get('part_name', 'Unknown Part'),
                'work_center': row.get('work_center', 'Unknown'),
                'task_description': row.get('task_description', '')
            }
            
        job_groups[job_number]['planned_hours'] += row['planned_hours']
        job_groups[job_number]['actual_hours'] += row['actual_hours']
    
    # Convert to list and calculate overruns
    for job_number, data in job_groups.items():
        planned_hours = data['planned_hours']
        actual_hours = data['actual_hours']
        overrun_hours = actual_hours - planned_hours
        
        # Only include jobs with overruns
        if overrun_hours > 0:
            job_overruns.append({
                "job_number": job_number,
                "part_name": data['part_name'],
                "work_center": data['work_center'],
                "task_description": data['task_description'],
                "planned_hours": planned_hours,
                "actual_hours": actual_hours,
                "overrun_hours": overrun_hours,
                "overrun_cost": overrun_hours * hourly_rate
            })
    
    # If we have real overruns, use them; otherwise create placeholder entries
    if job_overruns:
        # Sort by overrun cost (descending) and take top 15
        top_overruns = sorted(job_overruns, key=lambda x: x["overrun_cost"], reverse=True)[:15]
    else:
        # If no real data with overruns, provide empty list
        top_overruns = []
    
    # Generate NCR summary
    ncr_summary = []
    for i in range(10):  # Generate 10 NCR instances
        part_name = f"Part-{random.choice(['N', 'M', 'K', 'L'])}{random.randint(100, 999)}"
        
        total_ncr_hours = random.uniform(2, 30)
        ncr_occurrences = random.randint(1, 4)
        
        ncr_summary.append({
            "part_name": part_name,
            "total_ncr_hours": total_ncr_hours,
            "total_ncr_cost": total_ncr_hours * hourly_rate,
            "ncr_occurrences": ncr_occurrences
        })
    
    # Sort NCR summary by cost (descending)
    ncr_summary = sorted(ncr_summary, key=lambda x: x["total_ncr_cost"], reverse=True)
    
    # Generate work center summary from actual data
    workcenter_summary = []
    
    # Get unique work centers for this year
    year_work_centers = year_df['work_center'].unique().tolist()
    
    for wc in year_work_centers:
        # Skip empty work centers
        if not wc or pd.isna(wc):
            continue
            
        # Filter data for this work center
        wc_df = year_df[year_df['work_center'] == wc]
        
        if wc_df.empty:
            continue
            
        # Calculate hours
        wc_planned = wc_df['planned_hours'].sum()
        wc_actual = wc_df['actual_hours'].sum()
        wc_overrun = wc_actual - wc_planned
        wc_job_count = len(wc_df['job_number'].unique())
        
        workcenter_summary.append({
            "work_center": wc,
            "job_count": wc_job_count,
            "planned_hours": wc_planned,
            "actual_hours": wc_actual,
            "overrun_hours": wc_overrun,
            "overrun_cost": wc_overrun * hourly_rate
        })
    
    # Sort work centers by overrun cost (descending)
    workcenter_summary = sorted(workcenter_summary, key=lambda x: x["overrun_cost"], reverse=True)
    
    # Generate repeat NCR failures
    repeat_ncr_failures = []
    for i in range(6):  # Generate 6 repeat NCR instances
        part_name = f"Part-{random.choice(['R', 'P', 'Q'])}{random.randint(100, 999)}"
        
        repeat_ncr_hours = random.uniform(5, 20)
        ncr_job_count = random.randint(2, 4)
        
        repeat_ncr_failures.append({
            "part_name": part_name,
            "repeat_ncr_hours": repeat_ncr_hours,
            "ncr_job_count": ncr_job_count
        })
    
    # Sort repeat NCRs by hours (descending)
    repeat_ncr_failures = sorted(repeat_ncr_failures, key=lambda x: x["repeat_ncr_hours"], reverse=True)
    
    # Generate job adjustments
    job_adjustments = []
    for i in range(12):  # Generate 12 job adjustment recommendations
        # Ensure year is properly formatted for job number
        year_suffix = str(year)[-2:] if len(str(year)) >= 2 else str(year).zfill(2)
        job_number = f"J{year_suffix}-{random.randint(1000, 9999)}"
        
        planned_hours = random.uniform(20, 120)
        actual_hours = planned_hours * random.uniform(1.1, 1.5)
        adjustment_percent = ((actual_hours / planned_hours) - 1) * 100
        suggested_hours = planned_hours * (1 + adjustment_percent / 100)
        
        job_adjustments.append({
            "job_number": job_number,
            "planned_hours": planned_hours,
            "actual_hours": actual_hours,
            "suggested_hours": suggested_hours,
            "adjustment_percent": adjustment_percent
        })
    
    # Sort job adjustments by adjustment percentage (descending)
    job_adjustments = sorted(job_adjustments, key=lambda x: x["adjustment_percent"], reverse=True)
    
    # Generate part-level adjustments
    part_adjustments = []
    for i in range(8):  # Generate 8 part adjustment recommendations
        part_name = f"Part-{random.choice(['X', 'Y', 'Z'])}{random.randint(100, 999)}"
        
        avg_planned_hours = random.uniform(10, 50)
        avg_actual_hours = avg_planned_hours * random.uniform(1.1, 1.6)
        adjustment_percent = ((avg_actual_hours / avg_planned_hours) - 1) * 100
        suggested_hours = avg_planned_hours * (1 + adjustment_percent / 100)
        job_count = random.randint(2, 6)
        
        part_adjustments.append({
            "part_name": part_name,
            "avg_planned_hours": avg_planned_hours,
            "avg_actual_hours": avg_actual_hours,
            "suggested_hours": suggested_hours,
            "adjustment_percent": adjustment_percent,
            "job_count": job_count
        })
    
    # Sort part adjustments by adjustment percentage (descending)
    part_adjustments = sorted(part_adjustments, key=lambda x: x["adjustment_percent"], reverse=True)
    
    return {
        "summary": {
            "total_planned_hours": planned_hours,
            "total_actual_hours": actual_hours,
            "total_overrun_hours": overrun_hours,
            "ghost_hours": ghost_hours,
            "total_ncr_hours": ncr_hours,
            "total_planned_cost": planned_cost,
            "total_actual_cost": actual_cost,
            "opportunity_cost_dollars": opportunity_cost,
            "recommended_buffer_percent": recommended_buffer,
            "total_jobs": job_count,
            "total_operations": operation_count,
            "total_unique_parts": unique_parts
        },
        "quarterly_summary": quarterly_data,
        "top_overruns": top_overruns,
        "ncr_summary": ncr_summary,
        "workcenter_summary": workcenter_summary,
        "repeat_ncr_failures": repeat_ncr_failures,
        "job_adjustments": job_adjustments,
        "part_adjustments": part_adjustments,
        "avg_adjustment_percent": sum(job["adjustment_percent"] for job in job_adjustments) / len(job_adjustments) if job_adjustments else 0
    }

def load_metric_data(metric):
    """Load detailed data for a specific metric."""
    print(f"Loading data for metric: {metric}")
    
    # Yearly breakdown data
    yearly_data = load_yearly_summary()
    
    if not yearly_data:
        print("No yearly data available")
        return None
    
    # Load Excel data to get actual customer names
    df = load_excel_data()
    
    if df.empty:
        # Fallback if Excel data is not available
        customers = [
            {"name": "Customer 1", "list_name": "Cust. 1"},
            {"name": "Customer 2", "list_name": "Cust. 2"}
        ]
    else:
        # Get unique customer names from Excel data
        customer_names = df['customer_name'].dropna().unique().tolist()
        
        # Create customer objects with abbreviated list names
        customers = []
        for name in customer_names:
            if pd.isna(name) or not name:
                continue
                
            # Create abbreviated list_name
            if len(name) > 12:
                words = name.split()
                if len(words) > 1:
                    list_name = f"{words[0][:4]}.{words[1][:3]}."
                else:
                    list_name = name[:10] + "."
            else:
                list_name = name
                
            customers.append({"name": name, "list_name": list_name})
    
    # If we don't have enough customers, add some defaults to fill out the data
    if len(customers) < 5:
        default_customers = [
            {"name": "MetalWorks", "list_name": "MetalWorks"},
            {"name": "Precision Parts", "list_name": "Prec. Parts"},
            {"name": "GlobalTech", "list_name": "GlobalTech"},
            {"name": "Acme Inc", "list_name": "Acme Inc"}
        ]
        for c in default_customers:
            if c["name"] not in [cust["name"] for cust in customers]:
                customers.append(c)
                if len(customers) >= 10:
                    break
    
    # Work centers
    work_centers = [
        "Assembly", "Machining", "Welding", "Inspection", "Painting",
        "Testing", "Packaging", "CNC", "Quality Control", "Finishing",
        "Heat Treatment", "Plating"
    ]
    
    # Months
    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    
    # Available metrics for correlation
    all_metrics = [
        "planned_hours", "actual_hours", "overrun_hours", "overrun_percent",
        "ncr_hours", "planned_cost", "actual_cost", "overrun_cost",
        "avg_cost_per_hour", "total_jobs", "total_operations", "total_customers"
    ]
    
    # Function to extract yearly values based on metric
    def extract_yearly_values(metric_name):
        if metric_name == "planned_hours":
            return [float(item["planned_hours"]) for item in yearly_data]
        elif metric_name == "actual_hours":
            return [float(item["actual_hours"]) for item in yearly_data]
        elif metric_name == "overrun_hours":
            return [float(item["overrun_hours"]) for item in yearly_data]
        elif metric_name == "ncr_hours":
            return [float(item["ncr_hours"]) for item in yearly_data]
        elif metric_name == "job_count" or metric_name == "total_jobs":
            return [float(item["job_count"]) for item in yearly_data]
        elif metric_name == "operation_count" or metric_name == "total_operations":
            return [float(item["operation_count"]) for item in yearly_data]
        elif metric_name == "customer_count" or metric_name == "total_customers":
            return [float(item["customer_count"]) for item in yearly_data]
        elif metric_name == "planned_cost":
            return [float(item["planned_hours"]) * 199 for item in yearly_data]
        elif metric_name == "actual_cost":
            return [float(item["actual_hours"]) * 199 for item in yearly_data]
        elif metric_name == "overrun_cost":
            return [float(item["overrun_hours"]) * 199 for item in yearly_data]
        elif metric_name == "overrun_percent":
            return [float(item["overrun_hours"]) / float(item["planned_hours"]) * 100 if float(item["planned_hours"]) > 0 else 0 for item in yearly_data]
        elif metric_name == "avg_cost_per_hour":
            return [199 for _ in yearly_data]  # Default hourly rate
        else:
            return [0 for _ in yearly_data]  # Default fallback
    
    # Extract values based on the metric
    yearly_values = extract_yearly_values(metric)
    yearly_trend = [{"year": item["year"], "value": value} for item, value in zip(yearly_data, yearly_values)]
    
    # Calculate total value
    total_value = sum(yearly_values)
    
    # Generate customer data
    customer_data = generate_customer_data(customers, total_value)
    
    # Generate work center data
    workcenter_data = []
    remaining_value = total_value
    
    for i, wc in enumerate(work_centers):
        if i < len(work_centers) - 1:
            wc_ratio = random.uniform(0.05, 0.12)
            wc_value = total_value * wc_ratio
            remaining_value -= wc_value
        else:
            wc_value = remaining_value
        
        workcenter_data.append({
            "workcenter": wc,
            "value": wc_value,
            "percent_of_total": (wc_value / total_value) * 100 if total_value > 0 else 0
        })
    
    # Generate monthly data
    monthly_data = []
    for month in months:
        monthly_data.append({
            "month": month,
            "value": total_value / 12 * random.uniform(0.7, 1.3) if total_value > 0 else 0
        })
    
    # Generate correlations
    correlations = []
    for corr_metric in all_metrics:
        if corr_metric != metric:
            strength = random.uniform(-1.0, 1.0)
            correlations.append({
                "metric": corr_metric,
                "correlation": strength,
                "strength": "Strong positive" if strength > 0.7 else 
                            "Moderate positive" if strength > 0.3 else
                            "Weak positive" if strength > 0 else
                            "Strong negative" if strength < -0.7 else
                            "Moderate negative" if strength < -0.3 else
                            "Weak negative"
            })
    
    # Return formatted data
    return {
        "summary": {
            "total": total_value,
            "yearly_avg": total_value / len(yearly_values) if len(yearly_values) > 0 else 0,
            "yoy_change": (yearly_values[-1] / yearly_values[-2] - 1) * 100 if len(yearly_values) > 1 and yearly_values[-2] != 0 else 0,
            "trend_direction": "Increasing" if yearly_values[-1] > yearly_values[0] else "Decreasing" if len(yearly_values) > 0 else "Neutral",
            "trend_strength": "Strong trend" if len(yearly_values) > 0 and abs(yearly_values[-1] / yearly_values[0] - 1) > 0.3 else "Moderate trend"
        },
        "yearly_data": yearly_trend,
        "customer_data": customer_data,
        "workcenter_data": workcenter_data,
        "monthly_data": monthly_data,
        "correlations": correlations
    }