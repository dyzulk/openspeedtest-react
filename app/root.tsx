import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";
import "./app.css";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.bunny.net" },
  {
    rel: "stylesheet",
    href: "https://fonts.bunny.net/css?family=roboto:400,500,700&display=swap",
  },
  { rel: "apple-touch-icon", sizes: "180x180", href: "/assets/images/icons/apple-touch-icon.png" },
  { rel: "icon", type: "image/png", sizes: "32x32", href: "/assets/images/icons/favicon-32x32.png" },
  { rel: "icon", type: "image/png", sizes: "16x16", href: "/assets/images/icons/favicon-16x16.png" },
  { rel: "manifest", href: "/assets/images/icons/site.webmanifest" },
  { rel: "mask-icon", href: "/assets/images/icons/safari-pinned-tab.svg", color: "#5bbad5" },
  { rel: "shortcut icon", href: "/assets/images/icons/favicon.ico" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="msapplication-TileColor" content="#ffc40d" />
        <meta name="msapplication-config" content="/assets/images/icons/browserconfig.xml" />
        <meta name="theme-color" content="#ffffff" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
