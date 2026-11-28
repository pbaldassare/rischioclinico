import { BUCKET_ALLEGATI, supabase } from "./supabase";

/** Foto da telefono pesano 3-8 MB: ridotte a max 1600 px JPEG prima di partire. Altri file passano intatti. */
export async function comprimiImmagine(file: File, lato = 1600): Promise<File> {
  if (!file.type.startsWith("image/") || file.size < 600_000) return file;
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scala = Math.min(1, lato / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scala);
    canvas.height = Math.round(bmp.height * scala);
    canvas.getContext("2d")?.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.82));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
}

export async function caricaAllegati(segnalazioneId: string, files: File[]) {
  for (const originale of files) {
    const file = await comprimiImmagine(originale);
    const sicuro = file.name.replace(/[^\w.\-]+/g, "_");
    const path = `${segnalazioneId}/${crypto.randomUUID()}-${sicuro}`;
    const { error: up } = await supabase.storage.from(BUCKET_ALLEGATI).upload(path, file);
    if (up) throw up;
    const { error } = await supabase.from("allegati").insert({
      segnalazione_id: segnalazioneId,
      nome_file: file.name,
      url: path,
    });
    if (error) throw error;
  }
}

export async function urlFirmato(path: string) {
  const { data, error } = await supabase.storage.from(BUCKET_ALLEGATI).createSignedUrl(path, 3600);
  if (error) return null;
  return data.signedUrl;
}
