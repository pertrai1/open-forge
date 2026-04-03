import { searchSpecs } from '../../specs/searcher.js';

export async function handleSearchSpecs(args: {
  query: string;
}): Promise<{
  results: Array<{
    uri: string;
    name: string;
    description: string;
    matchType: string;
  }>;
  query: string;
  total: number;
}> {
  const results = await searchSpecs(args.query);

  return {
    results,
    query: args.query,
    total: results.length,
  };
}
