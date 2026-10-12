/** Storage key and <html> attribute shared by the theme module and the bootstrap script. */
export const THEME_STORAGE_KEY = "trader6ix-theme";
export const THEME_ATTR = "data-app-theme";

/**
 * Runs before first paint so a light-theme visitor never sees a dark flash.
 * Mirrors the stored choice onto <html>, where the light rules hang off.
 *
 * Kept free of React imports so `vite.config.ts` can inline it into index.html.
 */
export const THEME_BOOTSTRAP = `try{if(localStorage.getItem("${THEME_STORAGE_KEY}")==="light")document.documentElement.setAttribute("${THEME_ATTR}","light")}catch(e){}`;
