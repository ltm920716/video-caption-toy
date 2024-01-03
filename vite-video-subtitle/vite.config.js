import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: '0.0.0.0', 
    port: 8082, 
  },
  plugins: [react()],
  build: {
    lib: {
      entry: resolve(__dirname, "packages/index.jsx"), // 打包的入口文件
      name: "VideoSubtitleAnnotate", // 包名 // formats: ['es', 'umd'], // 打包模式，默认是es和umd都打
      // fileName: (format) => `video-subtitle-annotate.${format}.js`,
      fileName: "video-subtitle-annotate",
    },
    rollupOptions: {
      // 确保外部化处理那些你不想打包进库的依赖
      external: ["react", 'react-dom'],
      output: {
        // 在 UMD 构建模式下为这些外部化的依赖提供一个全局变量
        globals: {
          react: "React",
          'react-dom': 'react-dom',
        },
      },
    },
    outDir: "lib", // 打包后存放的目录文件
    cssTarget: 'chrome61'
  },
});
