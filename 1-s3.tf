resource "aws_s3_bucket" "reactappbucket" {
  bucket = "omm-bucket-s3"

  tags = {
    "env" = "dev"
  }
}

resource "aws_s3_bucket_website_configuration" "react-config" {
  bucket = aws_s3_bucket.reactappbucket.id

  index_document {
    suffix = "index.html"
  }

}

resource "aws_s3_bucket_ownership_controls" "bucket-ownership" {
  bucket = aws_s3_bucket.reactappbucket.id

  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

resource "aws_s3_bucket_public_access_block" "bucket-public-access" {
  bucket = aws_s3_bucket.reactappbucket.id

  block_public_acls = false
  block_public_policy = false
  ignore_public_acls = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_acl" "bucket-acl" {
  bucket = aws_s3_bucket.reactappbucket.id
  acl = "public-read"

  depends_on = [aws_s3_bucket_ownership_controls.bucket-ownership,
  aws_s3_bucket_public_access_block.bucket-public-access]

}