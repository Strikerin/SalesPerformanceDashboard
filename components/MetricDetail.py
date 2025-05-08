import streamlit as st
import pandas as pd
import numpy as np
from datetime import datetime
import plotly.express as px
import plotly.graph_objects as go
from utils.formatters import format_number, format_money, format_percent
from components.charts import (
    create_overrun_analysis_chart,
    create_customer_profitability_chart,
    create_work_center_utilization_chart,
    create_yearly_trends_chart,
    create_profitability_pie_chart,
)

def set_selected_metric(metric):
    """Set the selected metric."""
    st.session_state['selected_metric'] = metric
    st.rerun()

def metric_detail_component():
    """Display the metric detail view."""
    # Get data
    df = st.session_state['df']
    
    # Header with back button
    col1, col2 = st.columns([3, 1])
    with col1:
        st.title("🔍 Metric Detail View")
    with col2:
        if st.button("🏠 Return to Dashboard"):
            st.session_state['current_page'] = 'dashboard'
            st.rerun()
    
    # Metric selector
    metric_labels = {
        "overrun_analysis": "⚠️ Overrun Analysis",
        "customer_profitability": "💰 Customer Profitability",
        "work_center_performance": "🏭 Work Center Performance",
        "yearly_trends": "📈 Yearly Trends",
        "ncr_analysis": "🔄 NCR Analysis"
    }
    
    metric_options = list(metric_labels.keys())
    selected_metric = st.session_state.get('selected_metric')
    
    # Horizontal metric selector
    st.write("### Select a Metric")
    
    metric_cols = st.columns(len(metric_options))
    for i, metric in enumerate(metric_options):
        with metric_cols[i]:
            # Highlight the selected metric
            if metric == selected_metric:
                st.markdown(f"""
                <div style="text-align: center; padding: 10px; background-color: #1e40af; color: white; 
                           border-radius: 5px; cursor: pointer;" 
                     onclick="console.log('clicked')">
                    <h5 style="margin: 0;">{metric_labels[metric]}</h5>
                </div>
                """, unsafe_allow_html=True)
            else:
                if st.button(metric_labels[metric], key=f"metric_btn_{metric}", use_container_width=True):
                    set_selected_metric(metric)
    
    # Display content based on selected metric
    if selected_metric:
        st.markdown(f"## {metric_labels[selected_metric]}")
        
        if selected_metric == "overrun_analysis":
            # Calculate overrun hours
            df['overrun_hours'] = df['actual_hours'] - df['planned_hours']
            
            # Only show jobs with overruns
            overrun_jobs = df[df['overrun_hours'] > 0].copy()
            
            if not overrun_jobs.empty:
                # Overall overrun statistics
                total_planned = df['planned_hours'].sum()
                total_actual = df['actual_hours'].sum()
                total_overrun = total_actual - total_planned
                overrun_percent = (total_overrun / total_planned) * 100 if total_planned > 0 else 0
                
                # Display summary metrics
                col1, col2, col3 = st.columns(3)
                
                with col1:
                    st.metric(
                        label="Total Overrun Hours", 
                        value=format_number(total_overrun),
                        delta=None
                    )
                
                with col2:
                    st.metric(
                        label="Overrun Percentage", 
                        value=f"{format_number(overrun_percent, 1)}%",
                        delta=None,
                        delta_color="inverse"
                    )
                
                with col3:
                    # Estimate overrun cost at $75/hour
                    overrun_cost = total_overrun * 75
                    st.metric(
                        label="Estimated Overrun Cost", 
                        value=format_money(overrun_cost),
                        delta=None,
                        delta_color="inverse"
                    )
                
                # Different overrun visualizations
                tab1, tab2, tab3 = st.tabs(["By Job", "By Work Center", "By Month"])
                
                with tab1:
                    # Top overrun jobs
                    st.subheader("Top Overrun Jobs")
                    
                    # Create chart
                    job_chart = create_overrun_analysis_chart(overrun_jobs, by='job')
                    st.plotly_chart(job_chart, use_container_width=True)
                    
                    # Detailed table
                    display_cols = ['job_id', 'company', 'part', 'work_center', 'planned_hours', 'actual_hours', 'overrun_hours']
                    col_names = ['Job ID', 'Customer', 'Part', 'Work Center', 'Planned Hours', 'Actual Hours', 'Overrun Hours']
                    
                    # Filter to only available columns
                    available_cols = [col for col in display_cols if col in overrun_jobs.columns]
                    display_names = [col_names[display_cols.index(col)] for col in available_cols]
                    
                    # Sort and get top overruns
                    top_overruns = overrun_jobs.sort_values('overrun_hours', ascending=False).head(10)
                    
                    job_overruns = top_overruns[available_cols].copy()
                    job_overruns.columns = display_names
                    
                    # Format numeric columns
                    for col in ['Planned Hours', 'Actual Hours', 'Overrun Hours']:
                        if col in job_overruns.columns:
                            job_overruns[col] = job_overruns[col].apply(lambda x: format_number(x))
                    
                    st.dataframe(job_overruns, use_container_width=True, hide_index=True)
                
                with tab2:
                    # Work center overruns
                    if 'work_center' in overrun_jobs.columns:
                        st.subheader("Overruns by Work Center")
                        
                        # Create chart
                        wc_chart = create_overrun_analysis_chart(overrun_jobs, by='work_center')
                        st.plotly_chart(wc_chart, use_container_width=True)
                        
                        # Group by work center
                        wc_overruns = overrun_jobs.groupby('work_center').agg({
                            'planned_hours': 'sum',
                            'actual_hours': 'sum',
                            'overrun_hours': 'sum',
                            'job_id': 'nunique'
                        }).reset_index()
                        
                        # Calculate overrun percentage
                        wc_overruns['overrun_percent'] = wc_overruns['overrun_hours'] / wc_overruns['planned_hours'] * 100
                        
                        # Sort by overrun hours
                        wc_overruns = wc_overruns.sort_values('overrun_hours', ascending=False)
                        
                        # Detailed table
                        wc_display = wc_overruns.copy()
                        wc_display.columns = ['Work Center', 'Planned Hours', 'Actual Hours', 'Overrun Hours', 'Job Count', 'Overrun %']
                        
                        # Format numeric columns
                        wc_display['Planned Hours'] = wc_display['Planned Hours'].apply(lambda x: format_number(x))
                        wc_display['Actual Hours'] = wc_display['Actual Hours'].apply(lambda x: format_number(x))
                        wc_display['Overrun Hours'] = wc_display['Overrun Hours'].apply(lambda x: format_number(x))
                        wc_display['Job Count'] = wc_display['Job Count'].apply(lambda x: format_number(x, 0))
                        wc_display['Overrun %'] = wc_display['Overrun %'].apply(lambda x: f"{x:.1f}%")
                        
                        st.dataframe(wc_display, use_container_width=True, hide_index=True)
                    else:
                        st.info("No work center data available for overrun analysis.")
                
                with tab3:
                    # Monthly overruns
                    if 'date' in overrun_jobs.columns:
                        st.subheader("Overruns by Month")
                        
                        # Extract month information
                        overrun_jobs['month'] = overrun_jobs['date'].dt.strftime('%b %Y')
                        
                        # Create chart
                        month_chart = create_overrun_analysis_chart(overrun_jobs, by='month')
                        st.plotly_chart(month_chart, use_container_width=True)
                        
                        # Group by month
                        monthly_overruns = overrun_jobs.groupby('month').agg({
                            'planned_hours': 'sum',
                            'actual_hours': 'sum',
                            'overrun_hours': 'sum',
                            'job_id': 'nunique'
                        }).reset_index()
                        
                        # Calculate overrun percentage
                        monthly_overruns['overrun_percent'] = monthly_overruns['overrun_hours'] / monthly_overruns['planned_hours'] * 100
                        
                        # Sort chronologically
                        try:
                            month_order = pd.to_datetime(monthly_overruns['month'], format='%b %Y').sort_values().index
                            monthly_overruns = monthly_overruns.iloc[month_order]
                        except:
                            # If sorting fails, use as-is
                            pass
                        
                        # Detailed table
                        monthly_display = monthly_overruns.copy()
                        monthly_display.columns = ['Month', 'Planned Hours', 'Actual Hours', 'Overrun Hours', 'Job Count', 'Overrun %']
                        
                        # Format numeric columns
                        monthly_display['Planned Hours'] = monthly_display['Planned Hours'].apply(lambda x: format_number(x))
                        monthly_display['Actual Hours'] = monthly_display['Actual Hours'].apply(lambda x: format_number(x))
                        monthly_display['Overrun Hours'] = monthly_display['Overrun Hours'].apply(lambda x: format_number(x))
                        monthly_display['Job Count'] = monthly_display['Job Count'].apply(lambda x: format_number(x, 0))
                        monthly_display['Overrun %'] = monthly_display['Overrun %'].apply(lambda x: f"{x:.1f}%")
                        
                        st.dataframe(monthly_display, use_container_width=True, hide_index=True)
                    else:
                        st.info("No date data available for monthly overrun analysis.")
            else:
                st.info("No overrun jobs found in the dataset.")
        
        elif selected_metric == "customer_profitability":
            if 'company' in df.columns:
                # Group by customer (company)
                customer_data = df.groupby('company').agg({
                    'planned_hours': 'sum',
                    'actual_hours': 'sum',
                    'job_id': 'nunique'
                }).reset_index()
                
                customer_data['overrun_hours'] = customer_data['actual_hours'] - customer_data['planned_hours']
                
                # Calculate customer profitability
                hourly_rate = 75  # Assuming $75/hour
                customer_data['total_cost'] = customer_data['actual_hours'] * hourly_rate
                customer_data['revenue'] = customer_data['total_cost'] * 1.3  # Assuming 30% markup
                customer_data['profit'] = customer_data['revenue'] - customer_data['total_cost']
                customer_data['profit_margin'] = customer_data['profit'] / customer_data['revenue'] * 100
                
                # Calculate metrics
                total_profit = customer_data['profit'].sum()
                avg_profit_margin = customer_data['profit_margin'].mean()
                
                # Display summary metrics
                col1, col2, col3 = st.columns(3)
                
                with col1:
                    st.metric(
                        label="Total Customers", 
                        value=len(customer_data),
                        delta=None
                    )
                
                with col2:
                    st.metric(
                        label="Total Profit", 
                        value=format_money(total_profit),
                        delta=None
                    )
                
                with col3:
                    st.metric(
                        label="Average Profit Margin", 
                        value=f"{format_number(avg_profit_margin, 1)}%",
                        delta=None
                    )
                
                # Different customer profitability visualizations
                tab1, tab2 = st.tabs(["Profit Margin", "Total Profit"])
                
                with tab1:
                    st.subheader("Customer Profitability by Margin")
                    
                    # Create profitability chart
                    margin_chart = create_customer_profitability_chart(customer_data, 'profit_margin')
                    st.plotly_chart(margin_chart, use_container_width=True)
                    
                    # Display as table
                    margin_sorted = customer_data.sort_values('profit_margin', ascending=False)
                    margin_display = margin_sorted.copy()
                    margin_display.columns = ['Customer', 'Planned Hours', 'Actual Hours', 'Job Count', 'Overrun Hours', 
                                             'Total Cost', 'Revenue', 'Profit', 'Profit Margin %']
                    
                    # Format numeric columns
                    margin_display['Planned Hours'] = margin_display['Planned Hours'].apply(lambda x: format_number(x))
                    margin_display['Actual Hours'] = margin_display['Actual Hours'].apply(lambda x: format_number(x))
                    margin_display['Overrun Hours'] = margin_display['Overrun Hours'].apply(lambda x: format_number(x))
                    margin_display['Job Count'] = margin_display['Job Count'].apply(lambda x: format_number(x, 0))
                    margin_display['Total Cost'] = margin_display['Total Cost'].apply(lambda x: format_money(x))
                    margin_display['Revenue'] = margin_display['Revenue'].apply(lambda x: format_money(x))
                    margin_display['Profit'] = margin_display['Profit'].apply(lambda x: format_money(x))
                    margin_display['Profit Margin %'] = margin_display['Profit Margin %'].apply(lambda x: f"{x:.1f}%")
                    
                    # Select specific columns for display
                    display_columns = ['Customer', 'Job Count', 'Actual Hours', 'Total Cost', 'Revenue', 'Profit', 'Profit Margin %']
                    st.dataframe(margin_display[display_columns], use_container_width=True, hide_index=True)
                
                with tab2:
                    st.subheader("Customer Profitability by Total Profit")
                    
                    # Create total profit chart
                    profit_chart = create_customer_profitability_chart(customer_data, 'profit')
                    st.plotly_chart(profit_chart, use_container_width=True)
                    
                    # Display as pie chart - top 10 vs others
                    profit_sorted = customer_data.sort_values('profit', ascending=False)
                    pie_chart = create_profitability_pie_chart(profit_sorted, 'profit', 'company', "Profit Distribution by Customer")
                    
                    col1, col2 = st.columns([3, 2])
                    
                    with col1:
                        st.subheader("Profit Distribution by Customer")
                        st.plotly_chart(pie_chart, use_container_width=True)
                    
                    with col2:
                        # Display statistics
                        st.subheader("Profitability Statistics")
                        
                        # Calculate stats
                        profitable_customers = len(customer_data[customer_data['profit'] > 0])
                        profitable_percent = profitable_customers / len(customer_data) * 100
                        
                        unprofitable_customers = len(customer_data[customer_data['profit'] <= 0])
                        unprofitable_percent = unprofitable_customers / len(customer_data) * 100
                        
                        top10_profit = profit_sorted.head(10)['profit'].sum()
                        top10_percent = top10_profit / total_profit * 100 if total_profit > 0 else 0
                        
                        st.markdown(f"""
                        - **Profitable Customers:** {profitable_customers} ({format_number(profitable_percent, 1)}%)
                        - **Unprofitable Customers:** {unprofitable_customers} ({format_number(unprofitable_percent, 1)}%)
                        - **Top 10 Customers:** {format_number(top10_percent, 1)}% of total profit
                        - **Highest Margin:** {format_number(customer_data['profit_margin'].max(), 1)}%
                        - **Lowest Margin:** {format_number(customer_data['profit_margin'].min(), 1)}%
                        """)
            else:
                st.info("No customer data available for profitability analysis.")
        
        elif selected_metric == "work_center_performance":
            if 'work_center' in df.columns:
                # Group by work center
                wc_data = df.groupby('work_center').agg({
                    'planned_hours': 'sum',
                    'actual_hours': 'sum',
                    'job_id': 'nunique'
                }).reset_index()
                
                # Calculate derived metrics
                wc_data['overrun_hours'] = wc_data['actual_hours'] - wc_data['planned_hours']
                wc_data['utilization'] = wc_data['actual_hours'] / wc_data['planned_hours'] * 100
                
                # Sort by total hours
                wc_data = wc_data.sort_values('actual_hours', ascending=False)
                
                # Calculate metrics
                total_workcenters = len(wc_data)
                avg_utilization = wc_data['utilization'].mean()
                overrun_workcenters = len(wc_data[wc_data['overrun_hours'] > 0])
                
                # Display summary metrics
                col1, col2, col3 = st.columns(3)
                
                with col1:
                    st.metric(
                        label="Total Work Centers", 
                        value=total_workcenters,
                        delta=None
                    )
                
                with col2:
                    st.metric(
                        label="Average Utilization", 
                        value=f"{format_number(avg_utilization, 1)}%",
                        delta=None
                    )
                
                with col3:
                    overrun_percent = overrun_workcenters / total_workcenters * 100
                    st.metric(
                        label="Work Centers with Overruns", 
                        value=f"{overrun_workcenters} ({format_number(overrun_percent, 1)}%)",
                        delta=None,
                        delta_color="inverse"
                    )
                
                # Different work center visualizations
                tab1, tab2, tab3 = st.tabs(["Utilization", "Hours Distribution", "Efficiency Ranking"])
                
                with tab1:
                    st.subheader("Work Center Utilization")
                    
                    # Create work center utilization chart
                    wc_chart = create_work_center_utilization_chart(wc_data)
                    st.plotly_chart(wc_chart, use_container_width=True)
                    
                    # Distribution of utilization
                    fig = px.histogram(
                        wc_data,
                        x='utilization',
                        nbins=20,
                        labels={'utilization': 'Utilization %'},
                        color_discrete_sequence=['#1e40af']
                    )
                    
                    fig.add_shape(
                        type="line",
                        x0=100,
                        y0=0,
                        x1=100,
                        y1=wc_data['utilization'].value_counts().max() * 1.1 if not wc_data.empty else 10,
                        line=dict(
                            color="red",
                            width=2,
                            dash="dash",
                        )
                    )
                    
                    fig.update_layout(
                        height=300,
                        margin=dict(l=20, r=20, t=30, b=20),
                        xaxis_title="Utilization %",
                        yaxis_title="Number of Work Centers",
                    )
                    
                    st.plotly_chart(fig, use_container_width=True)
                
                with tab2:
                    st.subheader("Hours Distribution by Work Center")
                    
                    # Create hours distribution chart
                    fig = go.Figure()
                    
                    # Use only top 10 work centers for the chart
                    top_wc = wc_data.head(10)
                    
                    fig.add_trace(go.Bar(
                        x=top_wc['work_center'],
                        y=top_wc['planned_hours'],
                        name='Planned Hours',
                        marker_color='#1e40af'
                    ))
                    
                    fig.add_trace(go.Bar(
                        x=top_wc['work_center'],
                        y=top_wc['actual_hours'],
                        name='Actual Hours',
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
                        xaxis_title="Work Center",
                        yaxis_title="Hours",
                    )
                    
                    st.plotly_chart(fig, use_container_width=True)
                    
                    # Pie chart of hours distribution
                    pie_chart = create_profitability_pie_chart(wc_data, 'actual_hours', 'work_center', "Distribution of Actual Hours")
                    st.plotly_chart(pie_chart, use_container_width=True)
                
                with tab3:
                    st.subheader("Work Center Efficiency Ranking")
                    
                    # Create efficiency ranking table
                    efficiency_data = wc_data.copy()
                    
                    # Sort by utilization (most efficient to least efficient)
                    efficiency_data = efficiency_data.sort_values('utilization')
                    
                    # Label work centers by efficiency
                    def efficiency_label(utilization):
                        if utilization <= 90:
                            return "Excellent (Under 90%)"
                        elif utilization <= 100:
                            return "Good (90-100%)"
                        elif utilization <= 110:
                            return "Fair (100-110%)"
                        elif utilization <= 125:
                            return "Poor (110-125%)"
                        else:
                            return "Critical (Over 125%)"
                    
                    efficiency_data['efficiency_category'] = efficiency_data['utilization'].apply(efficiency_label)
                    
                    # Group by efficiency category
                    category_counts = efficiency_data['efficiency_category'].value_counts().reset_index()
                    category_counts.columns = ['Category', 'Count']
                    
                    # Sort categories in a meaningful order
                    category_order = [
                        "Excellent (Under 90%)",
                        "Good (90-100%)",
                        "Fair (100-110%)",
                        "Poor (110-125%)",
                        "Critical (Over 125%)"
                    ]
                    category_counts['Category'] = pd.Categorical(category_counts['Category'], 
                                                               categories=category_order, 
                                                               ordered=True)
                    category_counts = category_counts.sort_values('Category')
                    
                    # Color mapping
                    color_map = {
                        "Excellent (Under 90%)": '#4caf50',
                        "Good (90-100%)": '#8bc34a',
                        "Fair (100-110%)": '#ffc107',
                        "Poor (110-125%)": '#ff9800',
                        "Critical (Over 125%)": '#f44336'
                    }
                    
                    # Create bar chart
                    fig = go.Figure()
                    
                    fig.add_trace(go.Bar(
                        x=category_counts['Category'],
                        y=category_counts['Count'],
                        marker_color=[color_map.get(cat, '#1e40af') for cat in category_counts['Category']],
                        text=category_counts['Count'],
                        textposition='outside'
                    ))
                    
                    fig.update_layout(
                        height=400,
                        margin=dict(l=20, r=20, t=30, b=20),
                        xaxis_title="Efficiency Category",
                        yaxis_title="Number of Work Centers",
                    )
                    
                    st.plotly_chart(fig, use_container_width=True)
                    
                    # Display as table
                    wc_display = efficiency_data.copy()
                    wc_display.columns = ['Work Center', 'Planned Hours', 'Actual Hours', 'Job Count', 
                                         'Overrun Hours', 'Utilization %', 'Efficiency Category']
                    
                    # Format numeric columns
                    wc_display['Planned Hours'] = wc_display['Planned Hours'].apply(lambda x: format_number(x))
                    wc_display['Actual Hours'] = wc_display['Actual Hours'].apply(lambda x: format_number(x))
                    wc_display['Overrun Hours'] = wc_display['Overrun Hours'].apply(lambda x: format_number(x))
                    wc_display['Job Count'] = wc_display['Job Count'].apply(lambda x: format_number(x, 0))
                    wc_display['Utilization %'] = wc_display['Utilization %'].apply(lambda x: f"{x:.1f}%")
                    
                    st.dataframe(wc_display, use_container_width=True, hide_index=True)
            else:
                st.info("No work center data available for performance analysis.")
        
        elif selected_metric == "yearly_trends":
            if 'date' in df.columns:
                # Extract year from date
                df['year'] = df['date'].dt.year
                
                # Group by year
                yearly_data = df.groupby('year').agg({
                    'planned_hours': 'sum',
                    'actual_hours': 'sum',
                    'job_id': 'nunique'
                }).reset_index()
                
                # Calculate derived metrics
                yearly_data['overrun_hours'] = yearly_data['actual_hours'] - yearly_data['planned_hours']
                yearly_data['overrun_percent'] = yearly_data['overrun_hours'] / yearly_data['planned_hours'] * 100
                
                # Calculate cost metrics (assuming $75/hour)
                hourly_rate = 75
                yearly_data['total_cost'] = yearly_data['actual_hours'] * hourly_rate
                
                # Sort chronologically
                yearly_data = yearly_data.sort_values('year')
                
                # Display trends
                st.subheader("Yearly Performance Trends")
                
                # Create yearly trends chart
                yearly_chart = create_yearly_trends_chart(yearly_data)
                st.plotly_chart(yearly_chart, use_container_width=True)
                
                # Create year-over-year comparison
                col1, col2 = st.columns(2)
                
                with col1:
                    st.subheader("Job Count Trend")
                    
                    fig = go.Figure()
                    
                    fig.add_trace(go.Bar(
                        x=yearly_data['year'],
                        y=yearly_data['job_id'],
                        marker_color='#1e40af',
                        text=yearly_data['job_id'].apply(lambda x: format_number(x, 0)),
                        textposition='outside'
                    ))
                    
                    # Calculate year-over-year growth
                    yearly_data['job_growth'] = yearly_data['job_id'].pct_change() * 100
                    
                    # Add growth indicators
                    for i in range(1, len(yearly_data)):
                        growth = yearly_data['job_growth'].iloc[i]
                        year = yearly_data['year'].iloc[i]
                        color = 'green' if growth >= 0 else 'red'
                        arrow = '▲' if growth >= 0 else '▼'
                        
                        fig.add_annotation(
                            x=year,
                            y=yearly_data['job_id'].iloc[i],
                            text=f"{arrow} {abs(growth):.1f}%",
                            showarrow=False,
                            yshift=25,
                            font=dict(
                                color=color,
                                size=12
                            )
                        )
                    
                    fig.update_layout(
                        height=350,
                        margin=dict(l=20, r=20, t=30, b=20),
                        xaxis_title="Year",
                        yaxis_title="Number of Jobs",
                    )
                    
                    st.plotly_chart(fig, use_container_width=True)
                
                with col2:
                    st.subheader("Cost Trend")
                    
                    fig = go.Figure()
                    
                    fig.add_trace(go.Bar(
                        x=yearly_data['year'],
                        y=yearly_data['total_cost'],
                        marker_color='#1e40af',
                        text=yearly_data['total_cost'].apply(lambda x: format_money(x)),
                        textposition='outside'
                    ))
                    
                    # Calculate year-over-year growth
                    yearly_data['cost_growth'] = yearly_data['total_cost'].pct_change() * 100
                    
                    # Add growth indicators
                    for i in range(1, len(yearly_data)):
                        growth = yearly_data['cost_growth'].iloc[i]
                        year = yearly_data['year'].iloc[i]
                        color = 'green' if growth >= 0 else 'red'
                        arrow = '▲' if growth >= 0 else '▼'
                        
                        fig.add_annotation(
                            x=year,
                            y=yearly_data['total_cost'].iloc[i],
                            text=f"{arrow} {abs(growth):.1f}%",
                            showarrow=False,
                            yshift=25,
                            font=dict(
                                color=color,
                                size=12
                            )
                        )
                    
                    fig.update_layout(
                        height=350,
                        margin=dict(l=20, r=20, t=30, b=20),
                        xaxis_title="Year",
                        yaxis_title="Total Cost ($)",
                    )
                    
                    st.plotly_chart(fig, use_container_width=True)
                
                # Year-over-year performance metrics table
                st.subheader("Year-over-Year Performance Comparison")
                
                yearly_display = yearly_data.copy()
                yearly_display['overrun_hours'] = yearly_display['actual_hours'] - yearly_display['planned_hours']
                
                # Calculate additional metrics
                yearly_display['avg_job_hours'] = yearly_display['actual_hours'] / yearly_display['job_id']
                yearly_display['cost_per_job'] = yearly_display['total_cost'] / yearly_display['job_id']
                
                # Format for display
                yearly_table = pd.DataFrame({
                    'Year': yearly_display['year'],
                    'Jobs': yearly_display['job_id'].apply(lambda x: format_number(x, 0)),
                    'Job Growth': yearly_display['job_growth'].fillna(0).apply(lambda x: f"{x:+.1f}%"),
                    'Planned Hours': yearly_display['planned_hours'].apply(lambda x: format_number(x)),
                    'Actual Hours': yearly_display['actual_hours'].apply(lambda x: format_number(x)),
                    'Overrun %': yearly_display['overrun_percent'].apply(lambda x: f"{x:.1f}%"),
                    'Avg Hours/Job': yearly_display['avg_job_hours'].apply(lambda x: format_number(x)),
                    'Cost/Job': yearly_display['cost_per_job'].apply(lambda x: format_money(x)),
                    'Total Cost': yearly_display['total_cost'].apply(lambda x: format_money(x)),
                })
                
                st.dataframe(yearly_table, use_container_width=True, hide_index=True)
            else:
                st.info("No date data available for yearly trend analysis.")
        
        elif selected_metric == "ncr_analysis":
            st.subheader("NCR Analysis")
            
            # Display info about NCR analysis
            st.info("""
            NCR (Non-Conformance Report) analysis is not directly available from the uploaded data.
            
            To properly analyze NCR data, the dataset should include specific fields such as:
            - NCR identification flags
            - Failure reasons
            - Rework hours
            - Quality metrics
            
            In a full implementation, this section would show:
            - NCR trends over time
            - Most common failure reasons
            - Cost impact of NCRs
            - Parts with recurring quality issues
            
            Please ensure your data includes NCR-specific fields for a complete analysis.
            """)
            
            # Create a simulated NCR analysis based on overrun data
            if not df.empty:
                # Calculate overrun hours
                df['overrun_hours'] = df['actual_hours'] - df['planned_hours']
                
                # Simulate NCR data (assume 10% of overruns are NCR-related)
                df['ncr_hours'] = df['overrun_hours'] * 0.1
                df['is_ncr'] = df['overrun_hours'] > 0
                
                # Display simulated metrics
                col1, col2, col3 = st.columns(3)
                
                with col1:
                    estimated_ncr_jobs = int(len(df[df['is_ncr']]) * 0.1)
                    st.metric(
                        label="Estimated NCR Jobs", 
                        value=estimated_ncr_jobs,
                        delta=None
                    )
                
                with col2:
                    estimated_ncr_hours = df['ncr_hours'].sum()
                    st.metric(
                        label="Estimated NCR Hours", 
                        value=format_number(estimated_ncr_hours),
                        delta=None
                    )
                
                with col3:
                    # Assuming $75/hour
                    estimated_ncr_cost = estimated_ncr_hours * 75
                    st.metric(
                        label="Estimated NCR Cost", 
                        value=format_money(estimated_ncr_cost),
                        delta=None
                    )
                
                st.markdown("""
                > **Note:** The NCR analysis shown here is a simulation based on the assumption that approximately 10% of overrun hours are related to quality issues requiring rework. For accurate NCR analysis, specific NCR data fields are needed.
                """)
                
                # Simulated NCR types
                ncr_types = ['Dimensional Error', 'Surface Finish', 'Material Defect', 'Assembly Error', 'Documentation Error']
                ncr_values = [30, 25, 15, 20, 10]  # Percentages
                
                col1, col2 = st.columns(2)
                
                with col1:
                    st.subheader("Simulated NCR Types Distribution")
                    
                    # Create pie chart
                    fig = go.Figure(data=[go.Pie(
                        labels=ncr_types,
                        values=ncr_values,
                        hole=.4,
                        marker_colors=['#1e40af', '#3b82f6', '#60a5fa', '#dc2626', '#f59e0b']
                    )])
                    
                    fig.update_layout(
                        height=350,
                        margin=dict(l=20, r=20, t=30, b=20),
                    )
                    
                    st.plotly_chart(fig, use_container_width=True)
                
                with col2:
                    st.subheader("Simulated NCR Impact")
                    
                    # Total production hours
                    total_hours = df['actual_hours'].sum()
                    
                    # Calculate percentages
                    good_production = total_hours - estimated_ncr_hours
                    good_percent = good_production / total_hours * 100
                    ncr_percent = estimated_ncr_hours / total_hours * 100
                    
                    # Create gauge chart
                    fig = go.Figure(go.Indicator(
                        mode = "gauge+number",
                        value = good_percent,
                        title = {'text': "First Pass Yield %"},
                        gauge = {
                            'axis': {'range': [None, 100]},
                            'bar': {'color': "#4caf50"},
                            'steps': [
                                {'range': [0, 70], 'color': "#ffcdd2"},
                                {'range': [70, 85], 'color': "#ffecb3"},
                                {'range': [85, 100], 'color': "#c8e6c9"}
                            ],
                            'threshold': {
                                'line': {'color': "red", 'width': 4},
                                'thickness': 0.75,
                                'value': 90
                            }
                        }
                    ))
                    
                    fig.update_layout(
                        height=350,
                        margin=dict(l=20, r=20, t=30, b=20),
                    )
                    
                    st.plotly_chart(fig, use_container_width=True)
            else:
                st.warning("No data available for NCR analysis simulation.")
    else:
        st.info("Please select a metric from the options above.")
