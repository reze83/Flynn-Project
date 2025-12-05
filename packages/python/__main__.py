"""Entry point for running Flynn Python MCP Server."""

from server import main
import asyncio

if __name__ == "__main__":
    asyncio.run(main())
