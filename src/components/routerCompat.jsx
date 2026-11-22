"use client";

if (typeof window === "undefined" && typeof global !== "undefined") {
  if (!global.localStorage) {
    global.localStorage = {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
    };
  }
}

import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export function useNavigate() {
  const router = useRouter();
  return (to, options) => {
    if (typeof to === "number") {
      if (to === -1) router.back();
      return;
    }
    if (options?.replace) {
      router.replace(to);
    } else {
      router.push(to);
    }
  };
}

export function useLocation() {
  const pathname = usePathname() || "";
  let search = "";
  try {
    const searchParams = useSearchParams();
    search = searchParams ? `?${searchParams.toString()}` : "";
  } catch {
    // Outside suspense fallback
  }
  return {
    pathname,
    search,
    state: {},
  };
}

export function NavLink({ to, href, className, children, end, ...props }) {
  const pathname = usePathname() || "";
  const target = to || href || "/";
  const isActive = end
    ? pathname === target
    : pathname === target || (target !== "/" && pathname.startsWith(target));
  const resolvedClass =
    typeof className === "function" ? className({ isActive }) : className;

  return (
    <Link href={target} className={resolvedClass} {...props}>
      {children}
    </Link>
  );
}

export function Navigate({ to, replace = true }) {
  const router = useRouter();
  useEffect(() => {
    if (replace) {
      router.replace(to);
    } else {
      router.push(to);
    }
  }, [router, to, replace]);
  return null;
}

export { Link };
export default {
  useNavigate,
  useLocation,
  NavLink,
  Navigate,
  Link,
};
