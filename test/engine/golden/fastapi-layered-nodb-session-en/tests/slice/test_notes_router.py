"""Slice level (CORE-020): the whole application, called with no network socket."""

import pytest
from httpx import AsyncClient

BASE = "/api/v1/notes"


@pytest.mark.slice
async def test_create_valid_body_returns_201_and_the_note(client: AsyncClient) -> None:
    response = await client.post(BASE, json={"title": "First", "body": "Hello"})

    assert response.status_code == 201
    assert response.json()["title"] == "First"


@pytest.mark.slice
async def test_create_blank_title_returns_400_as_a_problem_document(client: AsyncClient) -> None:
    """CORE-012 : FastAPI's default 422 is replaced by an RFC 9457 document."""
    response = await client.post(BASE, json={"title": "", "body": None})

    assert response.status_code == 400
    assert response.headers["content-type"].startswith("application/problem+json")
    assert response.json()["errors"][0]["field"] == "title"


@pytest.mark.slice
async def test_read_unknown_id_returns_404_as_a_problem_document(client: AsyncClient) -> None:
    response = await client.get(f"{BASE}/404")

    assert response.status_code == 404
    assert response.json()["status"] == 404


@pytest.mark.slice
async def test_list_default_page_returns_the_paginated_shape(client: AsyncClient) -> None:
    await client.post(BASE, json={"title": "One", "body": None})

    body = (await client.get(BASE)).json()

    assert set(body) == {"content", "page", "size", "totalElements"}
    assert body["totalElements"] == 1
