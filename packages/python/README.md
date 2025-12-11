# Flynn Python SDK

Python MCP server providing data analysis and ML tools for Flynn agents.

## Setup

```bash
cd packages/python
uv sync

# For ML features (sentiment, summarization, classification):
uv sync --extra ml
```

## Running the MCP Server

```bash
uv run python -m server
```

## Available Tools

### Data Tools (pandas-based)

| Tool | Description |
|------|-------------|
| `flynn-data_load_csv` | Load CSV file and get basic statistics |
| `flynn-data_describe` | Statistical description of dataset |
| `flynn-data_filter` | Filter dataset by column conditions |
| `flynn-data_aggregate` | Group by and aggregate data |
| `flynn-data_correlate` | Calculate correlation matrix |

### ML Tools (requires `--extra ml`)

| Tool | Description |
|------|-------------|
| `flynn-ml_sentiment` | Sentiment analysis (positive/negative/neutral) |
| `flynn-ml_summarize` | Text summarization |
| `flynn-ml_classify` | Zero-shot text classification |
| `flynn-ml_embeddings` | Generate text embeddings |

## Integration with Claude Code

Add to your Claude Code MCP settings (`~/.claude/settings.json` or project `.mcp.json`):

```json
{
  "mcpServers": {
    "flynn-python": {
      "command": "uv",
      "args": [
        "--directory",
        "/path/to/Flynn-Project/packages/python",
        "run",
        "python",
        "-m",
        "server"
      ]
    }
  }
}
```

Or add via CLI:
```bash
claude mcp add flynn-python -- uv --directory /path/to/Flynn-Project/packages/python run python -m server
```

## Running Tests

```bash
uv run pytest tests/ -v
```
