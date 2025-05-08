
#Manager Dashboard Python Code---------------------------------Work History Code Is below the end of the manager code------------------------------------------------------------
@app.route("/manager")
def manager_dashboard():
    return render_template("manager_dashboard.html")


@app.route("/api/manager/active_jobs")
def manager_active_jobs():
    active_summary, di_summary, totals = get_active_job_summary_from_db()
    return jsonify({
        "active_summary": active_summary,
        "di_summary": di_summary,
        "totals": totals
    })

@app.route('/api/save_reference_name', methods=['POST'])
def save_reference_name():
    data = request.get_json()
    job_number = data.get("job_number")
    reference_name = data.get("reference_name")

    if not job_number or reference_name is None:
        return jsonify(success=False, error="Invalid input"), 400

    reference_names = load_reference_names()
    reference_names[str(job_number)] = reference_name

    with open("reference_names.json", "w") as f:
        json.dump(reference_names, f, indent=2)

    return jsonify(success=True)

@app.route('/api/save_due_date', methods=['POST'])
def save_due_date():
    data = request.get_json()
    job_number = data.get("job_number")
    due_date = data.get("due_date")

    if not job_number or not due_date:
        return jsonify(success=False, error="Invalid input"), 400

    due_dates = load_due_dates()
    due_dates[str(job_number)] = due_date

    with open("due_dates.json", "w") as f:
        json.dump(due_dates, f, indent=2)

    return jsonify(success=True)



def get_active_job_summary_from_db():
    """
    Returns active and D&I job summaries using database models including PO integration.
    Ensures no duplicate operations are included.
    """
    reference_names = load_reference_names()
    due_dates = load_due_dates()
    order_values = get_order_values()

    active_summary = []
    di_summary = []
    total_values = {
        "total_jobs": 0,
        "total_planned_hours": 0,
        "total_actual_hours": 0,
        "total_projected_hours": 0,
        "total_planned_cost": 0,
        "total_actual_cost": 0,
        "total_projected_cost": 0,
        "total_order_value": 0,
        "total_profit_value": 0,
        "average_profit_margin": 0,
    }
    profit_margins = []

    jobs = Job.query.options(
        joinedload(Job.work_orders).joinedload(WorkOrder.operations)
    ).filter_by(active=True).all()

    for job in jobs:
        job_number = job.job_number

        # 🔍 Deduplicate operations using operation.id
        # Deduplicate operations based on unique operation identity
        seen_ops = set()
        all_operations = []

        for wo in job.work_orders:
            for op in wo.operations:
                key = (wo.work_order_number, op.operation_number, op.task_description)
                if key not in seen_ops:
                    seen_ops.add(key)
                    all_operations.append(op)


        if not all_operations:
            continue

        part_names = set(op.part_name for op in all_operations if op.part_name)
        is_di_job = all(
            name == "Dismantling & Inspection" or
            sum(op.planned_hours for op in all_operations if op.part_name == name) == 0
            for name in part_names
        )

        total_planned_hours = sum(op.planned_hours for op in all_operations)
        total_actual_hours = sum(op.actual_hours for op in all_operations)
        remaining_hours = sum(op.remaining_work for op in all_operations)
        projected_hours = total_actual_hours + remaining_hours

        total_planned_labor_cost = sum(
            calculate_cost(op.planned_hours, op.part_name, op.work_center, op.task_description)
            for op in all_operations
        )
        total_actual_labor_cost = sum(
            calculate_cost(op.actual_hours, op.part_name, op.work_center, op.task_description)
            for op in all_operations
        )

        po_records = PurchaseOrder.query.filter_by(job_number=job_number).all()
        total_goods_cost = sum(po.net_price * po.order_quantity for po in po_records)
        still_to_be_delivered_value = sum(po.pending_value for po in po_records)
        cost_goods_received = total_goods_cost - still_to_be_delivered_value

        order_value = order_values.get(job_number)
        warranty_cost = order_value * 0.015 if order_value else 0

        total_planned_cost = total_planned_labor_cost + total_goods_cost + warranty_cost
        total_actual_cost = total_actual_labor_cost + cost_goods_received + warranty_cost
        projected_cost = (
            calculate_cost(total_actual_hours) +
            calculate_cost(remaining_hours) +
            total_goods_cost
        )

        if order_value:
            profit_value = order_value - total_actual_cost
            profit_margin = (profit_value / order_value) * 100
        else:
            profit_value = None
            profit_margin = None

        due_date_str = due_dates.get(job_number)
        try:
            due_date = datetime.strptime(due_date_str, "%Y-%m-%d") if due_date_str else None
        except ValueError:
            due_date = None
        due_date_formatted = due_date.strftime('%Y-%m-%d') if due_date else "No Due Date Assigned"

        job_data = {
            'job_number': job_number,
            'customer': job.customer_name or "Unknown Customer",
            'total_planned_hours': format_number(total_planned_hours),
            'total_actual_hours': format_number(total_actual_hours),
            'projected_hours': format_number(projected_hours),
            'total_planned_cost': format_number(total_planned_cost),
            'total_actual_cost': format_number(total_actual_cost),
            'projected_cost': format_number(projected_cost),
            'order_value': format_number(order_value) if order_value else 'N/A',
            'profit_value': format_number(profit_value) if profit_value else 'N/A',
            'profit_margin': format_number(profit_margin) if profit_margin else 'N/A',
            'reference_name': reference_names.get(job_number, ""),
            'due_date': due_dates.get(job_number, ""),
            'due_date_formatted': due_date_formatted,
        }

        if is_di_job:
            di_summary.append(job_data)
        else:
            active_summary.append(job_data)

        total_values["total_jobs"] += 1
        total_values["total_planned_hours"] += total_planned_hours
        total_values["total_actual_hours"] += total_actual_hours
        total_values["total_projected_hours"] += projected_hours
        total_values["total_planned_cost"] += total_planned_cost
        total_values["total_actual_cost"] += total_actual_cost
        total_values["total_projected_cost"] += projected_cost
        if order_value:
            total_values["total_order_value"] += order_value
        if profit_value:
            total_values["total_profit_value"] += profit_value
        if profit_margin:
            profit_margins.append(profit_margin)

    if profit_margins:
        total_values["average_profit_margin"] = sum(profit_margins) / len(profit_margins)

    total_values = {
        key: format_number(value) if key != "total_jobs" else value
        for key, value in total_values.items()
    }



    # Safely convert due date strings to datetime objects (fallback to max date)
    def parse_due_date(job):
        try:
            return datetime.strptime(job.get("due_date", ""), "%Y-%m-%d")
        except Exception:
            return datetime.max

    active_summary.sort(key=parse_due_date)
    di_summary.sort(key=parse_due_date)

    return active_summary, di_summary, total_values


