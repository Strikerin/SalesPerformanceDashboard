import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import pandas as pd

def create_yearly_trends_chart(yearly_df):
    """Create yearly trends chart with hours and overrun percentage."""
    
    # Create figure with secondary y-axis
    fig = make_subplots(specs=[[{"secondary_y": True}]])
    
    # Add traces for planned and actual hours
    fig.add_trace(
        go.Scatter(
            x=yearly_df["year"],
            y=yearly_df["planned_hours"],
            name="Planned Hours",
            marker_color="#1e40af",
            line=dict(color="#1e40af"),
            mode="lines",
            fill="tozeroy",
            fillcolor="rgba(30, 64, 175, 0.1)"
        ),
        secondary_y=False
    )
    
    fig.add_trace(
        go.Scatter(
            x=yearly_df["year"],
            y=yearly_df["actual_hours"],
            name="Actual Hours",
            marker_color="#dc2626",
            line=dict(color="#dc2626"),
            mode="lines",
            fill="tozeroy",
            fillcolor="rgba(220, 38, 38, 0.1)"
        ),
        secondary_y=False
    )
    
    # Calculate overrun percentage
    yearly_df["overrun_percent"] = (yearly_df["overrun_hours"] / yearly_df["planned_hours"]) * 100
    
    # Add trace for overrun percentage
    fig.add_trace(
        go.Scatter(
            x=yearly_df["year"],
            y=yearly_df["overrun_percent"],
            name="Overrun %",
            marker_color="#f59e0b",
            mode="lines+markers",
            line=dict(width=3)
        ),
        secondary_y=True
    )
    
    # Set titles
    fig.update_layout(
        title_text="Yearly Hours & Overrun %",
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1)
    )
    
    # Set y-axes titles
    fig.update_yaxes(title_text="Hours", secondary_y=False)
    fig.update_yaxes(title_text="Overrun %", secondary_y=True, ticksuffix="%")
    
    return fig

def create_customer_profit_chart(customer_data):
    """Create customer profit chart."""
    
    # Convert to DataFrame
    df = pd.DataFrame(customer_data)
    
    # Sort by profitability
    df = df.sort_values("profitability")
    
    # Create figure with secondary y-axis
    fig = make_subplots(specs=[[{"secondary_y": True}]])
    
    # Add bars for profitability
    fig.add_trace(
        go.Bar(
            x=df["customer"],
            y=df["profitability"],
            name="Profit Margin %",
            marker_color=[
                "#dc2626" if x < 0 else "#22c55e" for x in df["profitability"]
            ]
        ),
        secondary_y=False
    )
    
    # Add line for hours
    fig.add_trace(
        go.Scatter(
            x=df["customer"],
            y=df["actual_hours"],
            name="Actual Hours",
            mode="lines+markers",
            marker_color="#1e40af",
            line=dict(width=3)
        ),
        secondary_y=True
    )
    
    # Add overrun hours area
    fig.add_trace(
        go.Scatter(
            x=df["customer"],
            y=df["overrun_hours"],
            name="Overrun Hours",
            mode="lines+markers",
            marker_color="#f59e0b",
            line=dict(width=3)
        ),
        secondary_y=True
    )
    
    # Set titles
    fig.update_layout(
        title_text="Customer Profitability Analysis",
        xaxis_title="Customer",
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1)
    )
    
    # Set y-axes titles
    fig.update_yaxes(title_text="Profit Margin %", secondary_y=False, ticksuffix="%")
    fig.update_yaxes(title_text="Hours", secondary_y=True)
    
    return fig

def create_workcenter_chart(workcenter_df):
    """Create work center comparison chart."""
    
    # Sort by actual hours
    df = workcenter_df.sort_values("actual_hours", ascending=False)
    
    # Create figure
    fig = px.bar(
        df,
        x="work_center",
        y=["planned_hours", "actual_hours", "overrun_hours"],
        title="Work Center Hours Breakdown",
        barmode="group",
        labels={
            "value": "Hours",
            "variable": "Category",
            "work_center": "Work Center"
        },
        color_discrete_map={
            "planned_hours": "#1e40af",
            "actual_hours": "#dc2626",
            "overrun_hours": "#f59e0b"
        }
    )
    
    # Update layout
    fig.update_layout(
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
        xaxis_tickangle=-45
    )
    
    # Update legend names
    fig.for_each_trace(lambda t: t.update(name=t.name.replace("_hours", "").title()))
    
    return fig
