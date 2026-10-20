import { useEffect, useState } from "react";

/**
 * ハッシュベースの最小ルータ。GitHub Pages は SPA の任意パスを配信できないため、
 * `#/session/abc` のようにハッシュで画面を切り替える。
 */
export type Route =
  | { name: "home" }
  | { name: "category" }
  | { name: "mock" }
  | { name: "session"; id: string }
  | { name: "result"; id: string }
  | { name: "question"; id: string }
  | { name: "questions"; slug?: string }
  | { name: "dashboard" }
  | { name: "history" }
  | { name: "settings" };

export function parseHash(hash: string): Route {
  const parts = hash.replace(/^#\/?/, "").split("/").filter(Boolean).map(decodeURIComponent);
  const [head, arg] = parts;
  switch (head) {
    case "category":
      return { name: "category" };
    case "mock":
      return { name: "mock" };
    case "session":
      return arg ? { name: "session", id: arg } : { name: "home" };
    case "result":
      return arg ? { name: "result", id: arg } : { name: "home" };
    case "question":
      return arg ? { name: "question", id: arg } : { name: "home" };
    case "questions":
      return { name: "questions", slug: arg };
    case "dashboard":
      return { name: "dashboard" };
    case "history":
      return { name: "history" };
    case "settings":
      return { name: "settings" };
    default:
      return { name: "home" };
  }
}

export function href(path: string): string {
  return `#/${path.replace(/^\//, "")}`;
}

export function navigate(path: string, opts: { replace?: boolean } = {}): void {
  const target = href(path);
  if (opts.replace) {
    history.replaceState(null, "", target);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  } else {
    location.hash = target;
  }
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash(location.hash));
  useEffect(() => {
    const onChange = () => {
      setRoute(parseHash(location.hash));
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return route;
}
