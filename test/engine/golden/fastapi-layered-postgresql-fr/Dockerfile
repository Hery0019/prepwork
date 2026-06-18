# DOCK-001 : deux étapes. L'image finale ne porte ni uv, ni les sources, ni les dépendances de développement.
FROM ghcr.io/astral-sh/uv:0.9.9-python3.13-bookworm-slim AS build
WORKDIR /app

ENV UV_COMPILE_BYTECODE=1 UV_LINK_MODE=copy

# DOCK-003 : le manifeste et le lockfile d'abord, pour que l'installation se mette en cache.
COPY pyproject.toml uv.lock ./
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev --no-install-project

COPY src/ src/
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev

FROM python:3.13-slim AS runtime
WORKDIR /app

# DOCK-002 : l'application ne tourne pas en root.
RUN useradd --create-home --uid 10001 app
COPY --from=build --chown=app:app /app/.venv /app/.venv
COPY --from=build --chown=app:app /app/src /app/src
USER app

ENV PATH="/app/.venv/bin:$PATH"
EXPOSE 8000

CMD ["uvicorn", "pay_flow.api.app:create_app", "--factory", "--host", "0.0.0.0", "--port", "8000"]