def get_order_values():
    """
    Load order values from order_values.json in the same directory as this script.
    """
    try:
        file_path = os.path.join(os.path.dirname(__file__), 'order_values.json')
        with open(file_path, 'r') as file:
            order_values = json.load(file)
        return {str(k): v for k, v in order_values.items()}
    except FileNotFoundError:
        print("Error: order_values.json file not found.")
        return {}
    except json.JSONDecodeError:
        print("Error: order_values.json is not valid JSON.")
        return {}
    except Exception as e:
        print(f"Error loading order values: {e}")
        return {}

def calculate_cost(hours, description=None, work_center=None, task_description=None):
    """
    Calculate labor cost with reduced burden rate for engineering/admin/RC-type tasks.
    """
    default_burden_rate = 199
    reduced_burden_rate = 10

    if (
        description in ['RC', 'Engineering', 'Admin', 'RC / Engineering / Admin.'] or 
        work_center == 'REP ENG' or 
        task_description == 'Engineering Time'
    ):
        burden_rate = reduced_burden_rate
    else:
        burden_rate = default_burden_rate

    return hours * burden_rate

def format_number(value):
    """
    Format numbers for display, fallback to string if error occurs.
    """
    if value is None:
        return 'N/A'
    try:
        return "{:,.2f}".format(value)
    except:
        return str(value)
    
