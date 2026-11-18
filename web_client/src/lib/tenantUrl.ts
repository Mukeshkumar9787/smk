export function extractTenantSlugFromPath(pathname = ""): string | null {
  if (!pathname) return null;
  const match = String(pathname).match(/^\/s\/([a-z0-9-]+)(?:\/|$)/i);
  return match ? match[1].toLowerCase() : null;
}

export function getClientTenantSlug(): string | null {
  if (typeof window === "undefined") return null;
  return extractTenantSlugFromPath(window.location.pathname);
}

export function getClientTenantBasePath(): string {
  const slug = getClientTenantSlug();
  return slug ? `/s/${slug}` : "";
}

export function getTenantBasePath(slug?: string | null, isDefault = false): string {
  if (!slug || isDefault) return "";
  return `/s/${encodeURIComponent(slug)}`;
}

export function withTenantPath(path: string, basePath?: string | null): string {
  if (!path) return basePath || "/";
  if (
    /^https?:\/\//i.test(path) ||
    path.startsWith("#") ||
    path.startsWith("mailto:") ||
    path.startsWith("tel:")
  ) {
    return path;
  }

  const resolvedBase =
    basePath !== undefined && basePath !== null
      ? basePath
      : getClientTenantBasePath();

  if (!resolvedBase) return path;

  // Avoid double-prefixing paths already scoped to /s/<slug>
  if (path === resolvedBase || path.startsWith(`${resolvedBase}/`) || path.startsWith(`${resolvedBase}?`)) {
    return path;
  }

  if (path === "/") {
    return resolvedBase;
  }

  if (path.startsWith("/?")) {
    return `${resolvedBase}${path.slice(1)}`;
  }

  return path.startsWith("/") ? `${resolvedBase}${path}` : `${resolvedBase}/${path}`;
}

export function stripTenantPrefix(pathname = ""): string {
  if (!pathname) return "/";
  const stripped = String(pathname).replace(/^\/s\/[a-z0-9-]+(?=\/|$)/i, "");
  return stripped || "/";
}

export function getTenantStorageKey(baseKey: string, explicitSlug?: string | null): string {
  const slug = explicitSlug !== undefined ? explicitSlug : getClientTenantSlug();
  if (!slug) return baseKey;
  return `tenant:${slug}:${baseKey}`;
}
