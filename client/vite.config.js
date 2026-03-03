/* eslint-env node */
import { defineConfig, loadEnv } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

export default defineConfig(({ mode }) => {
    // Load env file based on mode
    const env = loadEnv(mode, process.cwd(), "")

    return {
        plugins: [react(), tailwindcss()],
        server: {
            port: 5173,
            proxy: {
                "/api": {
                    target: env.VITE_BACKEND_URL || "http://localhost:5000",
                    changeOrigin: true,
                    secure: false,
                },
                "/socket.io": {
                    target: env.VITE_BACKEND_URL || "http://localhost:5000",
                    changeOrigin: true,
                    secure: false,
                    ws: true,
                },
            },
        },
        define: {
            // Ensure environment variables are properly exposed
            "import.meta.env.VITE_BACKEND_URL": JSON.stringify(env.VITE_BACKEND_URL),
            "import.meta.env.VITE_API_URL": JSON.stringify(env.VITE_API_URL),
            "import.meta.env.VITE_SOCKET_URL": JSON.stringify(env.VITE_SOCKET_URL),
        },
    }
})
