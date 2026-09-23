/**
 * Escape special regular expression characters to prevent ReDoS and NoSQL query injection
 */
export function escapeRegex(text: string): string {
    if (!text || typeof text !== "string") return "";
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}
