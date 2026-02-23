#!/bin/bash
# One-command local setup for Kitz OS
# Usage: ./scripts/setup.sh

set -e

echo "🚀 Setting up Kitz OS development environment..."

# Install dependencies for each service
for dir in ui kitz-gateway kitz-llm-hub kitz-payments kitz-whatsapp-connector kitz-email-connector kitz-notifications-queue kitz-services admin-kitz-services kitz_os workspace kitz-brain kitz-schemas; do
  if [ -d "$dir" ] && [ -f "$dir/package.json" ]; then
    echo "📦 Installing $dir..."
    (cd "$dir" && npm install)
  fi
done

echo "✅ Setup complete!"
