import '@mastra/core';

declare global {
  interface CustomRouteVariables {
    userId: string;
    organizationId: string;
    userRole: string;
    sessionId: string;
  }
}

declare module '@mastra/core' {
  interface CustomRouteVariables {
    userId: string;
    organizationId: string;
    userRole: string;
    sessionId: string;
  }
}
