#!/bin/bash

echo "🧪 Testing CI/CD Pipeline Locally"
echo "================================="
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    exit 1
fi

echo "✅ Docker is running"
echo ""

# Test TypeScript compilation
echo "📦 Testing TypeScript compilation..."
if npm run build > /dev/null 2>&1; then
    echo "✅ TypeScript compilation successful"
else
    echo "❌ TypeScript compilation failed"
    npm run build
    exit 1
fi
echo ""

# Test with act if available
if command -v act &> /dev/null; then
    echo "🎭 Testing GitHub Actions workflow with act..."
    echo "(Note: Artifact upload will fail locally - this is expected)"
    echo ""
    
    # Run act and check if build succeeds
    if act -j build --container-architecture linux/amd64 2>&1 | grep -q "Success - Main Build"; then
        echo ""
        echo "✅ GitHub Actions build job passed locally!"
    else
        echo ""
        echo "❌ GitHub Actions build job failed"
        echo "Run 'act -j build --container-architecture linux/amd64' to see full output"
        exit 1
    fi
else
    echo "⚠️  'act' is not installed. Install it to test GitHub Actions locally:"
    echo "   brew install act"
fi

echo ""
echo "🎉 All local tests passed! Safe to push to GitHub."