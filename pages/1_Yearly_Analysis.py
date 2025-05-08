import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import numpy as np
from datetime import datetime
from utils.formatters import format_money, format_number, format_percent
from utils.data_utils import load_year_data

# Page configuration
st.set_page_config(
    page_title="Yearly Analysis",
    page_icon="📅",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Title and description
st.title("📅 Yearly Analysis")

# Year selection
current_year = datetime.now().year
years = list(range(current_year - 5, current_year + 1))

# Check if year was passed via URL or other mechanism
year = st.session_state.get('selected_year', years[-1])
year = st.selectbox("Select Year", years, index=years.index(year) if year in years else -1)

# Function to fetch and process yearly data
@st.cache_data(ttl=3600)
def get_yearly_data(selected_year):
    try:
        st.write(f"Debug: Attempting to load data for year {selected_year}")
        data = load_year_data(selected_year)
        st.write(f"Debug: Data loaded successfully: {data is not None}")
        return data
    except Exception as e:
        st.error(f"Error loading data for year {selected_year}: {str(e)}")
        import traceback
        st.error(f"Traceback: {traceback.format_exc()}")
        return None

# Load yearly data
data = get_yearly_data(year)

if data:
    # ---- YEAR SUMMARY CARDS ----
    st.subheader(f"Year Summary - {year}")
    
    # Summary metrics row 1
    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.metric("Planned Hours", format_number(data["summary"]["total_planned_hours"]))
    with col2:
        st.metric("Actual Hours", format_number(data["summary"]["total_actual_hours"]))
    with col3:
        st.metric("Overrun Hours", format_number(data["summary"]["total_overrun_hours"]))
    with col4:
        st.metric("Ghost Hours", format_number(data["summary"]["ghost_hours"]), 
                 help="Planned time with no recorded work")
    
    # Summary metrics row 2
    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.metric("NCR Hours", format_number(data["summary"]["total_ncr_hours"]))
    with col2:
        st.metric("Planned Cost", format_money(data["summary"]["total_planned_cost"]))
    with col3:
        st.metric("Actual Cost", format_money(data["summary"]["total_actual_cost"]))
    with col4:
        st.metric("Opportunity Cost", format_money(data["summary"]["opportunity_cost_dollars"]))
    
    # Summary metrics row 3
    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.metric("Suggested Buffer", format_percent(data["summary"]["recommended_buffer_percent"]/100))
    with col2:
        st.metric("Total Jobs", format_number(data["summary"]["total_jobs"], 0))
    with col3:
        st.metric("Total Operations", format_number(data["summary"]["total_operations"], 0))
    with col4:
        st.metric("Unique Parts", format_number(data["summary"]["total_unique_parts"], 0))
    
    # ---- QUARTERLY BREAKDOWN ----
    st.subheader("Quarterly Summary")
    
    quarterly_df = pd.DataFrame(data["quarterly_summary"])
    
    # Print column names for debugging
    st.write("Quarterly columns:", quarterly_df.columns.tolist())
    
    # Check if DataFrame is not empty
    if not quarterly_df.empty:
        # Format columns for display
        display_quarterly = quarterly_df.copy()
        
        # Print columns for debugging
        st.write("Original quarterly columns:", display_quarterly.columns.tolist())
        
        # Create a new DataFrame with specific columns to avoid length mismatch
        formatted_data = []
        
        for _, row in display_quarterly.iterrows():
            formatted_row = {
                "Quarter": row.get("quarter", "Unknown")
            }
            
            if "planned_hours" in display_quarterly.columns:
                formatted_row["Planned"] = format_number(row["planned_hours"])
            else:
                formatted_row["Planned"] = format_number(0)
                
            if "actual_hours" in display_quarterly.columns:
                formatted_row["Actual"] = format_number(row["actual_hours"])
            else:
                formatted_row["Actual"] = format_number(0)
                
            if "overrun_hours" in display_quarterly.columns:
                formatted_row["Overrun"] = format_number(row["overrun_hours"])
            else:
                formatted_row["Overrun"] = format_number(0)
                
            if "overrun_cost" in display_quarterly.columns:
                formatted_row["Cost"] = format_money(row["overrun_cost"])
            else:
                formatted_row["Cost"] = format_money(0)
                
            if "total_jobs" in display_quarterly.columns:
                formatted_row["Jobs"] = format_number(row["total_jobs"], 0)
            else:
                formatted_row["Jobs"] = format_number(0, 0)
                
            formatted_data.append(formatted_row)
            
        # Create a new DataFrame with consistent columns
        display_quarterly = pd.DataFrame(formatted_data)
    else:
        # Create an empty DataFrame with the expected columns
        display_quarterly = pd.DataFrame(columns=["Quarter", "Planned", "Actual", "Overrun", "Cost", "Jobs"])
    
    st.dataframe(display_quarterly, use_container_width=True, hide_index=True)
    
    # Print quarterly columns for debugging
    st.write("Quarterly DataFrame columns:", quarterly_df.columns.tolist() if not quarterly_df.empty else "Empty DataFrame")
    
    # Check if DataFrame is empty or missing required columns
    if quarterly_df.empty:
        # Create a placeholder figure with a message
        fig = go.Figure()
        fig.add_annotation(
            text="No quarterly data available",
            showarrow=False,
            font=dict(size=20)
        )
    else:
        # Create quarterly visualization
        fig = make_subplots(specs=[[{"secondary_y": True}]])
        
        # Get the quarter column name (might be 'Quarter' or 'quarter')
        quarter_col = None
        for col in quarterly_df.columns:
            if col.lower() == 'quarter':
                quarter_col = col
                break
        
        # If quarter column not found, create one
        if not quarter_col:
            quarterly_df['Quarter'] = [f"Q{i+1}" for i in range(len(quarterly_df))]
            quarter_col = 'Quarter'
        
        # Ensure all required columns exist for visualization
        required_cols = {
            "planned_hours": 0,
            "actual_hours": 0,
            "overrun_cost": 0
        }
        
        for col_name, default_val in required_cols.items():
            if col_name not in quarterly_df.columns:
                quarterly_df[col_name] = default_val
        
        # Add bar charts for hours
        fig.add_trace(
            go.Bar(x=quarterly_df[quarter_col], y=quarterly_df["planned_hours"], name="Planned Hours", marker_color="#1e40af"),
            secondary_y=False
        )
        
        fig.add_trace(
            go.Bar(x=quarterly_df[quarter_col], y=quarterly_df["actual_hours"], name="Actual Hours", marker_color="#dc2626"),
            secondary_y=False
        )
        
        # Add line for overrun cost
        fig.add_trace(
            go.Scatter(x=quarterly_df[quarter_col], y=quarterly_df["overrun_cost"], name="Overrun Cost", 
                    mode="lines+markers", marker_color="#f59e0b", line=dict(width=3)),
            secondary_y=True
        )
    
    # Update layout
    fig.update_layout(
        title="Quarterly Hours & Overrun Cost",
        barmode="group",
        xaxis_title="Quarter",
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1)
    )
    
    # Set y-axes titles - only use these if we have a subplot figure
    if not quarterly_df.empty:
        fig.update_yaxes(title_text="Hours", secondary_y=False)
        fig.update_yaxes(title_text="Overrun Cost ($)", secondary_y=True)
    
    st.plotly_chart(fig, use_container_width=True)
    
    # ---- TABBED SECTIONS ----
    tab1, tab2, tab3, tab4, tab5 = st.tabs([
        "🔥 Overruns", "⚠️ NCR Summary", "🏭 Work Centers", "🔁 Repeat NCRs", "🛠 Adjustments"
    ])
    
    # 🔥 OVERRUNS TAB
    with tab1:
        st.subheader("Top Operational Overruns")
        
        overrun_metrics_col1, overrun_metrics_col2, overrun_metrics_col3 = st.columns(3)
        
        with overrun_metrics_col1:
            total_overrun_cost = sum(item["overrun_cost"] for item in data["top_overruns"])
            st.metric("Total Overrun Cost", format_money(total_overrun_cost))
        
        with overrun_metrics_col2:
            total_overrun_hours = sum(item["overrun_hours"] for item in data["top_overruns"])
            st.metric("Total Overrun Hours", format_number(total_overrun_hours))
        
        with overrun_metrics_col3:
            affected_operations = len(data["top_overruns"])
            st.metric("Affected Operations", format_number(affected_operations, 0))
        
        # Create DataFrame for overruns
        if data["top_overruns"]:
            overrun_df = pd.DataFrame(data["top_overruns"])
            
            # Format columns for display
            display_overruns = overrun_df.copy()
            display_overruns["planned_hours"] = display_overruns["planned_hours"].apply(format_number)
            display_overruns["actual_hours"] = display_overruns["actual_hours"].apply(format_number)
            display_overruns["overrun_hours"] = display_overruns["overrun_hours"].apply(format_number)
            display_overruns["overrun_cost"] = display_overruns["overrun_cost"].apply(format_money)
            
            # Rename columns for better display
            display_overruns.columns = ["Job", "Part", "Work Center", "Task", "Planned", "Actual", "Overrun", "Cost"]
            
            st.dataframe(display_overruns, use_container_width=True, hide_index=True)
        else:
            st.info("No overrun data available for this year.")
    
    # ⚠️ NCR SUMMARY TAB
    with tab2:
        st.subheader("Non-Conformance Reports")
        
        if data["ncr_summary"]:
            ncr_metrics_col1, ncr_metrics_col2, ncr_metrics_col3, ncr_metrics_col4 = st.columns(4)
            
            with ncr_metrics_col1:
                total_ncr_cost = sum(item["total_ncr_cost"] for item in data["ncr_summary"])
                st.metric("Total NCR Cost", format_money(total_ncr_cost))
            
            with ncr_metrics_col2:
                total_ncr_hours = sum(item["total_ncr_hours"] for item in data["ncr_summary"])
                st.metric("Total NCR Hours", format_number(total_ncr_hours))
            
            with ncr_metrics_col3:
                affected_parts = len(data["ncr_summary"])
                st.metric("Affected Parts", format_number(affected_parts, 0))
            
            with ncr_metrics_col4:
                avg_cost_per_part = total_ncr_cost / affected_parts if affected_parts > 0 else 0
                st.metric("Avg Cost / Part", format_money(avg_cost_per_part))
            
            # Search filter for NCR data
            search_term = st.text_input("🔍 Filter parts:", placeholder="Enter part name to filter...")
            
            # Create DataFrame for NCR data
            ncr_df = pd.DataFrame(data["ncr_summary"])
            
            # Filter data based on search term
            if search_term:
                filtered_ncr_df = ncr_df[ncr_df["part_name"].str.contains(search_term, case=False)]
            else:
                filtered_ncr_df = ncr_df
            
            # Format columns for display
            display_ncr = filtered_ncr_df.copy()
            display_ncr["total_ncr_hours"] = display_ncr["total_ncr_hours"].apply(format_number)
            display_ncr["total_ncr_cost"] = display_ncr["total_ncr_cost"].apply(format_money)
            
            # Rename columns
            display_ncr = display_ncr.rename(columns={
                "part_name": "Part",
                "total_ncr_hours": "NCR Hours",
                "total_ncr_cost": "Cost",
                "ncr_occurrences": "Occurrences"
            })
            
            st.dataframe(display_ncr, use_container_width=True, hide_index=True)
        else:
            st.info("No NCR data available for this year.")
    
    # 🏭 WORK CENTERS TAB
    with tab3:
        st.subheader("Work Center Efficiency")
        
        if data["workcenter_summary"]:
            wc_metrics_col1, wc_metrics_col2 = st.columns(2)
            
            with wc_metrics_col1:
                total_centers = len(data["workcenter_summary"])
                st.metric("Work Centers", format_number(total_centers, 0))
            
            with wc_metrics_col2:
                total_overrun_cost = sum(item["overrun_cost"] for item in data["workcenter_summary"])
                st.metric("Total Overrun Cost", format_money(total_overrun_cost))
            
            # Create DataFrame for work centers
            wc_df = pd.DataFrame(data["workcenter_summary"])
            
            # Format columns for display
            display_wc = wc_df.copy()
            display_wc["planned_hours"] = display_wc["planned_hours"].apply(format_number)
            display_wc["actual_hours"] = display_wc["actual_hours"].apply(format_number)
            display_wc["overrun_hours"] = display_wc["overrun_hours"].apply(format_number)
            display_wc["overrun_cost"] = display_wc["overrun_cost"].apply(format_money)
            
            # Rename columns
            display_wc = display_wc.rename(columns={
                "work_center": "Work Center",
                "planned_hours": "Planned",
                "actual_hours": "Actual",
                "overrun_hours": "Overrun",
                "overrun_cost": "Cost"
            })
            
            st.dataframe(display_wc, use_container_width=True, hide_index=True)
            
            # Create work center chart
            fig = px.bar(
                wc_df,
                x="work_center",
                y=["planned_hours", "actual_hours", "overrun_hours"],
                barmode="group",
                title="Work Center Hours Breakdown",
                labels={
                    "work_center": "Work Center",
                    "value": "Hours",
                    "variable": "Type"
                },
                color_discrete_map={
                    "planned_hours": "#1e40af",
                    "actual_hours": "#dc2626",
                    "overrun_hours": "#f59e0b"
                }
            )
            
            # Update column names in legend
            fig.for_each_trace(lambda t: t.update(name=t.name.replace("_hours", "").title()))
            
            st.plotly_chart(fig, use_container_width=True)
        else:
            st.info("No work center data available for this year.")
    
    # 🔁 REPEAT NCRS TAB
    with tab4:
        st.subheader("Repeat NCRs")
        
        if data["repeat_ncr_failures"]:
            repeat_metrics_col = st.columns(1)[0]
            
            with repeat_metrics_col:
                total_repeats = len(data["repeat_ncr_failures"])
                st.metric("Repeat NCR Parts", format_number(total_repeats, 0))
            
            # Create DataFrame for repeat NCRs
            repeat_df = pd.DataFrame(data["repeat_ncr_failures"])
            
            # Format columns for display
            display_repeat = repeat_df.copy()
            display_repeat["repeat_ncr_hours"] = display_repeat["repeat_ncr_hours"].apply(format_number)
            
            # Rename columns
            display_repeat = display_repeat.rename(columns={
                "part_name": "Part",
                "repeat_ncr_hours": "Repeat NCR Hours",
                "ncr_job_count": "NCR Jobs"
            })
            
            st.dataframe(display_repeat, use_container_width=True, hide_index=True)
            
            # Create chart for repeat NCRs
            if len(repeat_df) > 0:
                # Sort by repeat NCR hours and take top 10
                chart_data = repeat_df.sort_values("repeat_ncr_hours", ascending=False).head(10)
                
                fig = px.bar(
                    chart_data,
                    x="part_name",
                    y="repeat_ncr_hours",
                    color="ncr_job_count",
                    title="Top 10 Parts with Repeat NCR Issues",
                    labels={
                        "part_name": "Part",
                        "repeat_ncr_hours": "NCR Hours",
                        "ncr_job_count": "Job Count"
                    },
                    color_continuous_scale=px.colors.sequential.Reds
                )
                
                st.plotly_chart(fig, use_container_width=True)
        else:
            st.info("No repeat NCR data available for this year.")
    
    # 🛠 ADJUSTMENTS TAB
    with tab5:
        st.subheader("Quoting Adjustment Recommendations")
        st.markdown("Based on past performance, this section provides suggested increases to planned hours at job, part, and task level.")
        
        # Adjustment metrics
        adj_metrics_col1, adj_metrics_col2, adj_metrics_col3, adj_metrics_col4 = st.columns(4)
        
        if "job_adjustments" in data and data["job_adjustments"]:
            with adj_metrics_col1:
                avg_adjustment = data.get("avg_adjustment_percent", 0)
                st.metric("Avg Adjustment Needed", format_percent(avg_adjustment/100))
            
            with adj_metrics_col2:
                jobs_requiring_adjustment = len(data["job_adjustments"])
                st.metric("Jobs Needing Adjustment", format_number(jobs_requiring_adjustment, 0))
            
            with adj_metrics_col3:
                parts_requiring_adjustment = len(data.get("part_adjustments", []))
                st.metric("Parts Needing Adjustment", format_number(parts_requiring_adjustment, 0))
            
            with adj_metrics_col4:
                suggested_buffer = data["summary"]["recommended_buffer_percent"]
                st.metric("Suggested Buffer", format_percent(suggested_buffer/100))
            
            # Job-level adjustments
            st.subheader("Job-Level Insights")
            
            job_df = pd.DataFrame(data["job_adjustments"])
            
            # Format columns for display
            display_job_adj = job_df.copy()
            display_job_adj["planned_hours"] = display_job_adj["planned_hours"].apply(format_number)
            display_job_adj["actual_hours"] = display_job_adj["actual_hours"].apply(format_number)
            display_job_adj["suggested_hours"] = display_job_adj["suggested_hours"].apply(format_number)
            display_job_adj["adjustment_percent"] = display_job_adj["adjustment_percent"].apply(lambda x: format_percent(x/100))
            
            # Rename columns
            display_job_adj = display_job_adj.rename(columns={
                "job_number": "Job",
                "planned_hours": "Planned",
                "actual_hours": "Actual",
                "suggested_hours": "Suggested",
                "adjustment_percent": "Adjustment"
            })
            
            st.dataframe(display_job_adj, use_container_width=True, hide_index=True)
            
            # Part-level adjustments
            if "part_adjustments" in data and data["part_adjustments"]:
                st.subheader("Part-Level Insights")
                
                part_df = pd.DataFrame(data["part_adjustments"])
                
                # Format columns for display
                display_part_adj = part_df.copy()
                display_part_adj["avg_planned_hours"] = display_part_adj["avg_planned_hours"].apply(format_number)
                display_part_adj["avg_actual_hours"] = display_part_adj["avg_actual_hours"].apply(format_number)
                display_part_adj["suggested_hours"] = display_part_adj["suggested_hours"].apply(format_number)
                display_part_adj["adjustment_percent"] = display_part_adj["adjustment_percent"].apply(lambda x: format_percent(x/100))
                
                # Rename columns
                display_part_adj = display_part_adj.rename(columns={
                    "part_name": "Part",
                    "avg_planned_hours": "Avg Planned",
                    "avg_actual_hours": "Avg Actual",
                    "suggested_hours": "Suggested",
                    "adjustment_percent": "Adjustment",
                    "job_count": "Jobs"
                })
                
                st.dataframe(display_part_adj, use_container_width=True, hide_index=True)
        else:
            st.info("No adjustment data available for this year.")
else:
    st.warning(f"No data available for year {year}. Please select a different year or upload data.")