#For job KPI page
@app.route('/job_kpi/<job_number>')
def job_kpi(job_number):
    # 🧱 Load external data
    due_dates = load_due_dates()
    order_values = get_order_values()
    reference_names = load_reference_names()

    # 🔍 Look up job by job number
    job = Job.query.options(joinedload(Job.work_orders).joinedload(WorkOrder.operations)).filter_by(job_number=job_number).first()
    if not job:
        return render_template('job_kpi.html', job_number=job_number, message="No data found.")

    # ✅ Deduplicate operations based on composite key
    seen_ops = set()
    all_operations = []

    for wo in job.work_orders:
        for op in wo.operations:
            key = (wo.work_order_number, op.operation_number, op.task_description)
            if key not in seen_ops:
                seen_ops.add(key)
                all_operations.append(op)

    if not all_operations:
        return render_template('job_kpi.html', job_number=job_number, message="No operations found.")

    # ⏱ Hours and Labor Costs
    total_planned_hours = sum(op.planned_hours for op in all_operations)
    total_actual_hours = sum(op.actual_hours for op in all_operations)
    total_planned_labor_cost = sum(calculate_cost(op.planned_hours, op.part_name, op.work_center, op.task_description) for op in all_operations)
    total_actual_labor_cost = sum(calculate_cost(op.actual_hours, op.part_name, op.work_center, op.task_description) for op in all_operations)

    # 📦 Purchase Orders
    purchase_orders = PurchaseOrder.query.filter_by(job_number=job_number).all()
    total_goods_cost = sum(po.net_price * po.order_quantity for po in purchase_orders)
    pending_value = sum(po.pending_value for po in purchase_orders)
    cost_goods_received = total_goods_cost - pending_value
    quantity_goods_to_be_received = sum(po.pending_quantity for po in purchase_orders)
    quantity_goods_received = sum(po.order_quantity - po.pending_quantity for po in purchase_orders)

    # 💰 Order Value + Warranty
    order_value = order_values.get(job_number)
    warranty_cost = order_value * 0.015 if order_value else 0

    total_planned_cost = total_planned_labor_cost + total_goods_cost + warranty_cost
    total_actual_cost = total_actual_labor_cost + cost_goods_received + warranty_cost

    profit_value = order_value - total_actual_cost if order_value else None
    profit_margin = (profit_value / order_value) * 100 if order_value else None

    # 🎯 Over/Under Hours
    over_hours = [op for op in all_operations if op.actual_hours > op.planned_hours]
    under_hours = [op for op in all_operations if op.actual_hours < op.planned_hours]

    # 📅 Metadata
    customer_name = job.customer_name or "Unknown"
    due_date = due_dates.get(job_number, "")

    # 📊 Group by work center
    from collections import defaultdict
    wc_summary = defaultdict(lambda: {"planned": 0, "actual": 0})
    for op in all_operations:
        wc_summary[op.work_center]["planned"] += op.planned_hours or 0
        wc_summary[op.work_center]["actual"] += op.actual_hours or 0

    work_center_summary = [{"work_center": wc, "planned": format_number(data["planned"]), "actual": format_number(data["actual"])} for wc, data in wc_summary.items()]

    # 📊 Overrun Summary by Part, Task, and Work Center
    overrun_details = []
    for op in over_hours:
        extra_hours = op.actual_hours - op.planned_hours
        extra_cost = calculate_cost(extra_hours, op.part_name, op.work_center, op.task_description)
        overrun_details.append({
            "part": op.part_name,
            "work_center": op.work_center,
            "task_description": op.task_description,
            "extra_hours": round(extra_hours, 1),
            "extra_cost": round(extra_cost, 2)
        })

    # 🕒 Delayed Purchase Orders
    today = datetime.now().date()
    delayed_pos = []
    for po in purchase_orders:
        if po.expected_delivery and po.expected_delivery.date() < today and po.pending_quantity > 0:
            days_late = (today - po.expected_delivery.date()).days
            delayed_pos.append({
                "po_number": po.po_number,
                "description": po.description,
                "expected_delivery": po.expected_delivery.date(),
                "days_late": days_late,
                "pending_value": po.pending_value,
            })

    # ⛔ Idle Operations
    idle_operations = [op for op in all_operations if op.actual_hours == 0 and op.status != "Complete" and op.planned_hours > 0]

    # 📋 Task Cost Rankings
    task_costs = sorted([
        {
            "task": op.task_description,
            "part": op.part_name,
            "work_center": op.work_center,
            "planned_cost": calculate_cost(op.planned_hours, op.part_name, op.work_center, op.task_description),
            "actual_cost": calculate_cost(op.actual_hours, op.part_name, op.work_center, op.task_description),
        }
        for op in all_operations
    ], key=lambda x: x["actual_cost"], reverse=True)

    # 🧠 Root Cause Flags
    flags = []
    if profit_margin is not None and profit_margin < 0:
        flags.append("🔴 Profit Margin Negative")

    if any(overrun["extra_hours"] > 2 for overrun in overrun_details):
        flags.append("⚠️ Significant labor overrun")

    if delayed_pos:
        flags.append("📦 Delayed purchase orders affecting job timeline")

    if idle_operations:
        flags.append("⛔ Idle tasks with no recorded progress")
    unique_parts = len(set(row['part'] for row in overrun_details))
    total_overrun_hours = sum(row['extra_hours'] for row in overrun_details)
    total_overrun_cost = round(sum(row['extra_cost'] for row in overrun_details), 2)

    # 🎯 Refined Top Cost Drivers – real overrun tasks in repair phase
    from collections import defaultdict

    driver_summary = defaultdict(lambda: {"planned": 0, "actual": 0, "extra_hours": 0, "extra_cost": 0})
    # 💵 Part-Level Totals (across all operations, for context)
    part_cost_totals = defaultdict(lambda: {"planned": 0, "actual": 0})

    for op in all_operations:
        if not op.part_name:
            continue
        part_cost_totals[op.part_name]["planned"] += calculate_cost(op.planned_hours or 0, op.part_name, op.work_center, op.task_description)
        part_cost_totals[op.part_name]["actual"] += calculate_cost(op.actual_hours or 0, op.part_name, op.work_center, op.task_description)

    for op in over_hours:
        if (
            not op.planned_hours or op.planned_hours == 0 or
            (op.part_name and "dismantling & inspection" in op.part_name.lower()) or
            (op.work_center and op.work_center.strip().upper() == "DNI")
        ):
            continue  # skip if not a real repair overrun

        key = (op.part_name, op.task_description, op.work_center)
        planned = op.planned_hours or 0
        actual = op.actual_hours or 0
        extra_hours = actual - planned
        extra_cost = calculate_cost(extra_hours, op.part_name, op.work_center, op.task_description)

        driver_summary[key]["planned"] += planned
        driver_summary[key]["actual"] += actual
        driver_summary[key]["extra_hours"] += extra_hours
        driver_summary[key]["extra_cost"] += extra_cost

        top_cost_drivers = sorted([
            {
                "part": k[0],
                "task": k[1],
                "work_center": k[2],
                "planned_hours": round(v["planned"], 1),
                "actual_hours": round(v["actual"], 1),
                "extra_hours": round(v["extra_hours"], 1),
                "cost_overrun": round(v["extra_cost"], 2),
                "total_part_planned_cost": round(part_cost_totals[k[0]]["planned"], 2),
                "total_part_actual_cost": round(part_cost_totals[k[0]]["actual"], 2),
            }
            for k, v in driver_summary.items()
        ], key=lambda x: x["cost_overrun"], reverse=True)[:4]

    driver_total_cost = round(sum(d["cost_overrun"] for d in top_cost_drivers), 2)
    job_total_overrun_cost = total_overrun_cost or 1  # avoid divide-by-zero
    driver_cost_pct = round((driver_total_cost / job_total_overrun_cost) * 100, 1)
    labor_cost_pct_over = round(((total_actual_labor_cost - total_planned_labor_cost) / total_planned_labor_cost) * 100, 1) if total_planned_labor_cost else 0

    # 📊 Work Center Trends - Completed Ops Performance
    work_center_trends = []
    wc_efficiency_map = {}

    for wc, ops in defaultdict(list, {
        op.work_center: [op for op in all_operations if op.status == "Complete" and op.work_center == op.work_center]
    }).items():
        if not wc or not ops:
            continue

        planned = sum(op.planned_hours or 0 for op in ops)
        actual = sum(op.actual_hours or 0 for op in ops)
        efficiency = round((planned / actual) * 100, 1) if actual else 0
        planned_cost = sum(calculate_cost(op.planned_hours or 0, op.part_name, op.work_center, op.task_description) for op in ops)
        actual_cost = sum(calculate_cost(op.actual_hours or 0, op.part_name, op.work_center, op.task_description) for op in ops)
        cost_variance = actual_cost - planned_cost

        wc_efficiency_map[wc] = efficiency

        work_center_trends.append({
            "work_center": wc,
            "ops_completed": len(ops),
            "planned_hours": round(planned, 1),
            "actual_hours": round(actual, 1),
            "efficiency": efficiency,
            "planned_cost": round(planned_cost, 2),
            "actual_cost": round(actual_cost, 2),
            "cost_variance": round(cost_variance, 2),
        })

    # 🔢 Summary Metrics
    total_completed_ops = sum(wc["ops_completed"] for wc in work_center_trends)
    avg_efficiency = round(sum(wc["efficiency"] for wc in work_center_trends) / len(work_center_trends), 1) if work_center_trends else 0

    # Identify Best/Worst
    best_wc = max(wc_efficiency_map.items(), key=lambda x: x[1], default=(None, None))[0]
    worst_wc = min(wc_efficiency_map.items(), key=lambda x: x[1], default=(None, None))[0]


    return render_template(
        "job_kpi.html",
        job_number=job_number,
        customer_name=customer_name,
        due_date=due_date,
        total_planned_hours=format_number(total_planned_hours),
        total_actual_hours=format_number(total_actual_hours),
        total_planned_cost=format_number(total_planned_cost),
        total_actual_cost=format_number(total_actual_cost),
        total_planned_labor_cost=format_number(total_planned_labor_cost),
        total_actual_labor_cost=format_number(total_actual_labor_cost),
        order_value=format_number(order_value) if order_value else "N/A",
        profit_value=format_number(profit_value) if profit_value else "N/A",
        profit_margin=format_number(profit_margin) if profit_margin else "N/A",
        over_hours=over_hours,
        under_hours=under_hours,
        total_goods_cost=format_number(total_goods_cost),
        cost_goods_received=format_number(cost_goods_received),
        cost_goods_to_be_received=format_number(pending_value),
        quantity_goods_to_be_received=quantity_goods_to_be_received,
        quantity_goods_received=quantity_goods_received,
        job_purchase_orders=purchase_orders,
        work_center_summary=work_center_summary,
        over_hours_count=len(over_hours),
        under_or_on_target_hours_count=len(all_operations) - len(over_hours),
        overrun_details=overrun_details,
        delayed_pos=delayed_pos,
        idle_operations=idle_operations,
        task_costs=task_costs,
        flags=flags,
        unique_parts=unique_parts,
        total_overrun_hours=total_overrun_hours,
        total_overrun_cost=total_overrun_cost,
        top_cost_drivers=top_cost_drivers,
        driver_total_cost=driver_total_cost,
        driver_cost_pct=driver_cost_pct,
        labor_cost_pct_over=labor_cost_pct_over,
        work_center_trends=work_center_trends,
        total_completed_ops=total_completed_ops,
        avg_efficiency=avg_efficiency,
        best_wc=best_wc,
        worst_wc=worst_wc,


    )

