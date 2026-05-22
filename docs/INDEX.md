# Rewise AI Documentation Index

Welcome to Rewise AI! This is your central hub for all documentation.

## 📚 Quick Links

### Getting Started
- **[README.md](../README.md)** - Project overview, setup, and quick start guide
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Production deployment instructions

### API Documentation
- **[ERROR_CODES.md](./ERROR_CODES.md)** - Complete error code reference with examples
- **[API_EXAMPLES.md](./API_EXAMPLES.md)** - Real-world request/response examples for all endpoints

### Development Guides
- **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Setting up local development environment
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System architecture and design patterns

### Operations
- **[MONITORING.md](./MONITORING.md)** - Monitoring, logging, and alerting setup
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Common issues and solutions

---

## 🎯 I'm Looking For...

### "I want to set up the project locally"
→ Start with [README.md - Quick Start](../README.md#-quick-start)

### "I need to understand the API"
→ Check [API_EXAMPLES.md](./API_EXAMPLES.md) for real examples

### "My API call returned an error"
→ Look up the error code in [ERROR_CODES.md](./ERROR_CODES.md)

### "I want to deploy to production"
→ Follow [DEPLOYMENT.md](./DEPLOYMENT.md)

### "The app is having issues"
→ See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

### "I want to understand how it works"
→ Read [ARCHITECTURE.md](./ARCHITECTURE.md)

---

## 📖 Documentation Structure

```
docs/
├── INDEX.md                    ← You are here
├── ERROR_CODES.md              ← Error reference with resolutions
├── API_EXAMPLES.md             ← Real API request/response examples
├── DEVELOPMENT.md              ← Local dev setup
├── ARCHITECTURE.md             ← System design
├── DEPLOYMENT.md               ← Production deployment
├── MONITORING.md               ← Logging & alerts
└── TROUBLESHOOTING.md          ← Common issues & fixes
```

---

## 🔑 Key Concepts

### Error Codes
All API errors return a standardized error code format:
- Format: `[CATEGORY]_[NUMBER]` (e.g., `AUTH_001`, `VAL_002`)
- Every error code has a description, example, and resolution
- See [ERROR_CODES.md](./ERROR_CODES.md) for full reference

### API Authentication
All protected endpoints require a Bearer token:
```bash
Authorization: Bearer YOUR_JWT_TOKEN
```

### Error Response Format
```json
{
  "success": false,
  "error": "Human-readable message",
  "code": "ERROR_CODE",
  "details": { /* optional context */ }
}
```

---

## 🚀 Common Workflows

### Workflow 1: Deploy to Production
1. Read [DEPLOYMENT.md](./DEPLOYMENT.md)
2. Set up environment variables
3. Configure MongoDB Atlas and Redis
4. Deploy backend and worker services
5. Set up monitoring with [MONITORING.md](./MONITORING.md)

### Workflow 2: Develop a New Feature
1. Review [ARCHITECTURE.md](./ARCHITECTURE.md)
2. Set up local environment: [DEVELOPMENT.md](./DEVELOPMENT.md)
3. Follow the project structure conventions
4. Add tests (see [README.md - Testing](../README.md#-testing))
5. Commit and create a Pull Request

### Workflow 3: Debug an API Error
1. Check the error code format
2. Look it up in [ERROR_CODES.md](./ERROR_CODES.md)
3. Follow the resolution steps
4. If not resolved, see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

---

## 📊 API Endpoints Overview

### Authentication (3 endpoints)
- `GET /auth/google` - Start OAuth
- `GET /auth/callback` - OAuth callback
- `GET /auth/me` - Get current user

### Highlights (5 endpoints)
- `POST /highlights` - Create highlight
- `GET /highlights` - List highlights
- `GET /highlights/:id` - Get single highlight
- `DELETE /highlights/:id` - Delete highlight
- `POST /highlights/:id/reprocess` - Reprocess failed highlight

### Summary & Stats (2 endpoints)
- `GET /summary/stats` - Get user statistics
- `GET /summary/weekly` - Get weekly digest

### Health (1 endpoint)
- `GET /health` - Health check

**Total: 11 endpoints**

See [API_EXAMPLES.md](./API_EXAMPLES.md) for request/response examples for all endpoints.

---

## 🔒 Security Best Practices

1. **Never commit `.env` file** - Use `.env.example` as template
2. **Rotate API keys regularly** - Especially in production
3. **Use HTTPS in production** - All API calls must be encrypted
4. **Validate all inputs** - Always sanitize user data
5. **Monitor rate limits** - Respect API rate limiting
6. **Check error codes** - Don't expose sensitive info in errors

---

## 🆘 Getting Help

### Documentation
- Check the relevant documentation file
- Search for your issue in [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

### API Errors
- Look up error code in [ERROR_CODES.md](./ERROR_CODES.md)
- Check resolution steps provided
- See [API_EXAMPLES.md](./API_EXAMPLES.md) for correct request format

### Development Issues
- See [DEVELOPMENT.md](./DEVELOPMENT.md)
- Check [ARCHITECTURE.md](./ARCHITECTURE.md)
- Run tests: `npm test`

### Production Issues
- Check [MONITORING.md](./MONITORING.md)
- See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- Review deployment config in [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## 📞 Support Channels

- **GitHub Issues**: [Report bugs](https://github.com/ishaaanfarooq/ReWise.AI/issues)
- **GitHub Discussions**: [Ask questions](https://github.com/ishaaanfarooq/ReWise.AI/discussions)
- **Email**: contact@rewise.ai
- **Documentation**: This wiki

---

## 📝 Contributing to Docs

Help improve our documentation!

1. Found a typo? Edit and submit a PR
2. Want to add a guide? Create a new `.md` file
3. Update this INDEX whenever adding new docs
4. Follow the markdown style used in other docs

---

## ✅ Documentation Checklist

- [x] Error codes with examples
- [x] API examples for all endpoints
- [x] Quick start guide
- [ ] Architecture diagrams (coming soon)
- [ ] Video tutorials (coming soon)
- [ ] FAQ section (coming soon)

---

**Last Updated:** May 22, 2026
**Maintained By:** Rewise AI Team
