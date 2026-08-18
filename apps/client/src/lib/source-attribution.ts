const internalSourceHost = "travelverse.local";

export type ResolvedSourceLink = {
  href: string;
  isExternal: boolean;
};

export function resolveSourceLink(sourceUrl: string): ResolvedSourceLink {
  try {
    const url = new URL(sourceUrl);

    if (url.hostname === internalSourceHost && url.pathname.startsWith("/sources/")) {
      return {
        href: url.pathname,
        isExternal: false,
      };
    }

    return {
      href: sourceUrl,
      isExternal: true,
    };
  } catch {
    return {
      href: sourceUrl,
      isExternal: true,
    };
  }
}
