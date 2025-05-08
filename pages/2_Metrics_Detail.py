import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from utils.formatters import format_money, format_number, format_percent
from utils.data_processing import load_metric_data

# Page configuration
st.set_page_config(
    page_title="Metrics Detail",
    page_icon="📈",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Available metrics
METRICS = {
    "planned_hours": "Planned Hours",
    "actual_hours": "Actual Hours",
    "overrun_hours": "Overrun Hours",
    "overrun_percent": "Overrun Percentage",
    "ncr_hours": "NCR Hours",
    "planned_cost": "Planned Cost",
    "actual_cost": "Actual Cost",
    "overrun_cost": "Overrun Cost",
    "avg_cost_per_hour": "Average Cost per Hour",
    "total_jobs": "Total Jobs",
    "total_operations": "Total Operations",
    "total_customers": "Total Customers"
}

# Title and description
st.title("📈 Metrics Detail Analysis")
st.markdown("Detailed analysis of specific metrics across time periods, work centers, and customers.")

# Metric selection
selected_metric = st.selectbox(
    "Select Metric to Analyze", 
    options=list(METRICS.keys()), 
    format_func=lambda x: METRICS.get(x, x)
)

# Function to fetch and process metric data
@st.cache_data(ttl=3600)
def get_metric_data(metric):
    try:
        return load_metric_data(metric)
    except Exception as e:
        st.error(f"Error loading data for metric {metric}: {str(e)}")
        return None

# Load metric data
data = get_metric_data(selected_metric)

if data:
    # ---- METRIC OVERVIEW ----
    st.subheader(f"{METRICS[selected_metric]} Overview")
    
    # Summary metrics
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        st.metric("Overall Total", 
                  format_money(data["summary"]["total"]) if "cost" in selected_metric else format_number(data["summary"]["total"]))
    
    with col2:
        st.metric("Yearly Average", 
                  format_money(data["summary"]["yearly_avg"]) if "cost" in selected_metric else format_number(data["summary"]["yearly_avg"]))
    
    with col3:
        st.metric("Year-over-Year Change", 
                  format_percent(data["summary"]["yoy_change"]/100),
                  delta_color="inverse" if "overrun" in selected_metric or "cost" in selected_metric else "normal")
    
    with col4:
        st.metric("Trend Direction", 
                  data["summary"]["trend_direction"],
                  delta=data["summary"]["trend_strength"])
    
    # ---- YEARLY TREND ----
    st.subheader("Yearly Trend")
    
    # Create yearly trend chart
    if "yearly_data" in data:
        # Debug data structure - safely check if yearly_data exists and has elements
        if isinstance(data["yearly_data"], list) and len(data["yearly_data"]) > 0:
            st.write("Yearly data keys:", list(data["yearly_data"][0].keys()))
        else:
            st.write("Yearly data is empty or not a list")
        
        yearly_df = pd.DataFrame(data["yearly_data"])
        
        # Ensure 'year' column exists
        if "year" not in yearly_df.columns and len(yearly_df) > 0:
            # Try to find a column with year data or create it
            if "date" in yearly_df.columns:
                yearly_df["year"] = yearly_df["date"].str[:4]
            else:
                # Create a placeholder year column 
                yearly_df["year"] = [str(2020 + i) for i in range(len(yearly_df))]
        
        if "cost" in selected_metric:
            y_column = "value"
            y_title = "Cost ($)"
            hovertemplate = "%{y:$,.2f}"
        else:
            y_column = "value"
            y_title = "Hours" if "hours" in selected_metric else "Count"
            hovertemplate = "%{y:,.1f}"
        
        fig = px.line(
            yearly_df, 
            x="year", 
            y=y_column,
            markers=True,
            title=f"{METRICS[selected_metric]} by Year",
            labels={"year": "Year", y_column: y_title}
        )
        
        fig.update_traces(line=dict(width=3), hovertemplate=hovertemplate)
        
        # Add annotations for min and max only if there is data
        if not yearly_df.empty and y_column in yearly_df.columns:
            # Safely handle potential errors
            try:
                max_row = yearly_df.loc[yearly_df[y_column].idxmax()]
                min_row = yearly_df.loc[yearly_df[y_column].idxmin()]
                
                # Only add annotations if year column exists and has valid data
                if "year" in max_row and "year" in min_row:
                    fig.add_annotation(
                        x=max_row["year"],
                        y=max_row[y_column],
                        text="Max",
                        showarrow=True,
                        arrowhead=1,
                        ax=0,
                        ay=-40
                    )
                    
                    fig.add_annotation(
                        x=min_row["year"],
                        y=min_row[y_column],
                        text="Min",
                        showarrow=True,
                        arrowhead=1,
                        ax=0,
                        ay=40
                    )
            except (ValueError, KeyError, TypeError) as e:
                # Log the error but continue
                st.write(f"Warning: Could not add min/max annotations: {e}")
        
        # Update layout
        fig.update_layout(
            xaxis=dict(tickmode="linear"),
            yaxis=dict(title=y_title),
            hovermode="x unified"
        )
        
        st.plotly_chart(fig, use_container_width=True)
    else:
        st.info("No yearly trend data available for this metric.")
    
    # ---- BREAKDOWN BY CATEGORY ----
    tab1, tab2, tab3 = st.tabs(["By Customer", "By Work Center", "By Month"])
    
    # ---- BY CUSTOMER TAB ----
    with tab1:
        if "customer_data" in data and data["customer_data"]:
            customer_df = pd.DataFrame(data["customer_data"])
            
            # Create chart
            fig = px.bar(
                customer_df.sort_values("value", ascending=False).head(10),
                x="customer",
                y="value",
                title=f"Top 10 Customers by {METRICS[selected_metric]}",
                labels={
                    "customer": "Customer",
                    "value": "Cost ($)" if "cost" in selected_metric else "Hours" if "hours" in selected_metric else "Count"
                }
            )
            
            # Format y-axis based on metric type
            if "cost" in selected_metric:
                fig.update_layout(yaxis_tickprefix="$", yaxis_tickformat=",.0f")
            
            st.plotly_chart(fig, use_container_width=True)
            
            # Create table
            display_customer = customer_df.copy()
            if "cost" in selected_metric:
                display_customer["value"] = display_customer["value"].apply(format_money)
            else:
                display_customer["value"] = display_customer["value"].apply(format_number)
            
            display_customer = display_customer.rename(columns={
                "customer": "Customer",
                "value": "Value",
                "percent_of_total": "% of Total"
            })
            
            display_customer["% of Total"] = display_customer["% of Total"].apply(lambda x: format_percent(x/100))
            
            st.dataframe(
                display_customer.sort_values("Value", ascending=False),
                use_container_width=True,
                hide_index=True
            )
        else:
            st.info("No customer breakdown data available for this metric.")
    
    # ---- BY WORK CENTER TAB ----
    with tab2:
        if "workcenter_data" in data and data["workcenter_data"]:
            workcenter_df = pd.DataFrame(data["workcenter_data"])
            
            # Create chart
            fig = px.bar(
                workcenter_df.sort_values("value", ascending=False).head(10),
                x="workcenter",
                y="value",
                title=f"Top 10 Work Centers by {METRICS[selected_metric]}",
                labels={
                    "workcenter": "Work Center",
                    "value": "Cost ($)" if "cost" in selected_metric else "Hours" if "hours" in selected_metric else "Count"
                }
            )
            
            # Format y-axis based on metric type
            if "cost" in selected_metric:
                fig.update_layout(yaxis_tickprefix="$", yaxis_tickformat=",.0f")
            
            st.plotly_chart(fig, use_container_width=True)
            
            # Create table
            display_wc = workcenter_df.copy()
            if "cost" in selected_metric:
                display_wc["value"] = display_wc["value"].apply(format_money)
            else:
                display_wc["value"] = display_wc["value"].apply(format_number)
            
            display_wc = display_wc.rename(columns={
                "workcenter": "Work Center",
                "value": "Value",
                "percent_of_total": "% of Total"
            })
            
            display_wc["% of Total"] = display_wc["% of Total"].apply(lambda x: format_percent(x/100))
            
            st.dataframe(
                display_wc.sort_values("Value", ascending=False),
                use_container_width=True,
                hide_index=True
            )
        else:
            st.info("No work center breakdown data available for this metric.")
    
    # ---- BY MONTH TAB ----
    with tab3:
        if "monthly_data" in data and data["monthly_data"]:
            monthly_df = pd.DataFrame(data["monthly_data"])
            
            # Ensure months are ordered correctly
            month_order = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
            monthly_df["month"] = pd.Categorical(monthly_df["month"], categories=month_order, ordered=True)
            monthly_df = monthly_df.sort_values("month")
            
            # Create chart
            fig = px.line(
                monthly_df,
                x="month",
                y="value",
                markers=True,
                title=f"{METRICS[selected_metric]} by Month (Average Across Years)",
                labels={
                    "month": "Month",
                    "value": "Cost ($)" if "cost" in selected_metric else "Hours" if "hours" in selected_metric else "Count"
                }
            )
            
            # Format y-axis based on metric type
            if "cost" in selected_metric:
                fig.update_layout(yaxis_tickprefix="$", yaxis_tickformat=",.0f")
            
            fig.update_traces(line=dict(width=3))
            
            st.plotly_chart(fig, use_container_width=True)
            
            # Create table
            display_monthly = monthly_df.copy()
            if "cost" in selected_metric:
                display_monthly["value"] = display_monthly["value"].apply(format_money)
            else:
                display_monthly["value"] = display_monthly["value"].apply(format_number)
            
            display_monthly = display_monthly.rename(columns={
                "month": "Month",
                "value": "Value"
            })
            
            st.dataframe(display_monthly, use_container_width=True, hide_index=True)
        else:
            st.info("No monthly breakdown data available for this metric.")
    
    # ---- CORRELATION ANALYSIS ----
    st.subheader("Correlation Analysis")
    
    if "correlations" in data and data["correlations"]:
        corr_df = pd.DataFrame(data["correlations"])
        
        # Create correlation chart
        fig = px.bar(
            corr_df,
            x="metric",
            y="correlation",
            title=f"Metrics Correlated with {METRICS[selected_metric]}",
            labels={
                "metric": "Metric",
                "correlation": "Correlation Coefficient"
            },
            color="correlation",
            color_continuous_scale=px.colors.diverging.RdBu_r,
            range_color=[-1, 1]
        )
        
        fig.update_layout(xaxis_tickangle=-45)
        
        st.plotly_chart(fig, use_container_width=True)
        
        # Create table
        display_corr = corr_df.copy()
        
        # Store numeric values for sorting before formatting to strings
        numeric_corr = display_corr["correlation"].copy()
        
        # Format correlation as string with 3 decimal places
        display_corr["correlation"] = display_corr["correlation"].apply(lambda x: f"{x:.3f}")
        
        display_corr = display_corr.rename(columns={
            "metric": "Metric",
            "correlation": "Correlation",
            "strength": "Strength"
        })
        
        # Sort the DataFrame using the numeric values before displaying
        sorted_indices = numeric_corr.abs().sort_values(ascending=False).index
        display_corr = display_corr.reindex(sorted_indices)
        
        st.dataframe(
            display_corr,
            use_container_width=True,
            hide_index=True
        )
    else:
        st.info("No correlation data available for this metric.")
else:
    st.warning(f"No data available for the selected metric: {METRICS[selected_metric]}")
