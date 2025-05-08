import pandas as pd
import logging
from datetime import datetime
from app import app, db  # ✅ Ensure proper database connection
from setup_database import JobHistory  # ✅ Use JobHistory model

# ✅ Column Mapping for Consistency
COLUMN_MAPPING = {
    'sales document': 'job_number',
    'order': 'work_order_number',
    'oper./act.': 'operation_number',
    'oper.workcenter': 'work_center',
    'description': 'part_name',
    'opr. short text': 'task_description',
    'work': 'planned_hours',
    'actual work': 'actual_hours',
    'list name': 'customer_name',
    'basic fin. date': 'operation_finish_date'  # ✅ New Date Column
}

# ✅ Fields that exist in `job_history` but are **not** in work history files
CALCULATED_FIELDS = [
    'remaining_work',  # Should be empty for manually uploaded jobs
    'status',  # Should be empty for manually uploaded jobs
    'operation_start_date',  # Should be empty for manually uploaded jobs
    'job_start_date'  # Should be empty for manually uploaded jobs
]

WORKHISTORY_FILE = "C:/Users/srava/Downloads/WORKHISTORY.xlsx"


def process_workhistory(file_path):
    """Processes and uploads WORKHISTORY Excel data into job_history table."""
    try:
        logging.info("📂 Loading WORKHISTORY file...")
        df = pd.read_excel(file_path, sheet_name="Sheet1", dtype=str)

        # ✅ Standardize and Map Column Names
        df.columns = df.columns.str.lower().str.strip()
        df.rename(columns=COLUMN_MAPPING, inplace=True)

        # ✅ Ensure All Expected Columns Exist
        expected_columns = list(COLUMN_MAPPING.values()) + CALCULATED_FIELDS
        for col in expected_columns:
            if col not in df.columns:
                df[col] = None
        df = df[expected_columns]

        # ✅ Convert 'operation_finish_date' with bulletproof parsing
        if 'operation_finish_date' in df.columns:
            df['operation_finish_date'] = pd.to_datetime(
                df['operation_finish_date'], errors='coerce'
            ).dt.strftime('%Y-%m-%d')
            df['operation_finish_date'] = df['operation_finish_date'].replace("NaT", None)

        # ✅ Numeric Column Cleaning
        numeric_columns = ["planned_hours", "actual_hours", "operation_number"]
        for col in numeric_columns:
            df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0).astype(float)

        # ✅ Text Column Cleaning
        text_columns = ["job_number", "work_order_number", "work_center", "part_name", "task_description", "customer_name"]
        for col in text_columns:
            df[col] = df[col].fillna("N/A").astype(str).str.strip()

        # ✅ Set NULL for calculated fields
        for field in CALCULATED_FIELDS:
            df[field] = None

        # ✅ Recorded Date
        df["recorded_date"] = datetime.now().date()

        # ✅ Remove duplicates before insert
        df.drop_duplicates(subset=['job_number', 'work_order_number', 'operation_number'], inplace=True)

        # ✅ Check Existing Entries in Database
        with app.app_context():
            existing_records = db.session.query(
                JobHistory.job_number,
                JobHistory.work_order_number,
                JobHistory.operation_number
            ).all()

            existing_set = set((r.job_number, r.work_order_number, r.operation_number) for r in existing_records)
            logging.info(f"🔍 Existing records loaded: {len(existing_set)} entries.")

            new_df = df[~df.apply(
                lambda row: (row['job_number'], row['work_order_number'], row['operation_number']) in existing_set,
                axis=1
            )]

            skipped = len(df) - len(new_df)
            logging.info(f"🔄 Rows skipped due to duplication: {skipped}")

            # ✅ Replace any lingering NaN/NaT before insert
            new_df = new_df.where(pd.notnull(new_df), None)

            job_entries = [JobHistory(**row) for row in new_df.to_dict(orient='records')]
            db.session.bulk_save_objects(job_entries)

            try:
                db.session.commit()
                logging.info(f"✅ Successfully uploaded {len(job_entries)} new records into job_history.")
            except Exception as e:
                db.session.rollback()
                logging.error(f"❌ Bulk insertion failed: {e}")

    except Exception as e:
        logging.error(f"❌ Error processing WORKHISTORY file: {e}")

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    process_workhistory(WORKHISTORY_FILE)