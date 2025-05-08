import streamlit as st
import pandas as pd
import numpy as np
from datetime import datetime
import plotly.express as px
import plotly.graph_objects as go
from utils.formatters import format_number, format_money, format_percent
from components.charts import (
    create_monthly_trend_chart,
    create_customer_profitability_chart,
    create_work_center_utilization_chart,
    create_quarterly_hours_chart,
    create_profitability_pie_chart,
)

def filter_data(df, selected_year, selected_customer, selected_work_center, date_range):
    """Filter data based on selected filters."""
    filtered_df = df.copy()
    
    # Apply filters
    if selected_year != "All":
        if 'date' in filtered_df.columns:
            filtered_df = filtered_df[filtered_df['date'].dt.year == selected_year]
    
    if selected_customer != "All":
        if 'company' in filtered_df.columns:
            filtered_df = filtered_df[filtered_df['company'] == selected_customer]
    
    if selected_work_center != "All":
        if 'work_center' in filtered_df.columns:
            filtered_df = filtered_df[filtered_df['work_center'] == selected_work_center]
    
    start_date, end_date = date_range
    if start_date and end_date:
        if 'date' in filtered_df.columns:
            filtered_df = filtered_df[(filtered_df['date'] >= pd.Timestamp(start_date)) & 
                                    (filtered_df['date'] <= pd.Timestamp(end_date))]
    
    return filtered_df

def dashboard_filters_sidebar():
    """Display filter options in the sidebar."""
    st.sidebar.subheader("Filters")
    
    df = st.session_state['df']
    
    # Year filter
    if 'date' in df.columns:
        years = sorted(df['date'].dt.year.unique(), reverse=True)
        selected_year = st.sidebar.selectbox("Select Year", ["All"] + list(years), index=0)
        st.session_state['selected_year'] = selected_year
    else:
        selected_year = "All"
    
    # Customer filter
    if 'company' in df.columns:
        customers = sorted(df['company'].unique())
        selected_customer = st.sidebar.selectbox("Select Customer", ["All"] + list(customers), index=0)
        st.session_state['selected_customer'] = selected_customer
    else:
        selected_customer = "All"
    
    # Work center filter
    if 'work_center' in df.columns:
        work_centers = sorted(df['work_center'].unique())
        selected_work_center = st.sidebar.selectbox("Select Work Center", ["All"] + list(work_centers), index=0)
        st.session_state['selected_work_center'] = selected_work_center
    else:
        selected_work_center = "All"
    
    # Date range filter
    date_range = st.sidebar.date_input("Select Date Range", value=[], help="Leave empty for all dates")
    if len(date_range) == 2:
        st.session_state['date_range'] = tuple(date_range)
    else:
        st.session_state['date_range'] = (None, None)
    
    # Apply filters button
    if st.sidebar.button("Apply Filters"):
        st.rerun()
    
    return selected_year, selected_customer, selected_work_center, st.session_state['date_range']

