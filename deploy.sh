#!/bin/bash

# Manual Deployment Script for harton.digital
# This script builds the React app and deploys it to AWS S3 + CloudFront

set -e

# Configuration
BUCKET_NAME="harton.digital"
REGION="eu-central-1"
CLOUDFRONT_DISTRIBUTION_ID="${CLOUDFRONT_DISTRIBUTION_ID:-}"

echo "🚀 Starting deployment for harton.digital"

# Check if required environment variables are set
if [ -z "$CLOUDFRONT_DISTRIBUTION_ID" ]; then
    echo "⚠️ CLOUDFRONT_DISTRIBUTION_ID environment variable not set"
    echo "You can set it by running: export CLOUDFRONT_DISTRIBUTION_ID=your_distribution_id"
    echo "Deployment will continue without CloudFront invalidation"
fi

# Check if AWS CLI is configured
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo "❌ AWS CLI is not configured. Please run 'aws configure' first."
    exit 1
fi

echo "✅ AWS CLI is configured"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm ci
fi

# Build the application
echo "🔨 Building React application..."
REACT_APP_API_URL=https://api.harton.digital \
REACT_APP_ENVIRONMENT=production \
npm run build

# Check if build was successful
if [ ! -d "dist" ]; then
    echo "❌ Build failed - dist directory not found"
    exit 1
fi

echo "✅ Build completed successfully"

# Deploy to S3
echo "📤 Deploying to S3 bucket: $BUCKET_NAME"

# Upload static assets with long cache time
aws s3 sync dist/ s3://$BUCKET_NAME \
    --cache-control "public, max-age=31536000, immutable" \
    --exclude "*.html" \
    --exclude "service-worker.js" \
    --exclude "manifest.json" \
    --delete

# Upload HTML files and service worker with no cache
aws s3 sync dist/ s3://$BUCKET_NAME \
    --cache-control "public, max-age=0, must-revalidate" \
    --include "*.html" \
    --include "service-worker.js" \
    --include "manifest.json"

echo "✅ Files uploaded to S3"

# Invalidate CloudFront cache if distribution ID is provided
if [ -n "$CLOUDFRONT_DISTRIBUTION_ID" ]; then
    echo "🔄 Invalidating CloudFront cache..."
    INVALIDATION_ID=$(aws cloudfront create-invalidation \
        --distribution-id $CLOUDFRONT_DISTRIBUTION_ID \
        --paths "/*" \
        --query 'Invalidation.Id' \
        --output text)
    
    echo "✅ CloudFront invalidation created: $INVALIDATION_ID"
    echo "🕐 Cache invalidation may take 5-15 minutes to complete"
else
    echo "⚠️ Skipping CloudFront invalidation (distribution ID not provided)"
fi

# Show deployment summary
echo ""
echo "🎉 Deployment completed successfully!"
echo ""
echo "Deployment details:"
echo "- S3 Bucket: s3://$BUCKET_NAME"
echo "- Region: $REGION"
echo "- Website URL: https://harton.digital"
echo "- S3 Website URL: http://$BUCKET_NAME.s3-website.$REGION.amazonaws.com"
echo ""

if [ -n "$CLOUDFRONT_DISTRIBUTION_ID" ]; then
    echo "CloudFront Distribution: $CLOUDFRONT_DISTRIBUTION_ID"
    echo "Cache invalidation in progress..."
else
    echo "💡 To enable CloudFront invalidation, set the CLOUDFRONT_DISTRIBUTION_ID environment variable"
fi

echo ""
echo "🌐 Your site should be available at: https://harton.digital" 