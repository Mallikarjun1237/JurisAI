"""
Neon Object Storage Service (S3-Compatible)
Provides unified cloud document storage for JurisAI legal case files,
contracts, court petitions, and evidence attachments.
"""

import os
import socket
from typing import Optional
from dotenv import load_dotenv

# Load env from root .env.local and backend .env
_backend_dir = os.path.dirname(os.path.abspath(__file__))
_root_dir = os.path.dirname(_backend_dir)
_env_local = os.path.join(_root_dir, ".env.local")
if os.path.exists(_env_local):
    load_dotenv(_env_local, override=True)
load_dotenv(os.path.join(_backend_dir, ".env"))

# DNS fallback for Windows local intranet resolvers that refuse *.aws.neon.tech
_orig_getaddrinfo = socket.getaddrinfo
_NEON_FALLBACK_IPS = {
    "storage.c-5.ap-southeast-1.aws.neon.tech": "52.74.16.236",
    "c-5.ap-southeast-1.aws.neon.tech": "54.255.3.74",
}


def _neon_safe_getaddrinfo(host, port, *args, **kwargs):
    try:
        return _orig_getaddrinfo(host, port, *args, **kwargs)
    except socket.gaierror:
        for domain, ip in _NEON_FALLBACK_IPS.items():
            if domain in str(host):
                return _orig_getaddrinfo(ip, port, *args, **kwargs)
        raise


socket.getaddrinfo = _neon_safe_getaddrinfo

AWS_ENDPOINT_URL_S3 = os.getenv("AWS_ENDPOINT_URL_S3")
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_REGION = os.getenv("AWS_REGION", "ap-southeast-1")
DEFAULT_BUCKET = "assets"

_s3_client = None


def is_storage_configured() -> bool:
    return bool(AWS_ENDPOINT_URL_S3 and AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY)


def get_s3_client():
    global _s3_client
    if _s3_client is None:
        if not is_storage_configured():
            return None
        import boto3
        from botocore.client import Config

        _s3_client = boto3.client(
            "s3",
            endpoint_url=AWS_ENDPOINT_URL_S3,
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
            region_name=AWS_REGION,
            config=Config(s3={"addressing_style": "path"}),
        )
    return _s3_client


def upload_document(
    file_bytes: bytes,
    key: str,
    bucket: str = DEFAULT_BUCKET,
    content_type: Optional[str] = None,
) -> bool:
    """Uploads document bytes to Neon Object Storage bucket."""
    client = get_s3_client()
    if not client:
        return False
    try:
        extra_args = {}
        if content_type:
            extra_args["ContentType"] = content_type
        client.put_object(
            Bucket=bucket,
            Key=key,
            Body=file_bytes,
            **extra_args,
        )
        return True
    except Exception as e:
        print(f"[Neon Object Storage] Upload error for {key}: {e}")
        return False


def get_document(key: str, bucket: str = DEFAULT_BUCKET) -> Optional[bytes]:
    """Downloads document bytes from Neon Object Storage bucket."""
    client = get_s3_client()
    if not client:
        return None
    try:
        obj = client.get_object(Bucket=bucket, Key=key)
        return obj["Body"].read()
    except Exception as e:
        print(f"[Neon Object Storage] Download error for {key}: {e}")
        return None


def generate_presigned_download_url(
    key: str,
    bucket: str = DEFAULT_BUCKET,
    expires_in: int = 3600,
) -> Optional[str]:
    """Generates a secure presigned URL for document download."""
    client = get_s3_client()
    if not client:
        return None
    try:
        url = client.generate_presigned_url(
            ClientMethod="get_object",
            Params={"Bucket": bucket, "Key": key},
            ExpiresIn=expires_in,
        )
        return url
    except Exception as e:
        print(f"[Neon Object Storage] Presign error for {key}: {e}")
        return None
