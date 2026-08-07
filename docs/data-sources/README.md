# Data-source registry

Document every external provider here before integrating it.

For each provider record:

- Data supplied and API documentation
- Authentication method and environment-variable names
- Rate limits and pricing
- Storage/caching restrictions
- Required attribution and content licence
- Refresh interval and stale-data behaviour
- Sandbox versus production behaviour
- Fallback provider or user-facing failure state

Never expose secret provider keys to browser code unless the provider explicitly requires a restricted public token.

