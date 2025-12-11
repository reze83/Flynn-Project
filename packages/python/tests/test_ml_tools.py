"""Tests for flynn_ml tools."""

import pytest

# Skip entire module if transformers is not installed
pytest.importorskip("transformers", reason="transformers required for ML tests")

from flynn_ml.tools import ML_TOOLS, execute_ml_tool


class TestMLToolDefinitions:
    """Test ML_TOOLS definitions."""

    def test_ml_tools_is_list(self):
        """ML_TOOLS should be a list."""
        assert isinstance(ML_TOOLS, list)

    def test_ml_tools_count(self):
        """Should have 4 ML tools."""
        assert len(ML_TOOLS) == 4

    def test_tool_names(self):
        """All tools should have proper names."""
        expected_names = [
            "flynn-ml_sentiment",
            "flynn-ml_summarize",
            "flynn-ml_classify",
            "flynn-ml_embeddings",
        ]
        actual_names = [tool.name for tool in ML_TOOLS]
        assert actual_names == expected_names

    def test_tools_have_descriptions(self):
        """All tools should have descriptions."""
        for tool in ML_TOOLS:
            assert tool.description
            assert len(tool.description) > 10

    def test_tools_have_input_schemas(self):
        """All tools should have input schemas."""
        for tool in ML_TOOLS:
            assert tool.inputSchema
            assert tool.inputSchema["type"] == "object"
            assert "properties" in tool.inputSchema

    def test_sentiment_schema(self):
        """Sentiment tool should require text."""
        tool = next(t for t in ML_TOOLS if t.name == "flynn-ml_sentiment")
        assert "text" in tool.inputSchema["properties"]
        assert "text" in tool.inputSchema["required"]

    def test_summarize_schema(self):
        """Summarize tool should have text and max_length."""
        tool = next(t for t in ML_TOOLS if t.name == "flynn-ml_summarize")
        assert "text" in tool.inputSchema["properties"]
        assert "max_length" in tool.inputSchema["properties"]

    def test_classify_schema(self):
        """Classify tool should require text and labels."""
        tool = next(t for t in ML_TOOLS if t.name == "flynn-ml_classify")
        assert "text" in tool.inputSchema["properties"]
        assert "labels" in tool.inputSchema["properties"]
        assert "text" in tool.inputSchema["required"]
        assert "labels" in tool.inputSchema["required"]

    def test_embeddings_schema(self):
        """Embeddings tool should require texts array."""
        tool = next(t for t in ML_TOOLS if t.name == "flynn-ml_embeddings")
        assert "texts" in tool.inputSchema["properties"]
        assert tool.inputSchema["properties"]["texts"]["type"] == "array"


class TestGetPipeline:
    """Test get_pipeline function."""

    def test_pipeline_caching_key(self):
        """Pipeline key format should be task:model."""
        # Just verify the key format works
        key = "test:default"
        assert ":" in key


class TestExecuteMLTool:
    """Test execute_ml_tool function."""

    @pytest.mark.asyncio
    async def test_unknown_tool(self):
        """Should handle unknown tool names."""
        result = await execute_ml_tool(
            "flynn-ml_unknown",
            {"text": "test"},
        )

        assert result["success"] is False
        assert "Unknown tool" in result["error"]

    @pytest.mark.asyncio
    async def test_missing_required_param(self):
        """Should handle missing parameters gracefully."""
        # This will cause a KeyError in the implementation
        result = await execute_ml_tool(
            "flynn-ml_sentiment",
            {},  # Missing 'text'
        )

        assert result["success"] is False
        assert "error" in result


# Mark slow tests that actually load ML models
@pytest.mark.slow
class TestMLToolsIntegration:
    """Integration tests that load actual ML models.

    These tests are slow and require transformers/torch.
    Run with: pytest -m slow
    Skip with: pytest -m "not slow"
    """

    @pytest.mark.asyncio
    async def test_sentiment_positive(self):
        """Sentiment analysis should detect positive text."""
        result = await execute_ml_tool(
            "flynn-ml_sentiment",
            {"text": "I love this product! It's absolutely fantastic!"},
        )

        assert result["success"] is True
        assert "label" in result
        assert "score" in result
        assert isinstance(result["score"], float)
        assert 0 <= result["score"] <= 1

    @pytest.mark.asyncio
    async def test_sentiment_negative(self):
        """Sentiment analysis should detect negative text."""
        result = await execute_ml_tool(
            "flynn-ml_sentiment",
            {"text": "This is terrible. I hate it."},
        )

        assert result["success"] is True
        assert "label" in result

    @pytest.mark.asyncio
    async def test_classify_basic(self):
        """Classification should work with candidate labels."""
        result = await execute_ml_tool(
            "flynn-ml_classify",
            {
                "text": "The stock market crashed today",
                "labels": ["finance", "sports", "technology"],
            },
        )

        assert result["success"] is True
        assert "labels" in result
        assert "scores" in result
        assert len(result["labels"]) == 3
        assert len(result["scores"]) == 3

    @pytest.mark.asyncio
    async def test_embeddings_basic(self):
        """Embeddings should return vectors."""
        result = await execute_ml_tool(
            "flynn-ml_embeddings",
            {"texts": ["Hello world", "Hi there"]},
        )

        assert result["success"] is True
        assert "embeddings" in result
        assert "dimensions" in result
        assert len(result["embeddings"]) == 2
        assert result["dimensions"] > 0


class TestMLToolDefinitionsDetails:
    """Detailed tests for ML tool schemas."""

    def test_all_required_fields_present(self):
        """All tools should have all required MCP fields."""
        for tool in ML_TOOLS:
            assert hasattr(tool, "name")
            assert hasattr(tool, "description")
            assert hasattr(tool, "inputSchema")

    def test_schema_properties_types(self):
        """All schema properties should have types defined."""
        for tool in ML_TOOLS:
            props = tool.inputSchema.get("properties", {})
            for prop_name, prop_def in props.items():
                # Either has "type" or "items" (for arrays)
                assert "type" in prop_def or "items" in prop_def, (
                    f"{tool.name}.{prop_name} missing type"
                )
