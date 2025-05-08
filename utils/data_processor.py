import pandas as pd
import numpy as np
import io
from datetime import datetime

def parse_date(date_value):
    """Parse a date value from various formats."""
    # If null or None, return None
    if pd.isna(date_value) or date_value is None:
        return None
    
    # If it's already a datetime, return it
    if isinstance(date_value, (datetime, pd.Timestamp)):
        return date_value
    
    # If it's a string, try various formats
    if isinstance(date_value, str):
        date_value = date_value.strip()
        
        # Try common date formats
        for fmt in ['%Y-%m-%d', '%m/%d/%Y', '%d/%m/%Y', '%m-%d-%Y', '%d-%m-%Y', '%d.%m.%Y']:
            try:
                return pd.to_datetime(date_value, format=fmt)
            except (ValueError, TypeError):
                continue
    
    # If it's a numeric value, try to interpret as Excel date
    if isinstance(date_value, (int, float)):
        try:
            # Excel's epoch is 1900-01-01 (for Windows, 1904-01-01 for Mac)
            # But due to a bug in Excel, it thinks 1900 was a leap year
            # This means dates after Feb 28, 1900 are off by 1 day
            
            # Adjust for Excel's leap year bug
            if date_value > 60:  # If after the fictional Feb 29, 1900
                date_value -= 1
                
            # Convert to datetime
            # Excel day 1 = January 1, 1900
            return pd.Timestamp('1900-01-01') + pd.Timedelta(days=int(date_value - 1))
        except:
            pass
    
    # Fall back to pandas parsing
    try:
        return pd.to_datetime(date_value)
    except:
        return None

def normalize_column_name(name):
    """Normalize column names to handle case and whitespace variations."""
    if isinstance(name, str):
        return name.lower().replace(' ', '').replace('_', '').replace('-', '')
    return ''

def map_columns(df):
    """Map columns in the DataFrame to standardized names."""
    # Dictionary of possible names for each column type
    column_mappings = {
        'company': ['company', 'listname', 'name', 'customer', 'companyname', 
                   'custname', 'customername', 'shiptoparty', 'soldtoparty', 'client', 'clientname'],
        'job_id': ['salesdocument', 'order', 'jobid', 'job', 'project', 
                 'salesorder', 'salesdoc', 'sonumber', 'ordernumber', 'po', 'ponumber', 'purchaseorder'],
        'work_center': ['operworkcenter', 'workcenter', 'workcenter', 'workcenter', 
                      'wrkctr', 'workctr', 'resource', 'productionline', 'operation', 'manufacturing'],
        'part': ['oprshorttext', 'partid', 'part', 'material', 
               'matnumber', 'partnumber', 'materialnumber', 'item', 
               'operation', 'description', 'itemdescription', 'productid'],
        'planned_hours': ['work', 'plannedhours', 'plannedhours', 'targetqty', 
                        'planhours', 'standardhours', 'estimatedhours', 
                        'targethour', 'normtime', 'planned', 'plan', 'target'],
        'actual_hours': ['actualwork', 'actualhours', 'actualhours', 
                       'acthours', 'actualhour', 'confirmedhours', 'confwork', 
                       'yield', 'actual', 'actuals', 'real'],
        'date': ['basicfindate', 'date', 'finishdate', 'confirmdate', 
               'actualfinish', 'confirmationdate', 'createdon', 'entrydate',
               'orderdate', 'podate', 'transactiondate']
    }
    
    # Normalize all column names in the dataframe
    df_columns = {col: normalize_column_name(col) for col in df.columns}
    
    # Normalize all possible column names in our mapping
    normalized_mappings = {}
    for key, values in column_mappings.items():
        normalized_mappings[key] = [normalize_column_name(val) for val in values]
    
    # Create a mapping from original columns to our standardized names
    column_map = {}
    for std_name, possible_names in normalized_mappings.items():
        for orig_col, norm_col in df_columns.items():
            if norm_col in possible_names:
                column_map[orig_col] = std_name
                break
    
    # Apply the mapping to rename columns
    renamed_df = df.rename(columns=column_map)
    
    # Ensure we have at least planned and actual hours columns
    required_cols = ['planned_hours', 'actual_hours']
    missing_cols = [col for col in required_cols if col not in renamed_df.columns]
    
    if missing_cols:
        # Try to infer missing columns based on other available data
        for col in missing_cols:
            if col == 'planned_hours' and 'actual_hours' in renamed_df.columns:
                # If we have actual but not planned, create a proxy planned column
                renamed_df['planned_hours'] = renamed_df['actual_hours'] * 0.9  # Assume planned is 90% of actual as placeholder
            elif col == 'actual_hours' and 'planned_hours' in renamed_df.columns:
                # If we have planned but not actual, create a proxy actual column
                renamed_df['actual_hours'] = renamed_df['planned_hours'] * 1.1  # Assume actual is 110% of planned as placeholder
    
    # Parse date column if it exists
    if 'date' in renamed_df.columns:
        renamed_df['date'] = renamed_df['date'].apply(parse_date)
    
    return renamed_df

