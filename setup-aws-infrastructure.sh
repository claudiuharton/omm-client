#!/bin/bash

# AWS S3 + CloudFront Setup Script for harton.digital
# This script sets up the complete infrastructure for hosting a React app on AWS

set -e

# Configuration
DOMAIN_NAME="harton.digital"
WWW_DOMAIN="www.harton.digital"
BUCKET_NAME="harton.digital"
REGION="eu-central-1"
BACKUP_BUCKET="harton-digital-backup"
BACKUP_REGION="eu-west-1"

echo "🚀 Setting up AWS infrastructure for $DOMAIN_NAME"

# Check if AWS CLI is configured
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo "❌ AWS CLI is not configured. Please run 'aws configure' first."
    exit 1
fi

echo "✅ AWS CLI is configured"

# Create S3 bucket for website
echo "📦 Creating S3 bucket: $BUCKET_NAME"
aws s3 mb s3://$BUCKET_NAME --region $REGION 2>/dev/null || echo "Bucket already exists"

# Configure S3 bucket for static website hosting
echo "🌐 Configuring S3 bucket for static website hosting"
aws s3 website s3://$BUCKET_NAME --index-document index.html --error-document index.html

# Create bucket policy for public read access
echo "🔓 Setting bucket policy for public read access"
cat > bucket-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::$BUCKET_NAME/*"
        }
    ]
}
EOF

aws s3api put-bucket-policy --bucket $BUCKET_NAME --policy file://bucket-policy.json
rm bucket-policy.json

# Disable block public access
echo "🔐 Configuring public access settings"
aws s3api put-public-access-block \
    --bucket $BUCKET_NAME \
    --public-access-block-configuration \
    "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"

# Create backup bucket
echo "💾 Creating backup bucket: $BACKUP_BUCKET"
aws s3 mb s3://$BACKUP_BUCKET --region $BACKUP_REGION 2>/dev/null || echo "Backup bucket already exists"

# Enable versioning on main bucket
echo "📝 Enabling versioning on main bucket"
aws s3api put-bucket-versioning \
    --bucket $BUCKET_NAME \
    --versioning-configuration Status=Enabled

# Configure CORS
echo "🌍 Configuring CORS"
cat > cors-config.json << EOF
{
    "CORSRules": [
        {
            "AllowedOrigins": ["https://$DOMAIN_NAME", "https://$WWW_DOMAIN"],
            "AllowedHeaders": ["*"],
            "AllowedMethods": ["GET", "HEAD"],
            "MaxAgeSeconds": 3600
        }
    ]
}
EOF

aws s3api put-bucket-cors --bucket $BUCKET_NAME --cors-configuration file://cors-config.json
rm cors-config.json

# Create CloudFront Origin Access Control (OAC)
echo "☁️ Creating CloudFront Origin Access Control"
OAC_CONFIG=$(cat << EOF
{
    "CallerReference": "harton-digital-oac-$(date +%s)",
    "Comment": "OAC for harton.digital S3 bucket",
    "OriginAccessControlOriginType": "s3",
    "SigningBehavior": "always",
    "SigningProtocol": "sigv4"
}
EOF
)

OAC_RESULT=$(aws cloudfront create-origin-access-control --origin-access-control-config "$OAC_CONFIG" 2>/dev/null || echo "")

if [ -n "$OAC_RESULT" ]; then
    OAC_ID=$(echo $OAC_RESULT | jq -r '.OriginAccessControl.Id')
    echo "✅ Created Origin Access Control: $OAC_ID"
else
    echo "⚠️ Origin Access Control may already exist"
fi

# Get SSL certificate ARN (assuming it exists or needs to be created)
echo "🔒 Checking for SSL certificate"
CERT_ARN=$(aws acm list-certificates --region us-east-1 --query "CertificateSummaryList[?DomainName=='$DOMAIN_NAME'].CertificateArn" --output text)

if [ -z "$CERT_ARN" ]; then
    echo "⚠️ SSL certificate not found for $DOMAIN_NAME"
    echo "Please create an SSL certificate in AWS Certificate Manager (us-east-1 region) for:"
    echo "  - $DOMAIN_NAME"
    echo "  - $WWW_DOMAIN"
    echo "Then update the certificate ARN in your deployment configuration."
else
    echo "✅ Found SSL certificate: $CERT_ARN"
fi

# Create Route53 hosted zone (if it doesn't exist)
echo "🌐 Checking Route53 hosted zone for $DOMAIN_NAME"
HOSTED_ZONE_ID=$(aws route53 list-hosted-zones --query "HostedZones[?Name=='$DOMAIN_NAME.'].Id" --output text | sed 's|/hostedzone/||')

if [ -z "$HOSTED_ZONE_ID" ]; then
    echo "📡 Creating Route53 hosted zone for $DOMAIN_NAME"
    HOSTED_ZONE_RESULT=$(aws route53 create-hosted-zone \
        --name $DOMAIN_NAME \
        --caller-reference "harton-digital-$(date +%s)" \
        --hosted-zone-config Comment="Hosted zone for harton.digital")
    
    HOSTED_ZONE_ID=$(echo $HOSTED_ZONE_RESULT | jq -r '.HostedZone.Id' | sed 's|/hostedzone/||')
    echo "✅ Created hosted zone: $HOSTED_ZONE_ID"
    
    # Get name servers
    NAME_SERVERS=$(aws route53 get-hosted-zone --id $HOSTED_ZONE_ID --query "DelegationSet.NameServers" --output table)
    echo "📋 Update your domain registrar with these name servers:"
    echo "$NAME_SERVERS"
else
    echo "✅ Found existing hosted zone: $HOSTED_ZONE_ID"
fi

# Create GitHub Secrets template
echo "🔑 Creating GitHub Secrets template"
cat > github-secrets.md << EOF
# GitHub Secrets Configuration

Add these secrets to your GitHub repository settings:

## Required Secrets:
- \`AWS_ACCESS_KEY_ID\`: Your AWS access key ID
- \`AWS_SECRET_ACCESS_KEY\`: Your AWS secret access key
- \`S3_BUCKET_NAME\`: $BUCKET_NAME
- \`CLOUDFRONT_DISTRIBUTION_ID\`: (Will be available after CloudFront distribution is created)

## Optional Secrets:
- \`SSL_CERTIFICATE_ARN\`: $CERT_ARN
- \`HOSTED_ZONE_ID\`: $HOSTED_ZONE_ID

## Environment Variables (already configured in workflow):
- \`DOMAIN_NAME\`: $DOMAIN_NAME
- \`AWS_REGION\`: $REGION
EOF

echo "✅ GitHub secrets template created: github-secrets.md"

# Create deployment checklist
cat > deployment-checklist.md << EOF
# Deployment Checklist for harton.digital

## Pre-deployment:
- [ ] AWS CLI configured with appropriate permissions
- [ ] SSL certificate created in ACM (us-east-1 region)
- [ ] Domain name servers updated with Route53 name servers
- [ ] GitHub secrets configured

## Infrastructure created:
- [x] S3 bucket: $BUCKET_NAME
- [x] S3 bucket configured for static website hosting
- [x] Backup bucket: $BACKUP_BUCKET
- [x] Bucket policy for public read access
- [x] CORS configuration
- [x] Route53 hosted zone: $HOSTED_ZONE_ID

## Still needed:
- [ ] CloudFront distribution (will be created on first deployment)
- [ ] Route53 DNS records (will be created after CloudFront distribution)
- [ ] SSL certificate validation (if newly created)

## Deployment commands:
\`\`\`bash
# Build and deploy locally (if needed)
npm run build
aws s3 sync dist/ s3://$BUCKET_NAME --delete
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
\`\`\`

## Monitoring:
- CloudWatch metrics available in AWS Console
- CloudFront logs can be enabled if needed
- Access logs can be configured on S3 bucket

## Domain configuration:
- Main domain: https://$DOMAIN_NAME
- WWW redirect: https://$WWW_DOMAIN
- API endpoint: https://api.$DOMAIN_NAME (configure separately)
EOF

echo "✅ Deployment checklist created: deployment-checklist.md"

echo ""
echo "🎉 AWS infrastructure setup completed!"
echo ""
echo "Next steps:"
echo "1. Review and configure GitHub secrets (see github-secrets.md)"
echo "2. Create SSL certificate in AWS Certificate Manager if not exists"
echo "3. Update domain name servers with Route53 name servers"
echo "4. Push to main branch to trigger deployment"
echo "5. Create CloudFront distribution (will happen automatically on first deployment)"
echo ""
echo "Files created:"
echo "- github-secrets.md (GitHub secrets configuration)"
echo "- deployment-checklist.md (Complete deployment checklist)"
echo ""
echo "S3 bucket: https://$BUCKET_NAME.s3-website.$REGION.amazonaws.com"
echo "Final domain: https://$DOMAIN_NAME" 