#End Manager Dashboard Python-------------------------------------------------------------------------------------------------------------------------


#Start Workhistory Python Code-----------------------------------------------------------------------------------------------------------------------


#Work history clickable cards to take user to metrics page
@workhistory_api.route("/workhistory/metric/<metric>")
def view_metric_detail_page(metric):
    return render_template("metric_detail.html", metric=metric)

@workhistory_api.route("/api/workhistory/metric/<metric>")
def get_metric_detail(metric):
    from sqlalchemy import or_
    import logging

    logger = logging.getLogger(__name__)
    BURDEN_RATE = 199

    valid_metrics = {
        "ncr_hours", "planned_hours", "actual_hours", "overrun_hours",
        "planned_cost", "actual_cost", "overrun_cost", "overrun_percent",
        "total_operations", "total_jobs", "total_customers",
        "avg_cost_per_hour", "avg_job_size"
    }

    if metric not in valid_metrics:
        return jsonify({"error": f"Unsupported metric: {metric}"}), 400

    try:
        filters = {
            "ncr_hours": JobHistory.work_center == "NCR",
            "planned_hours": JobHistory.planned_hours > 0,
            "actual_hours": JobHistory.actual_hours > 0,
            "planned_cost": None,
            "actual_cost": None,
            "overrun_hours": JobHistory.actual_hours > JobHistory.planned_hours,
            "overrun_cost": JobHistory.actual_hours > JobHistory.planned_hours,
            "overrun_percent": JobHistory.actual_hours > JobHistory.planned_hours,
            "avg_cost_per_hour": None,
            "avg_job_size": None,
            "total_operations": None,
            "total_jobs": None,
            "total_customers": None
        }

        filter_condition = filters[metric]

        query = db.session.query(
            JobHistory.job_number,
            JobHistory.customer_name,
            JobHistory.part_name,
            JobHistory.work_order_number,
            JobHistory.work_center,
            JobHistory.task_description,
            JobHistory.planned_hours,
            JobHistory.actual_hours,
            JobHistory.operation_finish_date
        )

        if filter_condition is not None:
            query = query.filter(filter_condition)

        results = query.order_by(JobHistory.operation_finish_date.desc()).all()

        rows = []
        for row in results:
            overrun = (row.actual_hours or 0) - (row.planned_hours or 0)
            rows.append({
                "job_number": row.job_number,
                "customer_name": row.customer_name,
                "part_name": row.part_name,
                "work_order_number": row.work_order_number,
                "work_center": row.work_center,
                "task_description": row.task_description,
                "planned_hours": float(row.planned_hours or 0),
                "actual_hours": float(row.actual_hours or 0),
                "overrun_hours": float(overrun if overrun > 0 else 0),
                "finish_date": row.operation_finish_date.strftime("%Y-%m-%d") if row.operation_finish_date else ""
            })

        logger.info(f"🔍 Metric '{metric}' returned {len(rows)} rows")
        return jsonify({
            "metric": metric,
            "count": len(rows),
            "rows": rows
        })

    except Exception as e:
        logger.exception(f"❌ Error in metric detail API for '{metric}'")
        return jsonify({"error": "Internal server error", "details": str(e)}), 500

workhistory_api = Blueprint('workhistory_api', __name__)

BURDEN_RATE = 199
@main_bp.route("/workhistory")
def workhistory_dashboard():
    return render_template("work_history.html")

