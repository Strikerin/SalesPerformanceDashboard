import streamlit as st
import pandas as pd
import numpy as np
from datetime import datetime
import os

# Import formatters
from utils.formatters import format_number, format_money, format_percent
# Import components
from components.ImportData import import_data_component, process_data, get_summary_stats
from components.Dashboard import dashboard_component, dashboard_filters_sidebar
from components.YearlyView import yearly_view_component
from components.MetricDetail import metric_detail_component

# Page configuration
st.set_page_config(
    page_title="Work History Dashboard",
    page_icon="📊",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Initialize session state variables
if 'current_page' not in st.session_state:
    st.session_state['current_page'] = 'dashboard'
if 'data_loaded' not in st.session_state:
    st.session_state['data_loaded'] = False
if 'df' not in st.session_state:
    st.session_state['df'] = None
if 'yearly_summary' not in st.session_state:
    st.session_state['yearly_summary'] = None
if 'quarterly_summary' not in st.session_state:
    st.session_state['quarterly_summary'] = None
if 'customer_data' not in st.session_state:
    st.session_state['customer_data'] = None
if 'workcenter_data' not in st.session_state:
    st.session_state['workcenter_data'] = None
if 'part_data' not in st.session_state:
    st.session_state['part_data'] = None
if 'selected_year' not in st.session_state:
    st.session_state['selected_year'] = datetime.now().year
if 'selected_customer' not in st.session_state:
    st.session_state['selected_customer'] = "All"
if 'selected_work_center' not in st.session_state:
    st.session_state['selected_work_center'] = "All"
if 'date_range' not in st.session_state:
    st.session_state['date_range'] = (None, None)
if 'viewing_year' not in st.session_state:
    st.session_state['viewing_year'] = None
if 'selected_metric' not in st.session_state:
    st.session_state['selected_metric'] = None

# Sidebar
with st.sidebar:
    st.image("https://pixabay.com/get/g30481ee0924913404c9dfe0b5114550d957b521beb66b099e6aee89f280668e8b1c9744205f77d6ef7636a9fa790c2fd2ed50f3d699ac0d263727b681d49e355_1280.jpg", width=75)
    st.title("Work History Dashboard")
    
    # Show data import component if data is not loaded
    if not st.session_state.get('data_loaded', False):
        data_loaded = import_data_component()
    
    # If data is loaded, show filters or navigation based on current page
    if st.session_state.get('data_loaded', False):
        # Navigation
        st.subheader("Navigation")
        nav_options = ["📊 Dashboard", "📅 Yearly View", "🔍 Metric Details"]
        selected_page = st.radio("Go to", nav_options)
        
        # Update current page based on selection
        if selected_page == "📊 Dashboard" and st.session_state['current_page'] != 'dashboard':
            st.session_state['current_page'] = 'dashboard'
            st.rerun()
        elif selected_page == "📅 Yearly View" and st.session_state['current_page'] != 'yearly_view':
            st.session_state['current_page'] = 'yearly_view'
            st.rerun()
        elif selected_page == "🔍 Metric Details" and st.session_state['current_page'] != 'metric_detail':
            st.session_state['current_page'] = 'metric_detail'
            st.rerun()
        
        # Show filters if we're on the dashboard
        if st.session_state['current_page'] == 'dashboard':
            dashboard_filters_sidebar()
    
    # About section
    st.sidebar.markdown("---")
    st.sidebar.info(
        "This dashboard provides insights into work history data, "
        "focusing on hours, costs, and profitability metrics."
    )

# Main content
if not st.session_state.get('data_loaded', False):
    # Welcome screen when no data is loaded
    st.title("📊 Work History Overview")
    
    # Example dashboard image
    col1, col2 = st.columns([2, 1])
    with col1:
        st.image("https://pixabay.com/get/g46743423e9133cc09184b6514082010cb0a984fb687f0b0e0fa604672859007002613d1f75460a309a5c8fc3bba2be81d185bfd2eb97b8674ea51cacfcf01d18_1280.jpg", use_column_width=True)
    
    with col2:
        st.markdown("""
        ### Welcome to the Work History Dashboard
        
        This tool helps you analyze:
        - Planned vs actual hours
        - Cost overruns
        - Profitability by customer
        - Work center performance
        - Quarterly trends
        
        **To get started:**
        1. Upload your work history Excel file
        2. Use the filters to refine your view
        3. Navigate between different analysis pages
        """)
    
    # Import sample section
    st.subheader("Getting Started")
    st.markdown("""
    Upload your work history Excel file using the uploader in the sidebar.
    
    Your Excel file should contain columns for:
    - Company/Customer name
    - Job ID
    - Work center
    - Part/material information
    - Planned hours
    - Actual hours
    - Date information
    
    The system will automatically detect and map your columns to the appropriate fields.
    """)
else:
    # Render the appropriate page based on the current_page value
    if st.session_state['current_page'] == 'dashboard':
        dashboard_component()
    elif st.session_state['current_page'] == 'yearly_view':
        yearly_view_component()
    elif st.session_state['current_page'] == 'metric_detail':
        metric_detail_component()

# Footer
st.markdown("---")
st.markdown(
    "<div style='text-align: center; color: #888;'>"
    "Work History Dashboard | Data last updated: "
    f"{datetime.now().strftime('%Y-%m-%d %H:%M')}</div>", 
    unsafe_allow_html=True
)
