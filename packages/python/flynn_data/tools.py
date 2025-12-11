"""Data analysis tools using pandas and numpy."""

from typing import Any

from mcp.types import Tool

# Tool definitions
DATA_TOOLS = [
    Tool(
        name="flynn-data_load_csv",
        description="Load a CSV file and return basic statistics",
        inputSchema={
            "type": "object",
            "properties": {
                "path": {"type": "string", "description": "Path to CSV file"},
                "limit": {"type": "integer", "description": "Max rows to load"},
            },
            "required": ["path"],
        },
    ),
    Tool(
        name="flynn-data_describe",
        description="Get statistical description of a dataset",
        inputSchema={
            "type": "object",
            "properties": {
                "path": {"type": "string", "description": "Path to CSV file"},
            },
            "required": ["path"],
        },
    ),
    Tool(
        name="flynn-data_filter",
        description="Filter dataset by column conditions",
        inputSchema={
            "type": "object",
            "properties": {
                "path": {"type": "string", "description": "Path to CSV file"},
                "column": {"type": "string", "description": "Column to filter on"},
                "operator": {
                    "type": "string",
                    "enum": ["eq", "ne", "gt", "lt", "gte", "lte", "contains"],
                },
                "value": {"description": "Value to compare against"},
            },
            "required": ["path", "column", "operator"],
        },
    ),
    Tool(
        name="flynn-data_aggregate",
        description="Aggregate data by group",
        inputSchema={
            "type": "object",
            "properties": {
                "path": {"type": "string", "description": "Path to CSV file"},
                "group_by": {"type": "string", "description": "Column to group by"},
                "agg_column": {"type": "string", "description": "Column to aggregate"},
                "agg_func": {
                    "type": "string",
                    "enum": ["sum", "mean", "count", "min", "max"],
                },
            },
            "required": ["path", "group_by", "agg_column", "agg_func"],
        },
    ),
    Tool(
        name="flynn-data_correlate",
        description="Calculate correlation matrix for numeric columns",
        inputSchema={
            "type": "object",
            "properties": {
                "path": {"type": "string", "description": "Path to CSV file"},
            },
            "required": ["path"],
        },
    ),
]


async def execute_data_tool(name: str, args: dict[str, Any]) -> dict[str, Any]:
    """Execute a data tool."""
    import numpy as np
    import pandas as pd

    try:
        if name == "flynn-data_load_csv":
            df = pd.read_csv(args["path"], nrows=args.get("limit", 1000))
            return {
                "success": True,
                "rows": len(df),
                "columns": list(df.columns),
                "dtypes": {col: str(dtype) for col, dtype in df.dtypes.items()},
                "preview": df.head(5).to_dict(orient="records"),
            }

        elif name == "flynn-data_describe":
            df = pd.read_csv(args["path"])
            desc = df.describe(include="all").to_dict()
            # Convert numpy types to Python types
            for col in desc:
                for stat in desc[col]:
                    val = desc[col][stat]
                    if isinstance(val, (np.integer, np.floating)):
                        desc[col][stat] = float(val) if np.isfinite(val) else None
            return {"success": True, "statistics": desc}

        elif name == "flynn-data_filter":
            df = pd.read_csv(args["path"])
            col = args["column"]
            op = args["operator"]
            val = args.get("value")

            if op == "eq":
                mask = df[col] == val
            elif op == "ne":
                mask = df[col] != val
            elif op == "gt":
                mask = df[col] > val
            elif op == "lt":
                mask = df[col] < val
            elif op == "gte":
                mask = df[col] >= val
            elif op == "lte":
                mask = df[col] <= val
            elif op == "contains":
                mask = df[col].astype(str).str.contains(str(val), na=False)
            else:
                return {"success": False, "error": f"Unknown operator: {op}"}

            filtered = df[mask]
            return {
                "success": True,
                "original_rows": len(df),
                "filtered_rows": len(filtered),
                "preview": filtered.head(10).to_dict(orient="records"),
            }

        elif name == "flynn-data_aggregate":
            df = pd.read_csv(args["path"])
            grouped = df.groupby(args["group_by"])[args["agg_column"]]

            func = args["agg_func"]
            if func == "sum":
                result = grouped.sum()
            elif func == "mean":
                result = grouped.mean()
            elif func == "count":
                result = grouped.count()
            elif func == "min":
                result = grouped.min()
            elif func == "max":
                result = grouped.max()
            else:
                return {"success": False, "error": f"Unknown function: {func}"}

            return {
                "success": True,
                "result": result.to_dict(),
            }

        elif name == "flynn-data_correlate":
            df = pd.read_csv(args["path"])
            numeric_df = df.select_dtypes(include=[np.number])
            corr = numeric_df.corr().to_dict()
            # Convert numpy types
            for col in corr:
                for row in corr[col]:
                    val = corr[col][row]
                    if isinstance(val, (np.integer, np.floating)):
                        corr[col][row] = float(val) if np.isfinite(val) else None
            return {"success": True, "correlation": corr}

        return {"success": False, "error": f"Unknown tool: {name}"}

    except Exception as e:
        return {"success": False, "error": str(e)}
