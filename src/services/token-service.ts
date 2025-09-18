// In-memory store for admin device tokens
const adminTokens = new Set<string>();

export function addAdminToken(token: string) {
  adminTokens.add(token);
}

export function getAdminTokens(): string[] {
  return Array.from(adminTokens);
}
