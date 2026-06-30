import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("api/download", "routes/api.download.tsx"),
  route("api/upload", "routes/api.upload.tsx"),
] satisfies RouteConfig;
