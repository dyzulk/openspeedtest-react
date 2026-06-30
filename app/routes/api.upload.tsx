import { handleUploadRequest } from "@/services/speedtest.server";
import type { Route } from "./+types/api.upload";

export async function loader({ request }: Route.LoaderArgs) {
  return handleUploadRequest(request);
}

export async function action({ request }: Route.ActionArgs) {
  return handleUploadRequest(request);
}
