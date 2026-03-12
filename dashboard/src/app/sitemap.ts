import { type MetadataRoute } from 'next';
import { baseURL, routes as routesConfig } from "@/resources";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const today = new Date().toISOString().split("T")[0];
  const activeRoutes = Object.keys(routesConfig).filter(
    (route) => routesConfig[route as keyof typeof routesConfig]
  );

  const routes = activeRoutes.map((route) => ({
    url: `${baseURL}${route !== "/" ? route : ""}`,
    lastModified: today,
    changefreq: route === "/" ? "daily" : "weekly",
    priority: route === "/" ? 1.0 : 0.9,
  }));

  return routes;
}
