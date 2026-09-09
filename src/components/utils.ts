// z.B. in einer utils.ts oder direkt in db/database.ts
import { File, Paths } from "expo-file-system";

export function getFullImagePath(filename: string | null | undefined): string {
  if (!filename) return "";
  return new File(Paths.document, filename).uri;
}

export async function saveImagePermanently(tempUri: string, personId: number, index: number) {
  const filename = `${personId}_${Date.now()}_${index}.jpg`;
  const sourceFile = new File(tempUri);
  const destFile = new File(Paths.document, filename);
  sourceFile.copy(destFile);
  return filename; // nur der Name, nicht destFile.uri
}