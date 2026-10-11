import { withAuth } from "next-auth/middleware";

// Optimistic check only: verifies the JWT cookie without touching the database.
// Pages and actions must still call getCurrentUser().
export default withAuth({
  pages: { signIn: "/login" },
});

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|icon.png|login|.*\\.png$).*)"],
};
