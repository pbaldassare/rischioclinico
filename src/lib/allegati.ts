import { BUCKET_ALLEGATI, supabase } from "./supabase";

export async function caricaAllegati(segnalazioneId: string, files: File[]) {
  for (const file of files) {
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
