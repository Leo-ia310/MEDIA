from app.ai.providers.cloudflare import CloudflareWorkersAIProvider


def test_extract_text_from_direct_string_result() -> None:
    assert CloudflareWorkersAIProvider._extract_text("respuesta") == "respuesta"


def test_extract_text_from_block_content() -> None:
    result = {
        "choices": [
            {
                "message": {
                    "content": [
                        {"type": "text", "text": "primera parte"},
                        {"type": "text", "text": "segunda parte"},
                    ]
                }
            }
        ]
    }

    assert CloudflareWorkersAIProvider._extract_text(result) == "primera parte\nsegunda parte"


def test_extract_text_from_generated_text() -> None:
    assert CloudflareWorkersAIProvider._extract_text({"generated_text": "ok"}) == "ok"