#takes user to page specific to data by year
@workhistory_api.route("/workhistory/year/<int:year>")
def work_history_year(year):
    return render_template("work_history_year.html", year=year)

#This new API route works with the one above, This code is for year specific page
@workhistory_api.route("/api/workhistory/summary/year/<int:year>")
def get_yearly_summary_breakdown(year):
    from sqlalchemy import case, distinct

    BURDEN_RATE = 199

    overrun_case = case(
        (JobHistory.actual_hours > JobHistory.planned_hours,
         JobHistory.actual_hours - JobHistory.planned_hours),
        else_=0
    )
    ghost_case = case(
        (JobHistory.actual_hours == 0, JobHistory.planned_hours),
        else_=0
    )

    # 🔹 1. Summary Totals
    summary_result = db.session.query(
        func.sum(JobHistory.planned_hours),
        func.sum(JobHistory.actual_hours),
        func.sum(overrun_case),
        func.sum(JobHistory.actual_hours * BURDEN_RATE),
        func.sum(JobHistory.planned_hours * BURDEN_RATE),
        func.count(JobHistory.id),
        func.count(func.distinct(JobHistory.job_number)),
        func.count(func.distinct(JobHistory.customer_name)),
        func.sum(case((JobHistory.work_center.ilike("NCR"), JobHistory.actual_hours), else_=0)),
        func.count(func.distinct(JobHistory.part_name)),
        func.sum(ghost_case)
    ).filter(func.extract('year', JobHistory.operation_finish_date) == year).first()

    total_planned = float(summary_result[0] or 0)
    total_actual = float(summary_result[1] or 0)
    total_overrun = float(summary_result[2] or 0)
    ghost_hours = float(summary_result[10] or 0)

    opportunity_hours = total_overrun + ghost_hours
    buffer_percent = (opportunity_hours / total_planned * 100) if total_planned else 0

    summary = {
        "year": year,
        "total_planned_hours": total_planned,
        "total_actual_hours": total_actual,
        "total_overrun_hours": total_overrun,
        "ghost_hours": ghost_hours,
        "opportunity_cost_hours": opportunity_hours,
        "opportunity_cost_dollars": opportunity_hours * BURDEN_RATE,
        "recommended_buffer_percent": round(buffer_percent, 2),
        "total_actual_cost": float(summary_result[3] or 0),
        "total_planned_cost": float(summary_result[4] or 0),
        "total_operations": int(summary_result[5] or 0),
        "total_jobs": int(summary_result[6] or 0),
        "total_customers": int(summary_result[7] or 0),
        "total_ncr_hours": float(summary_result[8] or 0),
        "total_unique_parts": int(summary_result[9] or 0)
    }

    # 🔹 2. Top Overruns
    top_overruns_query = db.session.query(
        JobHistory.job_number,
        JobHistory.part_name,
        JobHistory.work_center,
        JobHistory.task_description,
        JobHistory.planned_hours,
        JobHistory.actual_hours,
        (JobHistory.actual_hours - JobHistory.planned_hours).label("overrun_hours"),
        ((JobHistory.actual_hours - JobHistory.planned_hours) * BURDEN_RATE).label("overrun_cost")
    ).filter(
        func.extract('year', JobHistory.operation_finish_date) == year,
        JobHistory.actual_hours > JobHistory.planned_hours,
        ~JobHistory.task_description.ilike("%Dismantling & Inspection%")
    ).order_by(((JobHistory.actual_hours - JobHistory.planned_hours) * BURDEN_RATE).desc()).limit(10).all()

    top_overruns = [
        {
            "job_number": row.job_number,
            "part_name": row.part_name,
            "work_center": row.work_center,
            "task_description": row.task_description,
            "planned_hours": float(row.planned_hours or 0),
            "actual_hours": float(row.actual_hours or 0),
            "overrun_hours": float(row.overrun_hours or 0),
            "overrun_cost": float(row.overrun_cost or 0)
        }
        for row in top_overruns_query
    ]

    # 🔹 3. NCR Summary by Part
    ncr_summary_query = db.session.query(
        JobHistory.part_name,
        func.sum(JobHistory.actual_hours).label("total_ncr_hours"),
        func.sum(JobHistory.actual_hours * BURDEN_RATE).label("total_ncr_cost"),
        func.count(JobHistory.id).label("ncr_occurrences")
    ).filter(
        func.extract('year', JobHistory.operation_finish_date) == year,
        JobHistory.work_center.ilike("NCR")
    ).group_by(JobHistory.part_name).order_by(func.sum(JobHistory.actual_hours * BURDEN_RATE).desc()).all()

    ncr_summary = [
        {
            "part_name": row.part_name,
            "total_ncr_hours": float(row.total_ncr_hours or 0),
            "total_ncr_cost": float(row.total_ncr_cost or 0),
            "ncr_occurrences": row.ncr_occurrences
        }
        for row in ncr_summary_query
    ]

    # 🔹 4. Work Center Performance
    wc_query = db.session.query(
        JobHistory.work_center,
        func.sum(JobHistory.planned_hours),
        func.sum(JobHistory.actual_hours),
        func.sum(overrun_case),
        func.sum(overrun_case * BURDEN_RATE)
    ).filter(
        func.extract('year', JobHistory.operation_finish_date) == year
    ).group_by(JobHistory.work_center).order_by(func.sum(JobHistory.actual_hours).desc()).all()

    workcenter_summary = [
        {
            "work_center": row[0],
            "planned_hours": float(row[1] or 0),
            "actual_hours": float(row[2] or 0),
            "overrun_hours": float(row[3] or 0),
            "overrun_cost": float(row[4] or 0)
        }
        for row in wc_query
    ]

    # 🔹 5. Repeat NCR Failures
    repeat_ncr_raw = db.session.query(
        JobHistory.part_name,
        func.count(func.distinct(JobHistory.job_number)).label("distinct_jobs"),
        func.sum(JobHistory.actual_hours).label("repeat_ncr_hours")
    ).filter(
        func.extract('year', JobHistory.operation_finish_date) == year,
        JobHistory.work_center.ilike("NCR")
    ).group_by(JobHistory.part_name).having(func.count(func.distinct(JobHistory.job_number)) > 1).all()

    repeat_ncr_failures = [
        {
            "part_name": row.part_name,
            "repeat_ncr_hours": float(row.repeat_ncr_hours or 0),
            "total_ncr_jobs": row.distinct_jobs
        }
        for row in repeat_ncr_raw
    ]

    # 🔹 6. Quarterly Summary
    quarterly_raw = db.session.query(
        JobHistory.operation_finish_date,
        func.sum(JobHistory.planned_hours),
        func.sum(JobHistory.actual_hours),
        func.sum(overrun_case),
        func.sum(overrun_case * BURDEN_RATE),
        func.count(func.distinct(JobHistory.job_number))
    ).filter(
        func.extract('year', JobHistory.operation_finish_date) == year
    ).group_by(JobHistory.operation_finish_date).all()

    quarter_map = {}
    for row in quarterly_raw:
        date = row[0]
        if not date:
            continue
        q = (date.month - 1) // 3 + 1
        label = f"Q{q} {date.year}"
        if label not in quarter_map:
            quarter_map[label] = {
                "planned_hours": 0.0,
                "actual_hours": 0.0,
                "overrun_hours": 0.0,
                "overrun_cost": 0.0,
                "total_jobs": 0
            }
        quarter_map[label]["planned_hours"] += float(row[1] or 0)
        quarter_map[label]["actual_hours"] += float(row[2] or 0)
        quarter_map[label]["overrun_hours"] += float(row[3] or 0)
        quarter_map[label]["overrun_cost"] += float(row[4] or 0)
        quarter_map[label]["total_jobs"] += int(row[5] or 0)

    quarterly_summary = [
        {"quarter": label, **values}
        for label, values in sorted(quarter_map.items())
    ]

    # 🔹 7. Job Adjustments
    job_adjustments_raw = db.session.query(
        JobHistory.job_number,
        func.sum(JobHistory.planned_hours),
        func.sum(JobHistory.actual_hours),
        func.sum(overrun_case)
    ).filter(
        func.extract('year', JobHistory.operation_finish_date) == year
    ).group_by(JobHistory.job_number).having(func.sum(overrun_case) > 0).all()

    job_adjustments = [
        {
            "job_number": row[0],
            "total_planned": float(row[1] or 0),
            "total_actual": float(row[2] or 0),
            "needed_increase": float(row[3] or 0)
        }
        for row in job_adjustments_raw
    ]

    # 🔹 8. Overrun Adjustment Recommendations by Part
    part_overruns_raw = db.session.query(
        JobHistory.part_name,
        func.sum(JobHistory.planned_hours).label("total_planned"),
        func.sum(JobHistory.actual_hours).label("total_actual"),
        func.sum(overrun_case).label("total_overrun")
    ).filter(
        func.extract('year', JobHistory.operation_finish_date) == year,
        JobHistory.actual_hours > JobHistory.planned_hours
    ).group_by(JobHistory.part_name).having(func.sum(overrun_case) > 0).order_by(func.sum(overrun_case).desc()).limit(20).all()

    part_overruns = [
        {
            "part_name": row.part_name,
            "total_planned": float(row.total_planned or 0),
            "total_actual": float(row.total_actual or 0),
            "overrun_hours": float(row.total_overrun or 0),
            "suggested_percent_increase": round((row.total_overrun / row.total_planned) * 100, 1) if row.total_planned else 0
        }
        for row in part_overruns_raw
    ]

    # 🔹 9. Task-Level Overrun Breakdown (for parts above)
    tracked_parts = [row.part_name for row in part_overruns_raw]

    task_breakdown_raw = db.session.query(
        JobHistory.part_name,
        JobHistory.task_description,
        func.sum(JobHistory.planned_hours).label("total_planned"),
        func.sum(JobHistory.actual_hours).label("total_actual"),
        func.sum(overrun_case).label("total_overrun")
    ).filter(
        func.extract('year', JobHistory.operation_finish_date) == year,
        JobHistory.actual_hours > JobHistory.planned_hours,
        JobHistory.part_name.in_(tracked_parts)
    ).group_by(JobHistory.part_name, JobHistory.task_description).having(func.sum(overrun_case) > 0).all()

    part_task_details = [
        {
            "part_name": row.part_name,
            "task_description": row.task_description,
            "total_planned": float(row.total_planned or 0),
            "total_actual": float(row.total_actual or 0),
            "overrun_hours": float(row.total_overrun or 0),
            "suggested_percent_increase": round((row.total_overrun / row.total_planned) * 100, 1) if row.total_planned else 0
        }
        for row in task_breakdown_raw
    ]


    # 🔹 9. NCR Averages (All-Time)
    years_with_ncr = db.session.query(
        func.extract('year', JobHistory.operation_finish_date)
    ).filter(
        JobHistory.work_center.ilike("NCR")
    ).distinct().all()
    year_count = len(years_with_ncr)

    total_ncr_cost = db.session.query(
        func.sum(JobHistory.actual_hours * BURDEN_RATE)
    ).filter(
        JobHistory.work_center.ilike("NCR")
    ).scalar() or 0

    total_parts = db.session.query(
        func.count(distinct(JobHistory.part_name))
    ).filter(
        JobHistory.work_center.ilike("NCR")
    ).scalar() or 0

    ncr_averages = {
        "avg_ncr_cost_per_year": round(total_ncr_cost / year_count, 2) if year_count else 0,
        "avg_parts_with_ncr_per_year": round(total_parts / year_count, 1) if year_count else 0
    }

    # ✅ Final JSON Response
    return jsonify({
        "summary": summary,
        "top_overruns": top_overruns,
        "ncr_summary": ncr_summary,
        "workcenter_summary": workcenter_summary,
        "repeat_ncr_failures": repeat_ncr_failures,
        "quarterly_summary": quarterly_summary,
        "job_adjustments": job_adjustments,
        "part_overruns": part_overruns,
        "part_task_details": part_task_details,
        "ncr_averages": ncr_averages
    })



