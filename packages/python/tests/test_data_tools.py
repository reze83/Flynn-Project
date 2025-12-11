"""Tests for flynn_data tools."""

from pathlib import Path

import pytest

from flynn_data.tools import DATA_TOOLS, execute_data_tool


class TestDataToolDefinitions:
    """Test DATA_TOOLS definitions."""

    def test_data_tools_is_list(self):
        """DATA_TOOLS should be a list."""
        assert isinstance(DATA_TOOLS, list)

    def test_data_tools_count(self):
        """Should have 5 data tools."""
        assert len(DATA_TOOLS) == 5

    def test_tool_names(self):
        """All tools should have proper names."""
        expected_names = [
            "flynn-data_load_csv",
            "flynn-data_describe",
            "flynn-data_filter",
            "flynn-data_aggregate",
            "flynn-data_correlate",
        ]
        actual_names = [tool.name for tool in DATA_TOOLS]
        assert actual_names == expected_names

    def test_tools_have_descriptions(self):
        """All tools should have descriptions."""
        for tool in DATA_TOOLS:
            assert tool.description
            assert len(tool.description) > 10

    def test_tools_have_input_schemas(self):
        """All tools should have input schemas."""
        for tool in DATA_TOOLS:
            assert tool.inputSchema
            assert tool.inputSchema["type"] == "object"
            assert "properties" in tool.inputSchema

    def test_all_tools_require_path(self):
        """All tools should require a path parameter."""
        for tool in DATA_TOOLS:
            required = tool.inputSchema.get("required", [])
            assert "path" in required, f"{tool.name} should require 'path'"


