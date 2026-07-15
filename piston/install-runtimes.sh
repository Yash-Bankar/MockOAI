#!/bin/bash
set -e

PISTON_URL="${PISTON_URL:-http://localhost:2000}"
API_BASE="${PISTON_URL}/api/v2"

echo "Installing Piston runtimes..."
echo "Piston API: ${PISTON_URL}"
echo ""

install_package() {
    local language=$1
    local version=$2
    echo "Installing ${language} ${version}..."
    curl -sS -X POST "${API_BASE}/packages" \
        -H "Content-Type: application/json" \
        -d "{\"language\": \"${language}\", \"version\": \"${version}\"}" | grep -q "message" && echo "✓ ${language} ${version} installed" || echo "✗ ${language} ${version} failed"
}

install_package "gcc" "10.2.0"
install_package "python" "3.12.0"
install_package "java" "15.0.2"

echo ""
echo "Installation complete!"
echo ""
echo "Verifying installed runtimes:"
curl -sS "${API_BASE}/runtimes" | grep -E "language|version" || echo "Failed to verify runtimes"