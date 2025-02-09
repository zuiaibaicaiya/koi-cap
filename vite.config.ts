import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'
import electronVite from "./electron-vite";
import {fileURLToPath, URL} from "node:url";
import renderer from 'vite-plugin-electron-renderer'
// @ts-ignore
import optimizer from 'vite-plugin-optimizer'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
// https://vite.dev/config/
export default defineConfig(async ({mode}) => {
    return {
        base: './',
        plugins: [
            vue(),
            AutoImport({
                resolvers: [ElementPlusResolver()],
            }),
            Components({
                resolvers: [ElementPlusResolver()],
            }),
            electronVite({mode}),
            // optimizer要放在renderer前面
            optimizer({
                electron: `
                    const { ipcRenderer,webUtils } = require('electron');
                    export { ipcRenderer,webUtils  };
                `,
                fs: () => ({
                    find: /^(node:)?fs$/,
                    code: `const fs = require('fs'); export { fs as default };`
                }),
            }),
            renderer(),
        ],
        resolve: {
            alias: {
                '@': fileURLToPath(new URL('./src', import.meta.url))
            }
        }
    }
})