class TestExecuteDataTool:
    """Test execute_data_tool function."""

    @pytest.fixture
    def sample_csv(self, tmp_path: Path) -> Path:
        """Create a sample CSV file for testing."""
        csv_path = tmp_path / "test_data.csv"
        csv_path.write_text(
            "name,age,city,salary\n"
            "Alice,30,Berlin,50000\n"
            "Bob,25,Munich,45000\n"
            "Charlie,35,Hamburg,60000\n"
            "Diana,28,Berlin,55000\n"
            "Eve,32,Munich,58000\n"
        )
        return csv_path

    @pytest.mark.asyncio
    async def test_load_csv_success(self, sample_csv: Path):
        """load_csv should return basic statistics."""
        result = await execute_data_tool(
            "flynn-data_load_csv",
            {"path": str(sample_csv)},
        )

        assert result["success"] is True
        assert result["rows"] == 5
        assert result["columns"] == ["name", "age", "city", "salary"]
        assert "preview" in result
        assert len(result["preview"]) == 5

    @pytest.mark.asyncio
    async def test_load_csv_with_limit(self, sample_csv: Path):
        """load_csv should respect row limit."""
        result = await execute_data_tool(
            "flynn-data_load_csv",
            {"path": str(sample_csv), "limit": 2},
        )

        assert result["success"] is True
        assert result["rows"] == 2

    @pytest.mark.asyncio
    async def test_load_csv_file_not_found(self):
        """load_csv should handle missing files."""
        result = await execute_data_tool(
            "flynn-data_load_csv",
            {"path": "/nonexistent/file.csv"},
        )

        assert result["success"] is False
        assert "error" in result

    @pytest.mark.asyncio
    async def test_describe_success(self, sample_csv: Path):
        """describe should return statistical description."""
        result = await execute_data_tool(
            "flynn-data_describe",
            {"path": str(sample_csv)},
        )

        assert result["success"] is True
        assert "statistics" in result
        assert "age" in result["statistics"]
        assert "salary" in result["statistics"]

    @pytest.mark.asyncio
    async def test_filter_eq(self, sample_csv: Path):
        """filter should filter by equality."""
        result = await execute_data_tool(
            "flynn-data_filter",
            {"path": str(sample_csv), "column": "city", "operator": "eq", "value": "Berlin"},
        )

        assert result["success"] is True
        assert result["original_rows"] == 5
        assert result["filtered_rows"] == 2

    @pytest.mark.asyncio
    async def test_filter_gt(self, sample_csv: Path):
        """filter should filter by greater than."""
        result = await execute_data_tool(
            "flynn-data_filter",
            {"path": str(sample_csv), "column": "age", "operator": "gt", "value": 30},
        )

        assert result["success"] is True
        assert result["filtered_rows"] == 2  # Charlie (35) and Eve (32)

    @pytest.mark.asyncio
    async def test_filter_contains(self, sample_csv: Path):
        """filter should filter by string contains."""
        result = await execute_data_tool(
            "flynn-data_filter",
            {"path": str(sample_csv), "column": "name", "operator": "contains", "value": "a"},
        )

        assert result["success"] is True
        # Diana, Charlie contain 'a'
        assert result["filtered_rows"] >= 2

    @pytest.mark.asyncio
    async def test_filter_unknown_operator(self, sample_csv: Path):
        """filter should reject unknown operators."""
        result = await execute_data_tool(
            "flynn-data_filter",
            {"path": str(sample_csv), "column": "age", "operator": "invalid", "value": 30},
        )

        assert result["success"] is False
        assert "Unknown operator" in result["error"]

    @pytest.mark.asyncio
    async def test_aggregate_sum(self, sample_csv: Path):
        """aggregate should compute sum by group."""
        result = await execute_data_tool(
            "flynn-data_aggregate",
            {
                "path": str(sample_csv),
                "group_by": "city",
                "agg_column": "salary",
                "agg_func": "sum",
            },
        )

        assert result["success"] is True
        assert "result" in result
        # Berlin: 50000 + 55000 = 105000
        assert result["result"]["Berlin"] == 105000

    @pytest.mark.asyncio
    async def test_aggregate_mean(self, sample_csv: Path):
        """aggregate should compute mean by group."""
        result = await execute_data_tool(
            "flynn-data_aggregate",
            {
                "path": str(sample_csv),
                "group_by": "city",
                "agg_column": "age",
                "agg_func": "mean",
            },
        )

        assert result["success"] is True
        # Berlin: (30 + 28) / 2 = 29
        assert result["result"]["Berlin"] == 29.0

    @pytest.mark.asyncio
    async def test_aggregate_count(self, sample_csv: Path):
        """aggregate should compute count by group."""
        result = await execute_data_tool(
            "flynn-data_aggregate",
            {
                "path": str(sample_csv),
                "group_by": "city",
                "agg_column": "name",
                "agg_func": "count",
            },
        )

        assert result["success"] is True
        assert result["result"]["Berlin"] == 2
        assert result["result"]["Munich"] == 2
        assert result["result"]["Hamburg"] == 1

    @pytest.mark.asyncio
    async def test_aggregate_unknown_function(self, sample_csv: Path):
        """aggregate should reject unknown functions."""
        result = await execute_data_tool(
            "flynn-data_aggregate",
            {
                "path": str(sample_csv),
                "group_by": "city",
                "agg_column": "salary",
                "agg_func": "invalid",
            },
        )

        assert result["success"] is False
        assert "Unknown function" in result["error"]

    @pytest.mark.asyncio
    async def test_correlate_success(self, sample_csv: Path):
        """correlate should return correlation matrix."""
        result = await execute_data_tool(
            "flynn-data_correlate",
            {"path": str(sample_csv)},
        )

        assert result["success"] is True
        assert "correlation" in result
        # Should have age and salary correlations
        assert "age" in result["correlation"]
        assert "salary" in result["correlation"]
        # Diagonal should be 1.0
        assert result["correlation"]["age"]["age"] == 1.0

    @pytest.mark.asyncio
    async def test_unknown_tool(self, sample_csv: Path):
        """Should handle unknown tool names."""
        result = await execute_data_tool(
            "flynn-data_unknown",
            {"path": str(sample_csv)},
        )

        assert result["success"] is False
        assert "Unknown tool" in result["error"]