def load_excel_data(file):
    """Load data from an Excel file and return a DataFrame with standardized columns."""
    try:
        # Read the Excel file
        xls = pd.ExcelFile(file)
        
        # If multiple sheets, use the first one with substantial data
        sheet_data = []
        for sheet_name in xls.sheet_names:
            df = pd.read_excel(xls, sheet_name)
            if len(df) > 10:  # Only consider sheets with at least 10 rows
                sheet_data.append((sheet_name, len(df), df))
        
        # Sort by number of rows (descending)
        sheet_data.sort(key=lambda x: x[1], reverse=True)
        
        if not sheet_data:
            return None
        
        # Use the sheet with the most rows
        _, _, df = sheet_data[0]
        
        # Map columns to standardized names
        df = map_columns(df)
        
        # Drop completely empty rows
        df = df.dropna(how='all')
        
        # Generate pseudo job_id if it doesn't exist
        if 'job_id' not in df.columns and len(df) > 0:
            df['job_id'] = [f"JOB{i+1:06d}" for i in range(len(df))]
        
        return df
    
    except Exception as e:
        print(f"Error loading Excel file: {e}")
        return None

def process_data(df):
    """Process the imported data and generate summary statistics."""
    # Make a copy to avoid modifying the original
    data = df.copy()
    
    # Calculate derived fields
    data['overrun_hours'] = data['actual_hours'] - data['planned_hours']
    
    # Estimate cost based on a standard rate of $75/hour if not provided
    hourly_rate = 75
    if 'hourly_rate' not in data.columns:
        data['hourly_rate'] = hourly_rate
    
    data['planned_cost'] = data['planned_hours'] * data['hourly_rate']
    data['actual_cost'] = data['actual_hours'] * data['hourly_rate']
    data['overrun_cost'] = data['overrun_hours'] * data['hourly_rate']
    
    # Yearly summary
    yearly_summary = []
    if 'date' in data.columns:
        # Convert date column to datetime if not already
        if not pd.api.types.is_datetime64_dtype(data['date']):
            data['date'] = pd.to_datetime(data['date'], errors='coerce')
        
        # Add year column
        data['year'] = data['date'].dt.year
        
        # Group by year
        yearly_data = data.groupby('year').agg({
            'planned_hours': 'sum',
            'actual_hours': 'sum',
            'planned_cost': 'sum',
            'actual_cost': 'sum',
            'job_id': 'nunique',
            'company': lambda x: len(x.unique()) if 'company' in data.columns else 0,
            'part': lambda x: len(x.unique()) if 'part' in data.columns else 0
        }).reset_index()
        
        # Calculate overrun hours and costs
        yearly_data['overrun_hours'] = yearly_data['actual_hours'] - yearly_data['planned_hours']
        yearly_data['overrun_cost'] = yearly_data['actual_cost'] - yearly_data['planned_cost']
        
        # Calculate NCR hours (assume 10% of overrun hours are NCR-related)
        yearly_data['ncr_hours'] = yearly_data['overrun_hours'] * 0.1
        
        # Add operation count (use 5x job count as proxy if not available)
        yearly_data['operation_count'] = yearly_data['job_id'] * 5
        
        # Rename columns for consistency
        yearly_data = yearly_data.rename(columns={
            'company': 'customer_count',
            'part': 'unique_parts',
            'job_id': 'job_count'
        })
        
        # Convert year to string for easier display
        yearly_data['year'] = yearly_data['year'].astype(str)
        
        yearly_summary = yearly_data.to_dict('records')
    
    # Quarterly summary
    quarterly_summary = []
    if 'date' in data.columns:
        # Add quarter column
        data['quarter'] = data['date'].dt.quarter
        
        # Group by year and quarter
        quarterly_data = data.groupby(['year', 'quarter']).agg({
            'planned_hours': 'sum',
            'actual_hours': 'sum',
            'planned_cost': 'sum',
            'actual_cost': 'sum',
            'job_id': 'nunique'
        }).reset_index()
        
        # Calculate overrun hours and costs
        quarterly_data['overrun_hours'] = quarterly_data['actual_hours'] - quarterly_data['planned_hours']
        quarterly_data['overrun_cost'] = quarterly_data['actual_cost'] - quarterly_data['planned_cost']
        
        quarterly_summary = quarterly_data.to_dict('records')
    
    # Customer data
    customer_data = []
    if 'company' in data.columns:
        customer_stats = data.groupby('company').agg({
            'planned_hours': 'sum',
            'actual_hours': 'sum',
            'planned_cost': 'sum',
            'actual_cost': 'sum',
            'job_id': 'nunique'
        }).reset_index()
        
        # Calculate overrun hours and costs
        customer_stats['overrun_hours'] = customer_stats['actual_hours'] - customer_stats['planned_hours']
        customer_stats['overrun_cost'] = customer_stats['actual_cost'] - customer_stats['planned_cost']
        customer_stats['overrun_percent'] = (customer_stats['overrun_hours'] / customer_stats['planned_hours'] * 100)
        
        # Calculate profitability metrics
        customer_stats['revenue'] = customer_stats['actual_cost'] * 1.3  # Assume revenue is 130% of cost
        customer_stats['profit'] = customer_stats['revenue'] - customer_stats['actual_cost']
        customer_stats['profit_margin'] = customer_stats['profit'] / customer_stats['revenue']
        
        customer_data = customer_stats.to_dict('records')
    
    # Work center data
    workcenter_data = []
    if 'work_center' in data.columns:
        workcenter_stats = data.groupby('work_center').agg({
            'planned_hours': 'sum',
            'actual_hours': 'sum',
            'planned_cost': 'sum',
            'actual_cost': 'sum',
            'job_id': 'nunique'
        }).reset_index()
        
        # Calculate overrun hours and costs
        workcenter_stats['overrun_hours'] = workcenter_stats['actual_hours'] - workcenter_stats['planned_hours']
        workcenter_stats['overrun_cost'] = workcenter_stats['actual_cost'] - workcenter_stats['planned_cost']
        workcenter_stats['utilization'] = (workcenter_stats['actual_hours'] / workcenter_stats['planned_hours'] * 100)
        
        workcenter_data = workcenter_stats.to_dict('records')
    
    # Part data
    part_data = []
    if 'part' in data.columns:
        part_stats = data.groupby('part').agg({
            'planned_hours': 'sum',
            'actual_hours': 'sum',
            'planned_cost': 'sum',
            'actual_cost': 'sum',
            'job_id': 'nunique'
        }).reset_index()
        
        # Calculate overrun hours and costs
        part_stats['overrun_hours'] = part_stats['actual_hours'] - part_stats['planned_hours']
        part_stats['overrun_cost'] = part_stats['actual_cost'] - part_stats['planned_cost']
        part_stats['overrun_percent'] = (part_stats['overrun_hours'] / part_stats['planned_hours'] * 100)
        
        part_data = part_stats.to_dict('records')
    
    return yearly_summary, quarterly_summary, customer_data, workcenter_data, part_data

def get_summary_stats(df):
    """Calculate summary statistics from a DataFrame."""
    summary = {}
    
    if df is None or df.empty:
        return summary
    
    # Basic metrics
    summary['total_planned_hours'] = df['planned_hours'].sum()
    summary['total_actual_hours'] = df['actual_hours'].sum()
    summary['total_overrun_hours'] = df['actual_hours'].sum() - df['planned_hours'].sum()
    
    # Estimate cost based on a standard rate of $75/hour if not provided
    hourly_rate = 75
    if 'hourly_rate' not in df.columns:
        df['hourly_rate'] = hourly_rate
    
    summary['total_planned_cost'] = (df['planned_hours'] * df['hourly_rate']).sum()
    summary['total_actual_cost'] = (df['actual_hours'] * df['hourly_rate']).sum()
    
    # Count metrics
    if 'job_id' in df.columns:
        summary['total_jobs'] = df['job_id'].nunique()
    else:
        summary['total_jobs'] = len(df)
    
    # Calculate profit metrics (assuming revenue is 130% of cost)
    revenue = summary['total_actual_cost'] * 1.3
    cost = summary['total_actual_cost']
    profit = revenue - cost
    summary['profit_margin'] = profit / revenue if revenue > 0 else 0
    
    return summary
