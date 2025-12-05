"""ML tools using transformers."""

from typing import Any

from mcp.types import Tool

# Tool definitions
ML_TOOLS = [
    Tool(
        name="flynn-ml_sentiment",
        description="Analyze sentiment of text (positive/negative/neutral)",
        inputSchema={
            "type": "object",
            "properties": {
                "text": {"type": "string", "description": "Text to analyze"},
            },
            "required": ["text"],
        },
    ),
    Tool(
        name="flynn-ml_summarize",
        description="Summarize a long text",
        inputSchema={
            "type": "object",
            "properties": {
                "text": {"type": "string", "description": "Text to summarize"},
                "max_length": {
                    "type": "integer",
                    "description": "Max summary length",
                },
            },
            "required": ["text"],
        },
    ),
    Tool(
        name="flynn-ml_classify",
        description="Zero-shot text classification",
        inputSchema={
            "type": "object",
            "properties": {
                "text": {"type": "string", "description": "Text to classify"},
                "labels": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Candidate labels",
                },
            },
            "required": ["text", "labels"],
        },
    ),
    Tool(
        name="flynn-ml_embeddings",
        description="Generate text embeddings for semantic similarity",
        inputSchema={
            "type": "object",
            "properties": {
                "texts": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Texts to embed",
                },
            },
            "required": ["texts"],
        },
    ),
]


# Lazy-loaded pipelines
_pipelines: dict[str, Any] = {}


def get_pipeline(task: str, model: str | None = None):
    """Get or create a pipeline (lazy loading)."""
    key = f"{task}:{model or 'default'}"
    if key not in _pipelines:
        from transformers import pipeline

        _pipelines[key] = pipeline(task, model=model)
    return _pipelines[key]


async def execute_ml_tool(name: str, args: dict[str, Any]) -> dict[str, Any]:
    """Execute an ML tool."""
    try:
        if name == "flynn-ml_sentiment":
            pipe = get_pipeline("sentiment-analysis")
            result = pipe(args["text"])[0]
            return {
                "success": True,
                "label": result["label"],
                "score": float(result["score"]),
            }

        elif name == "flynn-ml_summarize":
            pipe = get_pipeline("summarization")
            result = pipe(
                args["text"],
                max_length=args.get("max_length", 150),
                min_length=30,
                do_sample=False,
            )[0]
            return {
                "success": True,
                "summary": result["summary_text"],
            }

        elif name == "flynn-ml_classify":
            pipe = get_pipeline("zero-shot-classification")
            result = pipe(args["text"], args["labels"])
            return {
                "success": True,
                "labels": result["labels"],
                "scores": [float(s) for s in result["scores"]],
            }

        elif name == "flynn-ml_embeddings":
            import torch
            from transformers import AutoModel, AutoTokenizer

            model_name = "sentence-transformers/all-MiniLM-L6-v2"
            tokenizer = AutoTokenizer.from_pretrained(model_name)
            model = AutoModel.from_pretrained(model_name)

            texts = args["texts"]
            inputs = tokenizer(texts, padding=True, truncation=True, return_tensors="pt")

            with torch.no_grad():
                outputs = model(**inputs)
                # Mean pooling
                embeddings = outputs.last_hidden_state.mean(dim=1)

            return {
                "success": True,
                "embeddings": embeddings.tolist(),
                "dimensions": embeddings.shape[1],
            }

        return {"success": False, "error": f"Unknown tool: {name}"}

    except Exception as e:
        return {"success": False, "error": str(e)}
