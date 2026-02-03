#!/usr/bin/env bash
set -euo pipefail

# Nightly MCP Registry sync.
# Required env: STRAPI_URL, STRAPI_TOKEN
# Optional env: MCP_REGISTRY_URL, MCP_REGISTRY_LIMIT, MCP_REGISTRY_MAX

ARGS=(--url "${STRAPI_URL}" --token "${STRAPI_TOKEN}" --publish)

if [[ -n "${MCP_REGISTRY_URL:-}" ]]; then
  ARGS+=(--registry-url "${MCP_REGISTRY_URL}")
fi
if [[ -n "${MCP_REGISTRY_LIMIT:-}" ]]; then
  ARGS+=(--limit "${MCP_REGISTRY_LIMIT}")
fi
if [[ -n "${MCP_REGISTRY_MAX:-}" ]]; then
  ARGS+=(--max "${MCP_REGISTRY_MAX}")
fi

echo "Starting MCP registry sync at $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
npm run import:mcp-registry -- "${ARGS[@]}"
echo "Completed MCP registry sync at $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