def dashboard_component():
    """Display the main dashboard."""
    st.title("📊 Work History Overview")
    
    # Get data
    df = st.session_state['df']
    
    # Get filters
    selected_year = st.session_state.get('selected_year', "All")
    selected_customer = st.session_state.get('selected_customer', "All")
    selected_work_center = st.session_state.get('selected_work_center', "All")
    date_range = st.session_state.get('date_range', (None, None))
    
    # Apply filters
    filtered_df = filter_data(df, selected_year, selected_customer, selected_work_center, date_range)
    
    # Calculate summary for filtered data
    from components.ImportData import get_summary_stats
    summary = get_summary_stats(filtered_df)
    
    # Show active filters if any are applied
    active_filters = []
    if selected_year != "All":
        active_filters.append(f"Year: {selected_year}")
    if selected_customer != "All":
        active_filters.append(f"Customer: {selected_customer}")
    if selected_work_center != "All":
        active_filters.append(f"Work Center: {selected_work_center}")
    if date_range[0] and date_range[1]:
        active_filters.append(f"Date: {date_range[0].strftime('%Y-%m-%d')} to {date_range[1].strftime('%Y-%m-%d')}")
    
    if active_filters:
        st.info(f"Filtered by: {', '.join(active_filters)}")
    
    # Summary metrics row
    col1, col2, col3, col4, col5 = st.columns(5)
    
    with col1:
        st.metric(
            label="Planned Hours", 
            value=format_number(summary.get('total_planned_hours', 0)),
            delta=None
        )
    
    with col2:
        st.metric(
            label="Actual Hours", 
            value=format_number(summary.get('total_actual_hours', 0)),
            delta=None
        )
    
    with col3:
        overrun_hours = summary.get('total_overrun_hours', 0)
        st.metric(
            label="Overrun Hours", 
            value=format_number(overrun_hours),
            delta=f"{format_percent(overrun_hours / summary.get('total_planned_hours', 1))} of planned" if overrun_hours > 0 else None,
            delta_color="inverse"
        )
    
    with col4:
        st.metric(
            label="Total Jobs", 
            value=format_number(summary.get('total_jobs', 0), 0),
            delta=None
        )
    
    with col5:
        profit_margin = summary.get('profit_margin', 0) * 100
        st.metric(
            label="Profit Margin", 
            value=f"{format_number(profit_margin, 1)}%",
            delta=None
        )
    
    # Income and Expenses Row
    st.subheader("Financial Summary")
    col1, col2 = st.columns(2)
    
    with col1:
        st.markdown("### Income")
        income = summary.get('total_actual_cost', 0)
        planned_income = summary.get('total_planned_cost', 0)
        income_delta = income - planned_income
        income_delta_pct = (income_delta / planned_income * 100) if planned_income > 0 else 0
        
        st.markdown(f"""
        <div style="display: flex; align-items: center;">
            <h3 style="margin: 0;">{format_money(income)}</h3>
            <span style="margin-left: 10px; background-color: {'#d4edda' if income_delta_pct >= 0 else '#f8d7da'}; 
                        color: {'#155724' if income_delta_pct >= 0 else '#721c24'}; 
                        padding: 2px 6px; border-radius: 3px;">
                {'+' if income_delta_pct >= 0 else ''}{format_number(income_delta_pct, 1)}%
            </span>
        </div>
        <p style="color: #6c757d; font-size: 0.9rem; margin-top: 5px;">Compared to planned revenue</p>
        """, unsafe_allow_html=True)
    
    with col2:
        st.markdown("### Expenses")
        # Simulate expenses as 60% of income for this example
        expenses = income * 0.6
        planned_expenses = planned_income * 0.55
        expense_delta = expenses - planned_expenses
        expense_delta_pct = (expense_delta / planned_expenses * 100) if planned_expenses > 0 else 0
        
        st.markdown(f"""
        <div style="display: flex; align-items: center;">
            <h3 style="margin: 0;">{format_money(expenses)}</h3>
            <span style="margin-left: 10px; background-color: {'#f8d7da' if expense_delta_pct > 0 else '#d4edda'}; 
                        color: {'#721c24' if expense_delta_pct > 0 else '#155724'}; 
                        padding: 2px 6px; border-radius: 3px;">
                {'+' if expense_delta_pct >= 0 else ''}{format_number(expense_delta_pct, 1)}%
            </span>
        </div>
        <p style="color: #6c757d; font-size: 0.9rem; margin-top: 5px;">Compared to planned expenses</p>
        """, unsafe_allow_html=True)
    
    # Car Availability Section (adapted from the uploaded dashboard)
    st.subheader("Car Availability")
    
    # Create a sample table for demonstration
    car_data = {
        "Car ID": ["6482", "5823", "9201"],
        "Name": ["Alex Nelson", "David Johnson", "Luke North"],
        "Status": ["Completed", "Pending", "Booked"],
        "Earning": ["$35.44", "$0.00", "$23.50"]
    }
    car_df = pd.DataFrame(car_data)
    
    # Display the table with appropriate styling
    st.dataframe(
        car_df,
        column_config={
            "Status": st.column_config.Column(
                "Status",
                help="Current status of the car",
                width="medium"
            ),
            "Earning": st.column_config.Column(
                "Earning",
                help="Amount earned",
                width="small"
            )
        },
        hide_index=True
    )
    
    # Monthly Trend Chart
    st.subheader("Planned vs. Actual Hours")
    
    if 'date' in filtered_df.columns and not filtered_df.empty:
        monthly_chart = create_monthly_trend_chart(filtered_df)
        st.plotly_chart(monthly_chart, use_container_width=True)
    else:
        st.info("No date data available for monthly trend chart.")
    
    # Customer and Work Center Analysis
    st.subheader("Performance Analysis")
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.markdown("### Customer Profitability")
        
        if 'company' in filtered_df.columns and not filtered_df.empty:
            # Group by company
            customer_data = filtered_df.groupby('company').agg({
                'planned_hours': 'sum',
                'actual_hours': 'sum',
                'job_id': 'nunique'
            }).reset_index()
            
            customer_data['overrun_hours'] = customer_data['actual_hours'] - customer_data['planned_hours']
            customer_data['overrun_percent'] = customer_data['overrun_hours'] / customer_data['planned_hours'] * 100
            
            # Calculate profitability metrics
            hourly_rate = 75  # Assuming $75/hour
            customer_data['total_cost'] = customer_data['actual_hours'] * hourly_rate
            customer_data['revenue'] = customer_data['total_cost'] * 1.3  # Assuming 30% markup
            customer_data['profit'] = customer_data['revenue'] - customer_data['total_cost']
            customer_data['profit_margin'] = customer_data['profit'] / customer_data['revenue'] * 100
            
            # Create chart
            customer_chart = create_customer_profitability_chart(customer_data, 'profit_margin')
            st.plotly_chart(customer_chart, use_container_width=True)
        else:
            st.info("No customer data available for profitability analysis.")
    
    with col2:
        st.markdown("### Work Center Utilization")
        
        if 'work_center' in filtered_df.columns and not filtered_df.empty:
            # Group by work_center
            workcenter_data = filtered_df.groupby('work_center').agg({
                'planned_hours': 'sum',
                'actual_hours': 'sum',
                'job_id': 'nunique'
            }).reset_index()
            
            workcenter_data['utilization'] = workcenter_data['actual_hours'] / workcenter_data['planned_hours'] * 100
            
            # Create chart
            wc_chart = create_work_center_utilization_chart(workcenter_data)
            st.plotly_chart(wc_chart, use_container_width=True)
        else:
            st.info("No work center data available for utilization analysis.")
    
    # Quarterly breakdown
    st.subheader("Quarterly Performance")
    
    if 'date' in filtered_df.columns and not filtered_df.empty:
        # Extract quarter information
        filtered_df['quarter'] = filtered_df['date'].dt.quarter
        filtered_df['year'] = filtered_df['date'].dt.year
        
        # Group by quarter
        quarterly_data = filtered_df.groupby(['year', 'quarter']).agg({
            'planned_hours': 'sum',
            'actual_hours': 'sum',
            'job_id': 'nunique'
        }).reset_index()
        
        quarterly_data['overrun_hours'] = quarterly_data['actual_hours'] - quarterly_data['planned_hours']
        quarterly_data['overrun_percent'] = quarterly_data['overrun_hours'] / quarterly_data['planned_hours'] * 100
        quarterly_data['quarter_label'] = quarterly_data.apply(lambda x: f"Q{x['quarter']} {x['year']}", axis=1)
        
        # Sort chronologically
        quarterly_data = quarterly_data.sort_values(['year', 'quarter'])
        
        # Create quarterly hours chart
        quarterly_chart = create_quarterly_hours_chart(quarterly_data)
        st.plotly_chart(quarterly_chart, use_container_width=True)
        
        # Quarterly data table
        st.markdown("### Quarterly Breakdown")
        
        quarterly_display = quarterly_data[['quarter_label', 'planned_hours', 'actual_hours', 'overrun_hours', 'overrun_percent', 'job_id']].copy()
        quarterly_display.columns = ['Quarter', 'Planned Hours', 'Actual Hours', 'Overrun Hours', 'Overrun %', 'Total Jobs']
        
        # Format the display values
        quarterly_display['Planned Hours'] = quarterly_display['Planned Hours'].apply(lambda x: format_number(x))
        quarterly_display['Actual Hours'] = quarterly_display['Actual Hours'].apply(lambda x: format_number(x))
        quarterly_display['Overrun Hours'] = quarterly_display['Overrun Hours'].apply(lambda x: format_number(x))
        quarterly_display['Overrun %'] = quarterly_display['Overrun %'].apply(lambda x: f"{x:.1f}%")
        quarterly_display['Total Jobs'] = quarterly_display['Total Jobs'].apply(lambda x: format_number(x, 0))
        
        st.dataframe(quarterly_display, use_container_width=True, hide_index=True)
    else:
        st.info("No date data available for quarterly breakdown.")
    
    # Top overruns table
    st.markdown("### Top Overruns")
    
    if not filtered_df.empty:
        # Calculate overrun hours and cost
        filtered_df['overrun_hours'] = filtered_df['actual_hours'] - filtered_df['planned_hours']
        
        # Only show jobs with overruns
        overrun_jobs = filtered_df[filtered_df['overrun_hours'] > 0].copy()
        
        if not overrun_jobs.empty:
            # Sort by overrun hours
            overrun_jobs = overrun_jobs.sort_values('overrun_hours', ascending=False).head(10)
            
            # Prepare display columns
            display_cols = ['job_id', 'company', 'part', 'work_center', 'planned_hours', 'actual_hours', 'overrun_hours']
            col_names = ['Job ID', 'Customer', 'Part', 'Work Center', 'Planned Hours', 'Actual Hours', 'Overrun Hours']
            
            # Filter to only available columns
            available_cols = [col for col in display_cols if col in overrun_jobs.columns]
            display_names = [col_names[display_cols.index(col)] for col in available_cols]
            
            top_overruns = overrun_jobs[available_cols].copy()
            top_overruns.columns = display_names
            
            # Format numeric columns
            for col in ['Planned Hours', 'Actual Hours', 'Overrun Hours']:
                if col in top_overruns.columns:
                    top_overruns[col] = top_overruns[col].apply(lambda x: format_number(x))
            
            st.dataframe(top_overruns, use_container_width=True, hide_index=True)
        else:
            st.info("No overrun jobs found in the current selection.")
    else:
        st.info("No data available for overrun analysis.")
