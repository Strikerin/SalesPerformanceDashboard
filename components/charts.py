import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import numpy as np
from utils.formatters import format_number, format_money, format_percent

def create_quarterly_hours_chart(data):
    """
    Create a bar chart showing planned vs actual hours per quarter.
    
    Args:
        data: DataFrame or list of dicts with quarterly data
    
    Returns:
        A plotly figure
    """
    # Convert to DataFrame if not already
    if not isinstance(data, pd.DataFrame):
        data = pd.DataFrame(data)
    
    # Create chart data
    chart_data = data.copy()
    
    # Add quarter label if not present
    if 'quarter_label' not in chart_data.columns and 'quarter' in chart_data.columns:
        chart_data['quarter_label'] = chart_data['quarter'].apply(lambda q: f"Q{q}")
    
    # Create the chart
    fig = go.Figure()
    
    # Add planned hours bar
    fig.add_trace(go.Bar(
        x=chart_data['quarter_label'] if 'quarter_label' in chart_data.columns else chart_data['quarter'],
        y=chart_data['planned_hours'],
        name='Planned Hours',
        marker_color='#1e40af'
    ))
    
    # Add actual hours bar
    fig.add_trace(go.Bar(
        x=chart_data['quarter_label'] if 'quarter_label' in chart_data.columns else chart_data['quarter'],
        y=chart_data['actual_hours'],
        name='Actual Hours',
        marker_color='#dc2626'
    ))
    
    # Layout
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
        xaxis_title="Quarter",
        yaxis_title="Hours",
    )
    
    return fig

def create_yearly_trends_chart(data):
    """
    Create a line chart showing yearly trends with multiple metrics.
    
    Args:
        data: DataFrame or list of dicts with yearly data
    
    Returns:
        A plotly figure
    """
    # Convert to DataFrame if not already
    if not isinstance(data, pd.DataFrame):
        data = pd.DataFrame(data)
    
    # Sort by year if it's not already
    if 'year' in data.columns:
        data = data.sort_values('year')
    
    # Create the chart
    fig = go.Figure()
    
    # Add planned hours line
    if 'planned_hours' in data.columns:
        fig.add_trace(go.Scatter(
            x=data['year'],
            y=data['planned_hours'],
            mode='lines+markers',
            name='Planned Hours',
            line=dict(color='#1e40af', width=3),
            marker=dict(size=8)
        ))
    
    # Add actual hours line
    if 'actual_hours' in data.columns:
        fig.add_trace(go.Scatter(
            x=data['year'],
            y=data['actual_hours'],
            mode='lines+markers',
            name='Actual Hours',
            line=dict(color='#dc2626', width=3),
            marker=dict(size=8)
        ))
    
    # Add overrun percentage line with secondary y-axis
    if 'overrun_percent' in data.columns or ('planned_hours' in data.columns and 'actual_hours' in data.columns):
        if 'overrun_percent' not in data.columns:
            data['overrun_percent'] = (data['actual_hours'] - data['planned_hours']) / data['planned_hours'] * 100
        
        fig.add_trace(go.Scatter(
            x=data['year'],
            y=data['overrun_percent'],
            mode='lines+markers',
            name='Overrun %',
            line=dict(color='#f59e0b', width=2, dash='dot'),
            marker=dict(size=8),
            yaxis='y2'
        ))
        
        # Add secondary y-axis
        fig.update_layout(
            yaxis2=dict(
                title="Overrun %",
                overlaying='y',
                side='right',
                ticksuffix='%'
            )
        )
    
    # Layout
    fig.update_layout(
        height=400,
        margin=dict(l=20, r=20, t=30, b=20),
        legend=dict(
            orientation="h",
            yanchor="bottom",
            y=1.02,
            xanchor="right",
            x=1
        ),
        xaxis_title="Year",
        yaxis_title="Hours",
    )
    
    return fig

