declare global {
  interface CustomJwtSessionClaims {
    publicMetadata?: {
      role?: "admin" | "contributor";
    };
  }
}

export {};
