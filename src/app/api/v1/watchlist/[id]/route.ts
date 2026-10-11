import { withApi } from "@/server/http/with-api";
import { getHandler, deleteHandler } from "@/server/watchlist/controller";

export const dynamic = "force-dynamic";

export const GET = withApi(getHandler, { auth: true });
export const DELETE = withApi(deleteHandler, { auth: true });
