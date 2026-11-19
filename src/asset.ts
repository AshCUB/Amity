/** URL for a file in `public/`, respecting the deploy base path (e.g. `/Amity/` on GitHub Pages). */
export const asset = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`
