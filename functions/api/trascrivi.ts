import { handleTrascrizione } from "../../api/assistente";

type Ctx = { request: Request; env: { OPENAI_API_KEY?: string } };

export const onRequestPost = async ({ request, env }: Ctx) =>
  handleTrascrizione(await request.blob(), env.OPENAI_API_KEY);
