import { readChangesDirectory } from '../changes/reader.js';

export async function handleChangesList(): Promise<{ changes: Array<{ name: string; uri: string; timestamp?: string; file?: string }>; total: number }> {
  const changeNames = await readChangesDirectory();

  const changes = changeNames.map((name) => ({
    name,
    uri: `changes://${name}`,
    file: `openspec/changes/${name}`,
  }));

  return {
    changes,
    total: changes.length,
  };
}
