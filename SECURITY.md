# Security Policy

## Responsible Disclosure

If you discover a security vulnerability, **do not** create a public GitHub issue.

Instead:

1. Email: security@tumataxi.mz
2. Include:
   - Vulnerability description
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if available)

3. Allow 48-72 hours for response
4. Do not disclose publicly until patched

## Security Standards

This project adheres to:

- ✅ OWASP Top 10 mitigation
- ✅ Zero-trust architecture
- ✅ End-to-end encryption for sensitive data
- ✅ Regular security audits
- ✅ Dependency vulnerability scanning
- ✅ Rate limiting on all API endpoints
- ✅ SQL injection prevention (Prisma parameterization)
- ✅ XSS protection (Content-Security-Policy headers)
- ✅ CSRF token validation
- ✅ Secrets management (never in code)

## Dependencies

All dependencies are regularly audited:

```bash
npm audit
npm outdated
```

## Deployment Security

- ✅ SSL/TLS via Let's Encrypt
- ✅ Database never publicly accessible
- ✅ Secrets stored in environment variables
- ✅ Rate limiting on authentication endpoints
- ✅ Health checks + monitoring
- ✅ Automatic backups

## Contact

- **Security Issues:** security@tumataxi.mz
- **General Support:** support@tumataxi.mz