#API for fetching job specific information when clicking a part in NCR section
@workhistory_api.route("/api/workhistory/ncr/details")
def get_ncr_part_details():
    from sqlalchemy import distinct

    year = request.args.get("year", type=int)
    part = request.args.get("part", type=str)

    # 🔹 1. Specific Part Breakdown (year + part filter)
    part_results = db.session.query(
        JobHistory.job_number,
        JobHistory.work_order_number,
        func.sum(JobHistory.actual_hours).label("ncr_hours")
    ).filter(
        JobHistory.part_name == part,
        JobHistory.work_center.ilike("NCR"),
        func.extract('year', JobHistory.operation_finish_date) == year
    ).group_by(JobHistory.job_number, JobHistory.work_order_number).all()

    # 🔹 2. All-Time Summary Stats
    # Get distinct years with NCR activity
    years_with_ncr = db.session.query(
        func.extract('year', JobHistory.operation_finish_date).label("yr")
    ).filter(
        JobHistory.work_center.ilike("NCR")
    ).distinct().all()
    year_count = len(years_with_ncr)

    # Total NCR cost and part count across all years
    total_ncr_cost = db.session.query(
        func.sum(JobHistory.actual_hours * 199)
    ).filter(
        JobHistory.work_center.ilike("NCR")
    ).scalar() or 0

    total_parts = db.session.query(
        func.count(distinct(JobHistory.part_name))
    ).filter(
        JobHistory.work_center.ilike("NCR")
    ).scalar() or 0

    # 🔹 3. Safe averages
    avg_cost_per_year = total_ncr_cost / year_count if year_count else 0
    avg_parts_per_year = total_parts / year_count if year_count else 0

    return jsonify({
        "job_data": [
            {
                "job_number": row.job_number,
                "work_order_number": row.work_order_number,
                "ncr_hours": float(row.ncr_hours or 0)
            } for row in part_results
        ],
        "all_time_averages": {
            "avg_ncr_cost_per_year": round(avg_cost_per_year, 2),
            "avg_parts_with_ncr_per_year": round(avg_parts_per_year, 1)
        }
    })


