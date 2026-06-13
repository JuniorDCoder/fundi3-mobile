/** Turns a lesson/course title into a GitHub-repo-safe slug (handles accented French titles). */
export function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "fundi3-project"
  );
}