def create_customer_profitability_chart(data, metric='profit_margin'):
    """
    Create a bar chart showing customer profitability.
    
    Args:
        data: DataFrame or list of dicts with customer data
        metric: Which metric to use ('profit_margin' or 'profit')
    
    Returns:
        A plotly figure
    """
    # Convert to DataFrame if not already
    if not isinstance(data, pd.DataFrame):
        data = pd.DataFrame(data)
    
    # Sort by the chosen metric
    if metric in data.columns:
        data = data.sort_values(metric, ascending=False)
    
    # Use only top 10 customers
    top_customers = data.head(10)
    
    # Create the chart
    if metric == 'profit_margin':
        fig = px.bar(
            top_customers,
            x='company' if 'company' in top_customers.columns else 'customer',
            y='profit_margin',
            color='profit_margin',
            color_continuous_scale=['#f44336', '#ffeb3b', '#4caf50'],
            labels={'profit_margin': 'Profit Margin %', 'company': 'Customer'},
            text=top_customers['profit_margin'].apply(lambda x: f"{x:.1f}%")
        )
        
        fig.update_layout(
            coloraxis_showscale=False,
            yaxis_title="Profit Margin %",
        )
    else:  # profit
        fig = go.Figure()
        
        fig.add_trace(go.Bar(
            x=top_customers['company'] if 'company' in top_customers.columns else top_customers['customer'],
            y=top_customers['profit'],
            marker_color='#1e40af',
            text=top_customers['profit'].apply(lambda x: format_money(x)),
            textposition='outside'
        ))
        
        fig.update_layout(
            yaxis_title="Total Profit ($)",
        )
    
    # Common layout settings
    fig.update_layout(
        height=400,
        margin=dict(l=20, r=20, t=30, b=20),
        xaxis_title="Customer",
    )
    
    fig.update_traces(textposition='outside')
    
    return fig

def create_work_center_utilization_chart(data):
    """
    Create a bar chart showing work center utilization.
    
    Args:
        data: DataFrame or list of dicts with work center data
    
    Returns:
        A plotly figure
    """
    # Convert to DataFrame if not already
    if not isinstance(data, pd.DataFrame):
        data = pd.DataFrame(data)
    
    # Calculate utilization if not already present
    if 'utilization' not in data.columns and 'planned_hours' in data.columns and 'actual_hours' in data.columns:
        data['utilization'] = data['actual_hours'] / data['planned_hours'] * 100
    
    # Sort by utilization
    if 'utilization' in data.columns:
        data = data.sort_values('utilization', ascending=False)
    
    # Use only top 10 work centers
    top_wc = data.head(10)
    
    # Create the chart
    fig = go.Figure()
    
    fig.add_trace(go.Bar(
        x=top_wc['work_center'],
        y=top_wc['utilization'],
        marker_color=top_wc['utilization'].apply(
            lambda x: '#4caf50' if x <= 100 else '#f44336'
        ),
        text=top_wc['utilization'].apply(lambda x: f"{x:.1f}%"),
        textposition='outside'
    ))
    
    # Add a horizontal line at 100%
    fig.add_shape(
        type="line",
        x0=-0.5,
        y0=100,
        x1=len(top_wc)-0.5,
        y1=100,
        line=dict(
            color="red",
            width=2,
            dash="dash",
        )
    )
    
    # Layout
    fig.update_layout(
        height=400,
        margin=dict(l=20, r=20, t=30, b=20),
        xaxis_title="Work Center",
        yaxis_title="Utilization %",
        yaxis=dict(
            range=[0, max(150, top_wc['utilization'].max() * 1.1 if not top_wc.empty else 150)]
        )
    )
    
    return fig

