import { handleAssistente, type AssistenteRichiesta } from "../../api/assistente";

type Ctx = { request: Request; env: { OPENAI_API_KEY?: string } };

export const onRequestPost = async ({ request, env }: Ctx) =>
  Response.json(await handleAssistente((await request.json()) as AssistenteRichiesta, env.OPENAI_API_KEY));
