import { handleDownloadRequest } from "@/services/speedtest.server";
import type { Route } from "./+types/api.download";

export async function loader({ request }: Route.LoaderArgs) {
  return handleDownloadRequest(request);
}