def create_profitability_pie_chart(data, value_col='planned_hours', labels_col='company', title=None):
    """
    Create a pie chart showing distribution of a metric across categories.
    
    Args:
        data: DataFrame or list of dicts
        value_col: Column to use for values (e.g., 'profit', 'planned_hours')
        labels_col: Column to use for labels (e.g., 'company', 'work_center')
        title: Optional chart title
    
    Returns:
        A plotly figure
    """
    # Convert to DataFrame if not already
    if not isinstance(data, pd.DataFrame):
        data = pd.DataFrame(data)
    
    # Sort by the value column
    if value_col in data.columns:
        data = data.sort_values(value_col, ascending=False)
    
    # Use top 10 categories and group the rest as "Others"
    top_items = data.head(10).copy()
    other_value = data.iloc[10:][value_col].sum() if len(data) > 10 else 0
    
    # Create labels and values
    labels = list(top_items[labels_col])
    values = list(top_items[value_col])
    
    if other_value > 0:
        labels.append('Others')
        values.append(other_value)
    
    # Create the chart
    fig = go.Figure(data=[go.Pie(
        labels=labels,
        values=values,
        hole=.4,
        marker_colors=['#1e40af', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe',
                      '#312e81', '#4338ca', '#4f46e5', '#6366f1', '#818cf8', '#d1d5db']
    )])
    
    # Layout
    fig.update_layout(
        height=400,
        margin=dict(l=20, r=20, t=30, b=20),
        legend=dict(
            orientation="h",
            yanchor="bottom",
            y=-0.2,
            xanchor="center",
            x=0.5
        )
    )
    
    if title:
        fig.update_layout(title=title)
    
    return fig

