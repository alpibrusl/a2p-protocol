# OpenID Connect + a2p Integration

This example demonstrates how to bridge **OpenID Connect authentication** with **a2p profiles**, enabling users to authenticate with OIDC and then access their a2p profile.

## The Big Picture

```
┌─────────────────────────────────────────────────────────┐
│                                                           │
│   OpenID Connect = Authentication ("who are you?")      │
│   a2p = Profile data ("what are your preferences?")    │
│                                                           │
│   Together = Authenticated users with AI profiles      │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

## Why OIDC + a2p?

| Layer | Purpose | Technology |
|-------|---------|------------|
| **Authentication** | "Who are you?" | OpenID Connect |
| **Identity** | User identifier | DID (mapped from OIDC) |
| **Profile Data** | "What should I know about you?" | a2p Profile |

## Flow

```
1. User authenticates with OIDC provider (Google, GitHub, etc.)
   ↓
2. OIDC returns ID token with user claims (email, name, sub)
   ↓
3. Map OIDC identity to DID (did:a2p:user:oidc:sub)
   ↓
4. Load or create a2p profile using DID
   ↓
5. Agent accesses user's preferences, memories, consent policies
```

## Prerequisites

```bash
# Install OIDC libraries
pip install authlib httpx

# Install a2p SDK
pip install a2p-sdk
```

## Example: OIDC Login → a2p Profile

See `main.py` for a complete working example.

```bash
# Set environment variables (for simulation)
export OIDC_PROVIDER="google"  # or "github"
export OIDC_GOOGLE_SUB="google-123456789"
export OIDC_GOOGLE_EMAIL="alice@example.com"
export OIDC_GOOGLE_NAME="Alice"

# Run example
python main.py
```

The example demonstrates:
1. Simulating OIDC authentication (in production, use proper OIDC flow)
2. Mapping OIDC identity to DID
3. Loading or creating a2p profile
4. Syncing OIDC claims to profile
5. Agent accessing profile

## DID Mapping Strategies

### Strategy 1: Provider + Subject

```python
# did:a2p:user:oidc:<provider>:<sub>
user_did = f"did:a2p:user:oidc:google:{oidc_claims['sub']}"
```

**Pros**: Simple, deterministic  
**Cons**: Sub might change if user deletes/recreates account

### Strategy 2: Email-based

```python
# did:a2p:user:oidc:email:<normalized-email>
email = oidc_claims['email'].lower().strip()
user_did = f"did:a2p:user:oidc:email:{email}"
```

**Pros**: Stable across providers  
**Cons**: Email might change

### Strategy 3: Custom Mapping Service

```python
# Use a mapping service to create stable DID
mapping_service = "https://did-mapper.example.com"
user_did = await map_oidc_to_did(oidc_claims, mapping_service)
```

**Pros**: Most flexible, can handle edge cases  
**Cons**: Requires additional service

## Integration with Gaugid

Gaugid (a2p-cloud SaaS) can support OIDC as an authentication option:

```python
# Gaugid with OIDC
from a2p.storage.cloud import CloudStorage

storage = CloudStorage(
    api_url="https://api.gaugid.com",
    auth_token=oidc_id_token,  # OIDC ID token instead of Firebase token
    agent_did="did:a2p:agent:my-agent"
)
```

**Benefits for Gaugid:**
- ✅ Users can login with Google, GitHub, Microsoft, etc.
- ✅ No need to create separate Gaugid account
- ✅ Familiar authentication flow
- ✅ Enterprise SSO support

## Use Cases

1. **Web Applications**: Users login with OIDC, app accesses their a2p profile
2. **Enterprise**: SSO with OIDC, employees have a2p profiles
3. **Multi-Provider**: Support multiple OIDC providers (Google, GitHub, etc.)
4. **Migration**: Existing OIDC users can adopt a2p profiles

## Next Steps

- [OpenID Connect Spec](https://openid.net/connect/) - Official spec
- [Authlib](https://authlib.org/) - Python OIDC library (for production)
- [Run the example](./main.py) - Complete working code
- [a2p Documentation](https://alpibrusl.github.io/a2p-protocol/) - Full docs
