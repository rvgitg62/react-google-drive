import typescript from "rollup-plugin-typescript2";
import external from "rollup-plugin-peer-deps-external";
import postcss from "rollup-plugin-postcss";
import { terser } from "rollup-plugin-terser";

export default {
    input: "src/index.tsx",
    output: [
        {
            file: "dist/index.js",
            format: "cjs",
            sourcemap: true
        },
        {
            file: "dist/index.esm.js",
            format: "esm",
            sourcemap: true
        }
    ],
    plugins: [
        external(),
        postcss(),
        typescript({ useTsconfigDeclarationDir: true }),
        terser()
    ],
    external: ["react", "react-dom"]
};