def create_overrun_analysis_chart(data, by='work_center'):
    """
    Create a chart showing overrun analysis by a specific dimension.
    
    Args:
        data: DataFrame or list of dicts with overrun data
        by: Dimension to analyze by ('work_center', 'job', 'month', etc.)
    
    Returns:
        A plotly figure
    """
    # Convert to DataFrame if not already
    if not isinstance(data, pd.DataFrame):
        data = pd.DataFrame(data)
    
    # Calculate overrun hours if not already present
    if 'overrun_hours' not in data.columns and 'planned_hours' in data.columns and 'actual_hours' in data.columns:
        data['overrun_hours'] = data['actual_hours'] - data['planned_hours']
    
    # Handle different analysis dimensions
    if by == 'job':
        # Sort by overrun hours
        data = data.sort_values('overrun_hours', ascending=False)
        
        # Use top 10 jobs
        top_items = data.head(10)
        
        # Create the chart
        fig = go.Figure()
        
        fig.add_trace(go.Bar(
            y=top_items['job_id'],
            x=top_items['planned_hours'],
            name='Planned Hours',
            orientation='h',
            marker_color='#1e40af'
        ))
        
        fig.add_trace(go.Bar(
            y=top_items['job_id'],
            x=top_items['actual_hours'],
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
            yaxis_title="Job ID",
            yaxis=dict(autorange="reversed")
        )
    
    elif by == 'work_center':
        # Group by work center and sum hours
        wc_data = data.groupby('work_center').agg({
            'planned_hours': 'sum',
            'actual_hours': 'sum',
            'overrun_hours': 'sum'
        }).reset_index()
        
        # Sort by overrun hours
        wc_data = wc_data.sort_values('overrun_hours', ascending=False)
        
        # Use top 10 work centers
        top_wc = wc_data.head(10)
        
        # Create the chart
        fig = go.Figure()
        
        fig.add_trace(go.Bar(
            x=top_wc['work_center'],
            y=top_wc['overrun_hours'],
            marker_color='#dc2626',
            text=top_wc['overrun_hours'].apply(lambda x: format_number(x)),
            textposition='outside'
        ))
        
        fig.update_layout(
            height=400,
            margin=dict(l=20, r=20, t=30, b=20),
            xaxis_title="Work Center",
            yaxis_title="Overrun Hours",
        )
    
    elif by == 'month':
        # Group by month and sum hours
        if 'month' not in data.columns and 'date' in data.columns:
            data['month'] = data['date'].dt.strftime('%b %Y')
        
        # Group by month
        month_data = data.groupby('month').agg({
            'planned_hours': 'sum',
            'actual_hours': 'sum',
            'overrun_hours': 'sum'
        }).reset_index()
        
        # Calculate overrun percentage
        month_data['overrun_percent'] = month_data['overrun_hours'] / month_data['planned_hours'] * 100
        
        # Sort chronologically
        try:
            month_order = pd.to_datetime(month_data['month'], format='%b %Y').sort_values().index
            month_data = month_data.iloc[month_order]
        except:
            # If sorting fails, use as-is
            pass
        
        # Create the chart
        fig = go.Figure()
        
        fig.add_trace(go.Scatter(
            x=month_data['month'],
            y=month_data['overrun_hours'],
            mode='lines+markers',
            name='Overrun Hours',
            line=dict(color='#dc2626', width=3),
            marker=dict(size=8)
        ))
        
        fig.add_trace(go.Scatter(
            x=month_data['month'],
            y=month_data['overrun_percent'],
            mode='lines+markers',
            name='Overrun %',
            line=dict(color='#f59e0b', width=2, dash='dot'),
            marker=dict(size=8),
            yaxis='y2'
        ))
        
        fig.update_layout(
            height=400,
            margin=dict(l=20, r=20, t=30, b=20),
            legend=dict(
                orientation="h",
                yanchor="bottom",
                y=1.02,
                xanchor="right",
                x=1
            ),
            xaxis_title="Month",
            yaxis_title="Overrun Hours",
            yaxis2=dict(
                title="Overrun %",
                overlaying='y',
                side='right',
                ticksuffix='%'
            )
        )
    
    else:
        # Default to a simple bar chart of overrun hours
        data = data.sort_values('overrun_hours', ascending=False)
        top_items = data.head(10)
        
        fig = go.Figure()
        
        fig.add_trace(go.Bar(
            x=top_items[by] if by in top_items.columns else range(len(top_items)),
            y=top_items['overrun_hours'],
            marker_color='#dc2626',
            text=top_items['overrun_hours'].apply(lambda x: format_number(x)),
            textposition='outside'
        ))
        
        fig.update_layout(
            height=400,
            margin=dict(l=20, r=20, t=30, b=20),
            xaxis_title=by.capitalize(),
            yaxis_title="Overrun Hours",
        )
    
    return fig

def create_monthly_trend_chart(data, year=None):
    """
    Create a bar chart showing monthly trends of planned vs actual hours.
    
    Args:
        data: DataFrame with date column
        year: Optional year to filter by
    
    Returns:
        A plotly figure
    """
    # Make a copy to avoid modifying the original
    df = data.copy()
    
    # Filter by year if specified
    if year and 'date' in df.columns:
        df = df[df['date'].dt.year == year]
    
    # Extract month information
    if 'month' not in df.columns and 'date' in df.columns:
        df['month'] = df['date'].dt.strftime('%b %Y')
    
    # Group by month
    monthly_data = df.groupby('month').agg({
        'planned_hours': 'sum',
        'actual_hours': 'sum'
    }).reset_index()
    
    # Sort chronologically
    try:
        month_order = pd.to_datetime(monthly_data['month'], format='%b %Y').sort_values().index
        monthly_data = monthly_data.iloc[month_order]
    except:
        # If sorting fails, use as-is
        pass
    
    # Create the chart
    fig = go.Figure()
    
    fig.add_trace(go.Bar(
        x=monthly_data['month'],
        y=monthly_data['planned_hours'],
        name='Planned Hours',
        marker_color='#1e40af'
    ))
    
    fig.add_trace(go.Bar(
        x=monthly_data['month'],
        y=monthly_data['actual_hours'],
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
        xaxis_title="Month",
        yaxis_title="Hours",
    )
    
    return fig
