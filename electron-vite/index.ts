import {Plugin, ViteDevServer, build} from 'vite';
import {AddressInfo} from 'net';
import electron from 'electron';
import {spawn} from 'child_process';
import {resolve} from 'path';
import bytenode from 'bytenode'
import * as fs from "fs";
import {builtinModules} from 'module';

async function buildElectron(isDev = true) {
    await build({
        root: resolve(process.cwd(), 'dist'), // 指向主进程目录
        build: {
            minify: !isDev,
            outDir: resolve(process.cwd(), 'dist', 'electron'),
            lib: {
                entry: [
                    resolve(process.cwd(), 'electron', 'main.ts'),
                    resolve(process.cwd(), 'electron', 'preload.ts'),
                ],
                formats: ['cjs'],
                fileName: () => '[name].cjs',
            },
            rollupOptions: {
                external: [
                    // 告诉 Rollup 不要打包内建 API
                    'electron',
                    'bytenode',
                    /^node:/,
                    ...builtinModules
                ],
            },
        },
    });
    // 用bytenode加密electron代码
    if (!isDev) {
        await bytenode.compileFile({
            electron: true,
            filename: resolve(process.cwd(), 'dist', 'electron', 'main.cjs'),
        })
        fs.writeFileSync(resolve(process.cwd(), 'dist', 'electron', 'main.cjs'), "require('bytenode');module.exports = require('./main.jsc')")

        await bytenode.compileFile({
            electron: true,
            filename: resolve(process.cwd(), 'dist', 'electron', 'preload.cjs'),
        })
        fs.writeFileSync(resolve(process.cwd(), 'dist', 'electron', 'preload.cjs'), "require('bytenode');module.exports = require('./preload.jsc')")

    }
}

export default ({mode = 'development'}: { mode: string }): Plugin => {
    return {
        name: 'vite-plugin-electron',
        async buildStart() {
            if (mode === 'development') {
                await buildElectron(mode === 'development');
            }
        },
        async configureServer(server: ViteDevServer) {
            server.watcher.unwatch('plugin/main.ts');
            server.httpServer?.once('listening', () => {
                const addressInfo = server.httpServer?.address() as AddressInfo;
                const address = `http://localhost:${addressInfo.port}`;
                const electronProcess = spawn(
                    electron.toString(),
                    ['./dist/electron/main.cjs', address],
                    {
                        cwd: process.cwd(),
                        stdio: 'inherit',
                    },
                );
                electronProcess.on('exit', () => {
                    electronProcess.kill();
                    server.close();
                    process.exit();
                });
                electronProcess.on('close', () => {
                    electronProcess.kill();
                    server.close();
                    process.exit();
                });
            });
        },
        async closeBundle() {
            await buildElectron(mode === 'development');
            // 打包
            spawn('electron-builder', {
                stdio: 'inherit',
                shell: true,
            });
        },
    };
};