# 1. Yearly Summary - Main page
@workhistory_api.route("/api/workhistory/summary/yearly")
def get_yearly_summary():
    results = db.session.query(
        func.extract('year', JobHistory.operation_finish_date).label("year"),
        func.count(func.distinct(JobHistory.work_order_number)).label("work_orders"),
        func.count(func.distinct(JobHistory.part_name)).label("unique_parts"),
        func.sum(JobHistory.planned_hours).label("planned_hours"),
        func.sum(JobHistory.actual_hours).label("actual_hours"),
        (func.sum(JobHistory.actual_hours) * BURDEN_RATE).label("actual_cost")
    ).group_by("year").order_by("year").all()

    return jsonify([dict(row._asdict()) for row in results])

@workhistory_api.route("/api/workhistory/summary/full")
def get_full_summary():
    from sqlalchemy import case
    import logging

    logger = logging.getLogger(__name__)
    BURDEN_RATE = 199

    try:
        # 🔍 Print sample records
        sample_rows = db.session.query(
            JobHistory.job_number,
            JobHistory.task_description,
            JobHistory.planned_hours,
            JobHistory.actual_hours,
            JobHistory.operation_finish_date,
            JobHistory.recorded_date
        ).limit(5).all()

        for row in sample_rows:
            logger.info(f"🔍 Sample Job: {row}")

        # ✅ Safe CASE syntax for SQLAlchemy 2.x
        overrun_case = case(
            (JobHistory.actual_hours > JobHistory.planned_hours,
             JobHistory.actual_hours - JobHistory.planned_hours),
            else_=0
        )

        ncr_case = case(
            (JobHistory.work_center == "NCR", JobHistory.actual_hours),
            else_=0
        )


        # --- Summary Metrics ---
        summary_result = db.session.query(
            func.sum(JobHistory.planned_hours),
            func.sum(JobHistory.actual_hours),
            func.sum(overrun_case),
            func.sum(JobHistory.actual_hours * BURDEN_RATE),
            func.sum(JobHistory.planned_hours * BURDEN_RATE),
            func.count(JobHistory.id),
            func.count(func.distinct(JobHistory.job_number)),
            func.count(func.distinct(JobHistory.customer_name)),
            func.sum(ncr_case),
            func.count(func.distinct(JobHistory.part_name))
        ).first()

        if not summary_result:
            logger.warning("No data returned in summary query.")
            return jsonify({"error": "No data found"}), 404

        summary = {
            "total_planned_hours": float(summary_result[0] or 0),
            "total_actual_hours": float(summary_result[1] or 0),
            "total_overrun_hours": float(summary_result[2] or 0),
            "total_actual_cost": float(summary_result[3] or 0),
            "total_planned_cost": float(summary_result[4] or 0),
            "total_operations": int(summary_result[5] or 0),
            "total_jobs": int(summary_result[6] or 0),
            "total_customers": int(summary_result[7] or 0),
            "total_ncr_hours": float(summary_result[8] or 0),
            "total_unique_parts": int(summary_result[9] or 0)
        }

        # --- Yearly Breakdown ---
        yearly_query = db.session.query(
            func.extract('year', JobHistory.operation_finish_date).label("year"),
            func.sum(JobHistory.planned_hours),
            func.sum(JobHistory.actual_hours),
            func.sum(overrun_case),
            func.sum(ncr_case),
            func.count(func.distinct(JobHistory.job_number)),
            func.count(JobHistory.id),
            func.count(func.distinct(JobHistory.customer_name))
        ).group_by("year").order_by("year").all()

        yearly_breakdown = []
        for row in yearly_query:
            try:
                yearly_breakdown.append({
                    "year": int(row[0]) if row[0] else None,
                    "planned_hours": float(row[1] or 0),
                    "actual_hours": float(row[2] or 0),
                    "overrun_hours": float(row[3] or 0),
                    "ncr_hours": float(row[4] or 0),
                    "job_count": int(row[5] or 0),
                    "operation_count": int(row[6] or 0),
                    "customer_count": int(row[7] or 0)
                })
            except Exception as e:
                logger.warning(f"⚠️ Failed to parse yearly row: {row} → {e}")

        # --- Work Center Breakdown ---
        wc_query = db.session.query(
            JobHistory.work_center,
            func.sum(JobHistory.planned_hours),
            func.sum(JobHistory.actual_hours),
            func.sum(overrun_case)
        ).group_by(JobHistory.work_center).order_by(func.sum(JobHistory.actual_hours).desc()).all()

        workcenter_breakdown = []
        for row in wc_query:
            try:
                workcenter_breakdown.append({
                    "work_center": row[0] or "UNKNOWN",
                    "total_planned_hours": float(row[1] or 0),
                    "total_actual_hours": float(row[2] or 0),
                    "overrun_hours": float(row[3] or 0)
                })
            except Exception as e:
                logger.warning(f"⚠️ Failed to parse work center row: {row} → {e}")

        logger.info("✅ Full summary API returned successfully.")

        return jsonify({
            "summary": summary,
            "yearly_breakdown": yearly_breakdown,
            "workcenter_breakdown": workcenter_breakdown
        })

    except Exception as e:
        logger.exception("❌ Error in /summary/full API")
        return jsonify({"error": "Internal server error", "details": str(e)}), 500




