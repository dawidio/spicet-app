import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Lives inside the myhc-tools WordPress plugin and gets served at
// public URL /tools/spicet/ via a PHP route intercept (see myhc-tools.php).
//
// Assets must live at /wp-content/plugins/myhc-tools/tools/spicet/
// because GoDaddy Managed WordPress nginx will 404 anything under
// /tools/spicet/* before PHP runs.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/wp-content/plugins/myhc-tools/tools/spicet/',
})
