"""Flynn Python MCP Server - Data and ML tools."""

import asyncio
import logging
from typing import Any

from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import TextContent

from flynn_data import DATA_TOOLS, execute_data_tool
from flynn_ml import ML_TOOLS, execute_ml_tool

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("flynn-python")

# Create MCP server
server = Server("flynn-python")

# All tools
ALL_TOOLS = DATA_TOOLS + ML_TOOLS


@server.list_tools()
async def list_tools():
    """List all available tools."""
    return ALL_TOOLS


@server.call_tool()
async def call_tool(name: str, arguments: dict[str, Any]) -> list[TextContent]:
    """Execute a tool by name."""
    logger.info(f"Executing tool: {name}")

    # Route to appropriate handler
    if name.startswith("flynn-data_"):
        result = await execute_data_tool(name, arguments)
    elif name.startswith("flynn-ml_"):
        result = await execute_ml_tool(name, arguments)
    else:
        result = {"success": False, "error": f"Unknown tool: {name}"}

    import json

    return [TextContent(type="text", text=json.dumps(result, indent=2))]


async def main():
    """Run the MCP server."""
    logger.info("Starting Flynn Python MCP Server")
    async with stdio_server() as (read_stream, write_stream):
        await server.run(read_stream, write_stream, server.create_initialization_options())


if __name__ == "__main__":
    asyncio.run(main())
