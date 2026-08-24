import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// The WordPress build lives inside the myhc-tools plugin and gets served at
// public URL /tools/spicet/ via a PHP route intercept (see myhc-tools.php).
// Its assets must live at /wp-content/plugins/myhc-tools/tools/spicet/ because
// GoDaddy Managed WordPress nginx will 404 anything under /tools/spicet/*
// before PHP runs. That base is opt-in: every other target (PR previews, local
// preview, static hosts) serves from the root and would 404 on a hardcoded
// plugin path, so build with WP_DEPLOY=1 only for the WordPress deploy.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: process.env.WP_DEPLOY ? '/wp-content/plugins/myhc-tools/tools/spicet/' : '/',
})