# 2. Customer Profitability Summary
@workhistory_api.route("/api/workhistory/summary/customers")
def get_customer_summary():
    results = db.session.query(
        JobHistory.customer_name,
        func.sum(JobHistory.planned_hours).label("planned_hours"),
        func.sum(JobHistory.actual_hours).label("actual_hours"),
        ((func.sum(JobHistory.planned_hours) - func.sum(JobHistory.actual_hours)) * BURDEN_RATE).label("profit_loss")
    ).group_by(JobHistory.customer_name).order_by(func.sum(JobHistory.actual_hours).desc()).all()

    return jsonify([dict(row._asdict()) for row in results])


# 3. Part Performance Summary
@workhistory_api.route("/api/workhistory/summary/parts")
def get_part_summary():
    results = db.session.query(
        JobHistory.part_name,
        func.count(func.distinct(JobHistory.work_order_number)).label("job_count"),
        func.sum(JobHistory.planned_hours).label("planned_hours"),
        func.sum(JobHistory.actual_hours).label("actual_hours"),
        ((func.sum(JobHistory.planned_hours) - func.sum(JobHistory.actual_hours)) * BURDEN_RATE).label("roi")
    ).group_by(JobHistory.part_name).order_by(func.sum(JobHistory.actual_hours).desc()).limit(100).all()

    return jsonify([dict(row._asdict()) for row in results])


# 4. Work Center Trends
@workhistory_api.route("/api/workhistory/summary/workcenters")
def get_workcenter_summary():
    results = db.session.query(
        JobHistory.work_center,
        func.count(JobHistory.operation_number).label("operations"),
        func.sum(JobHistory.planned_hours).label("planned_hours"),
        func.sum(JobHistory.actual_hours).label("actual_hours"),
        ((func.sum(JobHistory.actual_hours) - func.sum(JobHistory.planned_hours)) * BURDEN_RATE).label("overrun_cost")
    ).group_by(JobHistory.work_center).order_by(func.sum(JobHistory.actual_hours).desc()).all()

    return jsonify([dict(row._asdict()) for row in results])


# 5. Deep Dive Filtering
@workhistory_api.route("/api/workhistory/filter")
def filter_work_history():
    year = request.args.get("year")
    customer = request.args.get("customer")
    part = request.args.get("part")
    work_center = request.args.get("work_center")

    query = db.session.query(JobHistory)

    if year:
        query = query.filter(func.extract('year', JobHistory.operation_finish_date) == int(year))
    if customer:
        query = query.filter(JobHistory.customer_name.ilike(f"%{customer}%"))
    if part:
        query = query.filter(JobHistory.part_name.ilike(f"%{part}%"))
    if work_center:
        query = query.filter(JobHistory.work_center.ilike(f"%{work_center}%"))

    records = query.limit(1000).all()

    return jsonify([
        {
            "job_number": r.job_number,
            "customer_name": r.customer_name,
            "part_name": r.part_name,
            "work_center": r.work_center,
            "planned_hours": r.planned_hours,
            "actual_hours": r.actual_hours,
            "operation_finish_date": r.operation_finish_date,
        }
        for r in records
    ])


# 6. Trend Analysis (rolling yearly cost)
@workhistory_api.route("/api/workhistory/trends")
def get_trends():
    results = db.session.query(
        func.extract('year', JobHistory.operation_finish_date).label("year"),
        func.sum(JobHistory.actual_hours * BURDEN_RATE).label("total_cost")
    ).group_by("year").order_by("year").all()

    return jsonify([dict(row._asdict()) for row in results])

# End Work history python code----------------------------------------------------------------------------------------------------------------
