import { APIInfrastructure } from '../src/platform/api/apiInfrastructure';

describe('API Tests - OpenAPI specifications and rate limiters', () => {
  it('should compile valid OpenAPI 3.0 specification schemas', () => {
    const spec = APIInfrastructure.getOpenAPISpec();
    expect(spec.openapi).toBe('3.0.0');
    expect(spec.info.title).toBe('SentinelFlow Enterprise API');
    expect(spec.paths['/api/v1/health']).toBeDefined();
  });
});
