/**
 * Evaluated once when the module is loaded rather than during render. Using
 * this keeps static prerendering happy under Cache Components, which treats a
 * `new Date()` call inside a component as unstable runtime data.
 */
export const CURRENT_YEAR = new Date().getFullYear();
