def format_number(value, digits=1):
    """Format a number with thousands separator and specified decimal digits."""
    if value is None:
        return "0"
    
    try:
        # For large numbers, show without decimal places
        if abs(value) >= 1000:
            return f"{value:,.0f}"
        else:
            return f"{value:,.{digits}f}"
    except (ValueError, TypeError):
        return "0"

def format_money(value):
    """Format a number as currency."""
    if value is None:
        return "$0.00"
    
    try:
        return f"${value:,.2f}"
    except (ValueError, TypeError):
        return "$0.00"

def format_percent(value, digits=1):
    """Format a number as a percentage with specified decimal digits."""
    if value is None:
        return "0%"
    
    try:
        return f"{value * 100:.{digits}f}%"
    except (ValueError, TypeError):
        return "0%"
