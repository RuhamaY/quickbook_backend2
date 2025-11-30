#!/bin/bash
# Generate self-signed certificate for local HTTPS development
# This is optional - Next.js --experimental-https will generate its own

openssl req -x509 -newkey rsa:4096 -nodes \
  -keyout localhost-key.pem \
  -out localhost-cert.pem \
  -days 365 \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

echo "Certificate generated:"
echo "  - localhost-key.pem"
echo "  - localhost-cert.pem"
echo ""
echo "Note: Next.js --experimental-https generates its own certificates automatically."


