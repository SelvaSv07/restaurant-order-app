/** Build `/billing` URL with optional category and search query. */
export function billingHref(opts: { category?: string; q?: string }) {
  const sp = new URLSearchParams();
  if (opts.category && opts.category !== "all") sp.set("category", opts.category);
  if (opts.q) sp.set("q", opts.q);
  const s = sp.toString();
  return s ? `/billing?${s}` : "/billing";
}
