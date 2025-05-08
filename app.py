import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import numpy as np
from datetime import datetime
import os
from utils.formatters import format_money, format_number, format_percent
from utils.data_utils import (
    load_yearly_summary, 
    load_summary_metrics, 
    load_customer_profitability, 
    load_workcenter_trends
)
from utils.visualization import (
    create_yearly_trends_chart, 
    create_customer_profit_chart, 
    create_workcenter_chart
)

# Page configuration
st.set_page_config(
    page_title="Work History Dashboard",
    page_icon="📊",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Title and description
st.title("📊 Work History Dashboard")
st.markdown("An executive analysis of shop performance with focus on cost, labor efficiency, and process breakdowns.")

# Function to fetch and process data
@st.cache_data(ttl=3600)
def get_dashboard_data():
    try:
        yearly_summary = load_yearly_summary()
        summary_metrics = load_summary_metrics()
        customer_data = load_customer_profitability()
        workcenter_data = load_workcenter_trends()
        
        return {
            "yearly_summary": yearly_summary,
            "summary_metrics": summary_metrics,
            "customer_data": customer_data,
            "workcenter_data": workcenter_data
        }
    except Exception as e:
        st.error(f"Error loading data: {str(e)}")
        return None

# Load dashboard data
data = get_dashboard_data()

if data:
    # ---- SUMMARY METRICS SECTION ----
    st.subheader("Summary Metrics")
    
    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.metric("Planned Hours", format_number(data["summary_metrics"]["total_planned_hours"]))
    with col2:
        st.metric("Actual Hours", format_number(data["summary_metrics"]["total_actual_hours"]))
    with col3:
        st.metric("Overrun Hours", format_number(data["summary_metrics"]["total_overrun_hours"]), 
                 delta=format_percent(data["summary_metrics"]["overrun_percent"]/100))
    with col4:
        st.metric("NCR Hours", format_number(data["summary_metrics"]["total_ncr_hours"]))
    
    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.metric("Planned Cost", format_money(data["summary_metrics"]["total_planned_cost"]))
    with col2:
        st.metric("Actual Cost", format_money(data["summary_metrics"]["total_actual_cost"]))
    with col3:
        overrun_cost = data["summary_metrics"]["total_actual_cost"] - data["summary_metrics"]["total_planned_cost"]
        st.metric("Overrun Cost", format_money(overrun_cost))
    with col4:
        st.metric("Total Jobs", format_number(data["summary_metrics"]["total_jobs"], 0))

    # ---- YEARLY BREAKDOWN SECTION ----
    st.subheader("Yearly Breakdown")
    
    # Yearly table and chart side by side
    col1, col2 = st.columns(2)
    
    with col1:
        yearly_df = pd.DataFrame(data["yearly_summary"])
        
        # Format columns for display
        display_df = yearly_df.copy()
        display_df["planned_hours"] = display_df["planned_hours"].apply(format_number)
        display_df["actual_hours"] = display_df["actual_hours"].apply(format_number)
        display_df["overrun_hours"] = display_df["overrun_hours"].apply(format_number)
        display_df["ncr_hours"] = display_df["ncr_hours"].apply(format_number)
        display_df["job_count"] = display_df["job_count"].apply(lambda x: format_number(x, 0))
        display_df["operation_count"] = display_df["operation_count"].apply(lambda x: format_number(x, 0))
        display_df["customer_count"] = display_df["customer_count"].apply(lambda x: format_number(x, 0))
        
        # Rename columns for better display
        display_df.columns = ["Year", "Planned", "Actual", "Overrun", "NCR", "Jobs", "Ops", "Customers"]
        
        # Add year link functionality through session state
        st.dataframe(
            display_df,
            use_container_width=True,
            column_config={
                "Year": st.column_config.LinkColumn(
                    "Year",
                    help="Click to view yearly details",
                    validate="^[0-9]{4}$"
                )
            },
            hide_index=True
        )
    
    with col2:
        yearly_chart = create_yearly_trends_chart(yearly_df)
        st.plotly_chart(yearly_chart, use_container_width=True)

    # ---- CUSTOMER PROFIT ANALYSIS ----
    st.subheader("Customer Profit Analysis")
    
    # Customer metrics row
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        # If top_customer_list_name exists, use it, otherwise use top_customer
        if "top_customer_list_name" in data["customer_data"]:
            st.metric("Most Profitable Customer", data["customer_data"]["top_customer_list_name"])
        else:
            st.metric("Most Profitable Customer", data["customer_data"]["top_customer"])
    with col2:
        # If overrun_customer_list_name exists, use it, otherwise use overrun_customer
        if "overrun_customer_list_name" in data["customer_data"]:
            st.metric("Highest Overrun Customer", data["customer_data"]["overrun_customer_list_name"])
        else:
            st.metric("Highest Overrun Customer", data["customer_data"]["overrun_customer"])
    with col3:
        st.metric("Repeat Business %", format_percent(data["customer_data"]["repeat_rate"]))
    with col4:
        st.metric("Avg Profit Margin", format_percent(data["customer_data"]["avg_margin"]))
    
    # Customer profit chart
    customer_chart = create_customer_profit_chart(data["customer_data"]["profit_data"])
    st.plotly_chart(customer_chart, use_container_width=True)
    
    # ---- WORK CENTER ANALYSIS ----
    st.subheader("Work Center Analysis")
    
    # Work center metrics
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        st.metric("Most Used Work Center", data["workcenter_data"]["most_used_wc"])
    with col2:
        st.metric("Highest Overrun WC", data["workcenter_data"]["overrun_wc"])
    with col3:
        st.metric("Avg Utilization", format_percent(data["workcenter_data"]["avg_util"]))
    with col4:
        st.metric("Total WC Hours", format_number(data["workcenter_data"]["total_wc_hours"]))
    
    # Work center data table and chart
    col1, col2 = st.columns(2)
    
    with col1:
        wc_df = pd.DataFrame(data["workcenter_data"]["work_center_data"])
        
        # Format columns for display
        display_wc_df = wc_df.copy()
        display_wc_df["planned_hours"] = display_wc_df["planned_hours"].apply(format_number)
        display_wc_df["actual_hours"] = display_wc_df["actual_hours"].apply(format_number)
        display_wc_df["overrun_hours"] = display_wc_df["overrun_hours"].apply(format_number)
        
        # Rename columns for better display
        display_wc_df.columns = ["Work Center", "Planned", "Actual", "Overrun"]
        
        st.dataframe(display_wc_df, use_container_width=True, hide_index=True)
    
    with col2:
        wc_chart = create_workcenter_chart(wc_df)
        st.plotly_chart(wc_chart, use_container_width=True)
    
    # ---- CALCULATION NOTES ----
    with st.expander("Calculation Notes"):
        st.markdown("""
        - **Planned/Actual Cost:** `Hours × $199/hour`
        - **Overrun Hours:** When `Actual > Planned`
        - **NCR Hours:** Total hours for `NCR` work center ops
        """)
else:
    st.warning("No data available. Please upload work history data in the Upload Data page.")
    st.info("Navigate to the Upload Data page using the sidebar to get started.")
