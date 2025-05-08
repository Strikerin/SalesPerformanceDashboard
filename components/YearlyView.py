import streamlit as st
import pandas as pd
import numpy as np
from datetime import datetime
import plotly.express as px
import plotly.graph_objects as go
from utils.formatters import format_number, format_money, format_percent
from components.charts import (
    create_quarterly_hours_chart,
    create_work_center_utilization_chart,
    create_customer_profitability_chart,
    create_profitability_pie_chart,
    create_monthly_trend_chart,
)

def set_viewing_year(year):
    """Set the current year view."""
    st.session_state['viewing_year'] = year
    st.rerun()

def yearly_view_component():
    """Display the yearly view dashboard."""
    # Get data from session state
    df = st.session_state['df']
    yearly_summary = st.session_state['yearly_summary']
    
    # Header with back button
    col1, col2 = st.columns([3, 1])
    with col1:
        st.title("📅 Yearly Work History")
    with col2:
        if st.button("🏠 Return to Dashboard"):
            st.session_state['current_page'] = 'dashboard'
            st.rerun()
    
    # Yearly overview table
    st.subheader("Yearly Performance Overview")
    
    if yearly_summary:
        # Convert to DataFrame for easier handling
        yearly_df = pd.DataFrame(yearly_summary)
        
        # Sort by year (descending)
        yearly_df = yearly_df.sort_values('year', ascending=False)
        
        # Format for display
        display_df = yearly_df.copy()
        
        # Format numeric columns
        for col in ['planned_hours', 'actual_hours', 'overrun_hours', 'ncr_hours']:
            if col in display_df.columns:
                display_df[col] = display_df[col].apply(lambda x: format_number(x))
        
        for col in ['planned_cost', 'actual_cost', 'overrun_cost']:
            if col in display_df.columns:
                display_df[col] = display_df[col].apply(lambda x: format_money(x))
        
        for col in ['job_count', 'operation_count', 'customer_count', 'unique_parts']:
            if col in display_df.columns:
                display_df[col] = display_df[col].apply(lambda x: format_number(x, 0))
        
        # Get selected year
        selected_year = st.session_state.get('viewing_year')
        
        # Get list of years for the selection box
        years = yearly_df['year'].unique().tolist()
        
        # Year selector (horizontal)
        year_cols = st.columns(len(years))
        for i, year in enumerate(sorted(years, reverse=True)):
            with year_cols[i]:
                # Highlight the selected year
                if year == selected_year:
                    st.markdown(f"""
                    <div style="text-align: center; padding: 10px; background-color: #1e40af; color: white; 
                               border-radius: 5px; cursor: pointer;" 
                         onclick="console.log('clicked')">
                        <h3 style="margin: 0;">{year}</h3>
                    </div>
                    """, unsafe_allow_html=True)
                else:
                    if st.button(year, key=f"year_btn_{year}", use_container_width=True):
                        set_viewing_year(year)
        
        # Display yearly table
        st.dataframe(
            display_df[['year', 'job_count', 'planned_hours', 'actual_hours', 'overrun_hours', 'planned_cost', 'actual_cost']],
            use_container_width=True,
            column_config={
                "year": "Year",
                "job_count": "Jobs",
                "planned_hours": "Planned Hours",
                "actual_hours": "Actual Hours", 
                "overrun_hours": "Overrun Hours",
                "planned_cost": "Planned Cost",
                "actual_cost": "Actual Cost"
            },
            hide_index=True
        )
        
        # If a year is selected, show detailed view
        if selected_year:
            # Filter data for the selected year
            if 'date' in df.columns:
                year_df = df[df['date'].dt.year == int(selected_year)].copy()
            else:
                year_df = pd.DataFrame()  # Empty dataframe if no date column
            
            if year_df.empty:
                st.warning(f"No data available for {selected_year}")
            else:
                st.subheader(f"Detailed Analysis for {selected_year}")
                
                # Calculate summary statistics for this year
                year_summary = yearly_df[yearly_df['year'] == selected_year].iloc[0].to_dict()
                
                # Summary metrics
                col1, col2, col3, col4, col5 = st.columns(5)
                
                with col1:
                    st.metric(
                        label="Planned Hours", 
                        value=format_number(year_summary.get('planned_hours', 0)),
                        delta=None
                    )
                
                with col2:
                    st.metric(
                        label="Actual Hours", 
                        value=format_number(year_summary.get('actual_hours', 0)),
                        delta=None
                    )
                
                with col3:
                    overrun_hours = year_summary.get('overrun_hours', 0)
                    planned_hours = year_summary.get('planned_hours', 1)  # Avoid division by zero
                    overrun_percent = overrun_hours / planned_hours * 100
                    
                    st.metric(
                        label="Overrun Hours", 
                        value=format_number(overrun_hours),
                        delta=f"{format_number(overrun_percent, 1)}% of planned" if overrun_hours > 0 else None,
                        delta_color="inverse"
                    )
                
                with col4:
                    st.metric(
                        label="Total Jobs", 
                        value=format_number(year_summary.get('job_count', 0), 0),
                        delta=None
                    )
                
                with col5:
                    st.metric(
                        label="NCR Hours", 
                        value=format_number(year_summary.get('ncr_hours', 0)),
                        delta=None
                    )
                
                # Quarterly breakdown
                st.subheader("Quarterly Breakdown")
                
                # Add quarter to the dataframe
                year_df['quarter'] = year_df['date'].dt.quarter
                
                # Group by quarter
                quarterly_data = year_df.groupby('quarter').agg({
                    'planned_hours': 'sum',
                    'actual_hours': 'sum',
                    'job_id': 'nunique'
                }).reset_index()
                
                quarterly_data['overrun_hours'] = quarterly_data['actual_hours'] - quarterly_data['planned_hours']
                quarterly_data['overrun_cost'] = quarterly_data['overrun_hours'] * 75  # Assuming $75/hour
                
                # Format quarters for display
                quarterly_data['quarter_label'] = quarterly_data['quarter'].apply(lambda q: f"Q{q}")
                
                # Sort by quarter
                quarterly_data = quarterly_data.sort_values('quarter')
                
                # Create quarterly hours chart
                quarterly_chart = create_quarterly_hours_chart(quarterly_data)
                
                col1, col2 = st.columns([3, 2])
                
                with col1:
                    st.plotly_chart(quarterly_chart, use_container_width=True)
                
                with col2:
                    # Quarterly data table
                    quarterly_display = quarterly_data[['quarter_label', 'planned_hours', 'actual_hours', 'overrun_hours', 'overrun_cost', 'job_id']].copy()
                    quarterly_display.columns = ['Quarter', 'Planned Hours', 'Actual Hours', 'Overrun Hours', 'Overrun Cost', 'Jobs']
                    
                    # Format the display values
                    quarterly_display['Planned Hours'] = quarterly_display['Planned Hours'].apply(lambda x: format_number(x))
                    quarterly_display['Actual Hours'] = quarterly_display['Actual Hours'].apply(lambda x: format_number(x))
                    quarterly_display['Overrun Hours'] = quarterly_display['Overrun Hours'].apply(lambda x: format_number(x))
                    quarterly_display['Overrun Cost'] = quarterly_display['Overrun Cost'].apply(lambda x: format_money(x))
                    quarterly_display['Jobs'] = quarterly_display['Jobs'].apply(lambda x: format_number(x, 0))
                    
                    st.dataframe(quarterly_display, use_container_width=True, hide_index=True)
                
                # Tabs for different analyses
                tab1, tab2, tab3 = st.tabs(["🏢 Work Centers", "👥 Customers", "📦 Parts"])
                
                with tab1:
                    if 'work_center' in year_df.columns:
                        # Group by work center
                        workcenter_data = year_df.groupby('work_center').agg({
                            'planned_hours': 'sum',
                            'actual_hours': 'sum',
                            'job_id': 'nunique'
                        }).reset_index()
                        
                        workcenter_data['overrun_hours'] = workcenter_data['actual_hours'] - workcenter_data['planned_hours']
                        workcenter_data['utilization'] = workcenter_data['actual_hours'] / workcenter_data['planned_hours'] * 100
                        
                        # Sort by actual hours
                        workcenter_data = workcenter_data.sort_values('actual_hours', ascending=False)
                        
                        # Create work center utilization chart
                        wc_chart = create_work_center_utilization_chart(workcenter_data)
                        
                        col1, col2 = st.columns([3, 2])
                        
                        with col1:
                            st.subheader("Work Center Utilization")
                            st.plotly_chart(wc_chart, use_container_width=True)
                        
                        with col2:
                            st.subheader("Work Center Details")
                            
                            # Format workcenter data for display
                            workcenter_display = workcenter_data[['work_center', 'planned_hours', 'actual_hours', 'overrun_hours', 'utilization', 'job_id']].copy()
                            workcenter_display.columns = ['Work Center', 'Planned Hours', 'Actual Hours', 'Overrun Hours', 'Utilization %', 'Jobs']
                            
                            # Format the display values
                            workcenter_display['Planned Hours'] = workcenter_display['Planned Hours'].apply(lambda x: format_number(x))
                            workcenter_display['Actual Hours'] = workcenter_display['Actual Hours'].apply(lambda x: format_number(x))
                            workcenter_display['Overrun Hours'] = workcenter_display['Overrun Hours'].apply(lambda x: format_number(x))
                            workcenter_display['Utilization %'] = workcenter_display['Utilization %'].apply(lambda x: f"{x:.1f}%")
                            workcenter_display['Jobs'] = workcenter_display['Jobs'].apply(lambda x: format_number(x, 0))
                            
                            st.dataframe(workcenter_display, use_container_width=True, hide_index=True)
                    else:
                        st.info("No work center data available.")
                
                with tab2:
                    if 'company' in year_df.columns:
                        # Group by customer (company)
                        customer_data = year_df.groupby('company').agg({
                            'planned_hours': 'sum',
                            'actual_hours': 'sum',
                            'job_id': 'nunique'
                        }).reset_index()
                        
                        customer_data['overrun_hours'] = customer_data['actual_hours'] - customer_data['planned_hours']
                        customer_data['overrun_percent'] = customer_data['overrun_hours'] / customer_data['planned_hours'] * 100
                        
                        # Calculate customer profitability
                        hourly_rate = 75  # Assuming $75/hour
                        customer_data['total_cost'] = customer_data['actual_hours'] * hourly_rate
                        customer_data['revenue'] = customer_data['total_cost'] * 1.3  # Assuming 30% markup
                        customer_data['profit'] = customer_data['revenue'] - customer_data['total_cost']
                        customer_data['profit_margin'] = customer_data['profit'] / customer_data['revenue'] * 100
                        
                        # Sort by profit margin (descending)
                        customer_data = customer_data.sort_values('profit_margin', ascending=False)
                        
                        # Create customer profitability chart
                        customer_chart = create_customer_profitability_chart(customer_data, 'profit_margin')
                        
                        col1, col2 = st.columns([3, 2])
                        
                        with col1:
                            st.subheader("Customer Profitability")
                            st.plotly_chart(customer_chart, use_container_width=True)
                        
                        with col2:
                            st.subheader("Customer Details")
                            
                            # Format customer data for display
                            customer_display = customer_data[['company', 'planned_hours', 'actual_hours', 'overrun_hours', 'profit_margin', 'job_id']].copy()
                            customer_display.columns = ['Customer', 'Planned Hours', 'Actual Hours', 'Overrun Hours', 'Profit Margin %', 'Jobs']
                            
                            # Format the display values
                            customer_display['Planned Hours'] = customer_display['Planned Hours'].apply(lambda x: format_number(x))
                            customer_display['Actual Hours'] = customer_display['Actual Hours'].apply(lambda x: format_number(x))
                            customer_display['Overrun Hours'] = customer_display['Overrun Hours'].apply(lambda x: format_number(x))
                            customer_display['Profit Margin %'] = customer_display['Profit Margin %'].apply(lambda x: f"{x:.1f}%")
                            customer_display['Jobs'] = customer_display['Jobs'].apply(lambda x: format_number(x, 0))
                            
                            st.dataframe(customer_display, use_container_width=True, hide_index=True)
                    else:
                        st.info("No customer data available.")
                
                with tab3:
                    if 'part' in year_df.columns:
                        # Group by part
                        part_data = year_df.groupby('part').agg({
                            'planned_hours': 'sum',
                            'actual_hours': 'sum',
                            'job_id': 'nunique'
                        }).reset_index()
                        
                        part_data['overrun_hours'] = part_data['actual_hours'] - part_data['planned_hours']
                        part_data['overrun_percent'] = part_data['overrun_hours'] / part_data['planned_hours'] * 100
                        
                        # Sort by overrun hours (descending)
                        part_data = part_data.sort_values('overrun_hours', ascending=False)
                        
                        # Top 10 parts by overrun
                        top_parts = part_data.head(10).copy()
                        
                        # Create part overrun chart
                        fig = go.Figure()
                        
                        fig.add_trace(go.Bar(
                            y=top_parts['part'],
                            x=top_parts['planned_hours'],
                            name='Planned Hours',
                            orientation='h',
                            marker_color='#1e40af'
                        ))
                        
                        fig.add_trace(go.Bar(
                            y=top_parts['part'],
                            x=top_parts['actual_hours'],
                            name='Actual Hours',
                            orientation='h',
                            marker_color='#dc2626'
                        ))
                        
                        fig.update_layout(
                            barmode='group',
                            height=400,
                            margin=dict(l=20, r=20, t=30, b=20),
                            legend=dict(
                                orientation="h",
                                yanchor="bottom",
                                y=1.02,
                                xanchor="right",
                                x=1
                            ),
                            xaxis_title="Hours",
                            yaxis_title="Part",
                            yaxis=dict(autorange="reversed")
                        )
                        
                        col1, col2 = st.columns([3, 2])
                        
                        with col1:
                            st.subheader("Top Parts by Overrun Hours")
                            st.plotly_chart(fig, use_container_width=True)
                        
                        with col2:
                            st.subheader("Part Details")
                            
                            # Format part data for display
                            part_display = part_data[['part', 'planned_hours', 'actual_hours', 'overrun_hours', 'overrun_percent', 'job_id']].copy().head(15)
                            part_display.columns = ['Part', 'Planned Hours', 'Actual Hours', 'Overrun Hours', 'Overrun %', 'Jobs']
                            
                            # Format the display values
                            part_display['Planned Hours'] = part_display['Planned Hours'].apply(lambda x: format_number(x))
                            part_display['Actual Hours'] = part_display['Actual Hours'].apply(lambda x: format_number(x))
                            part_display['Overrun Hours'] = part_display['Overrun Hours'].apply(lambda x: format_number(x))
                            part_display['Overrun %'] = part_display['Overrun %'].apply(lambda x: f"{x:.1f}%")
                            part_display['Jobs'] = part_display['Jobs'].apply(lambda x: format_number(x, 0))
                            
                            st.dataframe(part_display, use_container_width=True, hide_index=True)
                    else:
                        st.info("No part data available.")
    else:
        st.info("No yearly summary data available.")
