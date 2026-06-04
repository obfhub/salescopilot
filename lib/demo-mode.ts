export type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function isDemoSearch(searchParams?: SearchParams) {
  const params = searchParams ? await searchParams : {};
  const demo = params.demo;
  const value = Array.isArray(demo) ? demo[0] : demo;
  return value === "1" || value === "true";
}
