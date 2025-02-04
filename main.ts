import type { TransformOptions } from "esbuild";

type esbuild_t = typeof import("esbuild");

const $ = (sel: string) => document.querySelector(sel)!;

function leave(el: Element, ms = 200) {
    el.classList.add("leave", "leave-active");
    requestAnimationFrame(() => {
        el.classList.remove("leave");
        el.classList.add("leave-to");
    });
    setTimeout(() => el.remove(), ms);
}

const JsDelivrAPI = "https://data.jsdelivr.com/v1/package/npm/esbuild-wasm";
const urlPrefix = "https://cdn.jsdelivr.net/npm/esbuild-wasm";
const urls = {
    // prettier-ignore
    browser: (version: string) => `${urlPrefix}@${version}/esm/browser.js`,
    wasm: (version: string) => `${urlPrefix}@${version}/esbuild.wasm`,
};

let esbuild: esbuild_t | undefined;
const utils = {
    async fetchVersion() {
        const r = await fetch(JsDelivrAPI).then((r) => r.json());
        const version = r.tags.latest;
        localStorage.setItem("esbuild-repl", `${version}:${Date.now()}`);
        return version;
    },
    async version() {
        const raw = localStorage.getItem("esbuild-repl");
        if (raw) {
            const [version, time] = raw.split(":", 2);
            if (Date.now() - +time < 86400 * 7 * 1000) {
                return version;
            }
        }
        return this.fetchVersion();
    },
    async esbuild(version: string) {
        esbuild = (await import(/* @vite-ignore */ urls.browser(version))) as esbuild_t;
        await esbuild.initialize({ wasmURL: urls.wasm(version) });
    },
    dashize(str: string) {
        return str.replace(/([A-Z])/g, (x) => "-" + x.toLowerCase());
    },
    camelize(str: string) {
        return str.replace(/-([a-z])/g, (x) => x.substring(1).toUpperCase());
    },
    cfg2cli(config: Record<string, any>) {
        const options: string[] = [];
        for (const key in config) {
            const value = config[key as keyof TransformOptions];
            if (Array.isArray(value)) {
                for (const e of value) {
                    options.push(`--${this.dashize(key)}:${e}`);
                }
            } else if (value instanceof Object) {
                for (const [k, v] of Object.entries(value)) {
                    options.push(`--${this.dashize(key)}:${k}=${v}`);
                }
            } else if (value === true) {
                options.push(`--${this.dashize(key)}`);
            } else {
                options.push(`--${this.dashize(key)}=${value}`);
            }
        }
        return options.join(" ");
    },
    cli2cfg(line: string) {
        const config: Record<string, any> = {};
        for (const piece of line.split(/\s+/)) {
            if (!piece.startsWith("--")) continue;
            const a = piece.substring(2);
            const colon = a.indexOf(":");
            const equal = a.indexOf("=");
            if (colon === -1 && equal === -1) {
                config[this.camelize(a)] = true;
            } else {
                if (colon !== -1 && colon < equal) {
                    const key = a.substring(0, colon);
                    const [k, v] = a.substring(colon + 1).split("=", 2);
                    config[this.camelize(key)] ||= {};
                    config[this.camelize(key)][k] = v;
                } else if (colon !== -1 && equal === -1) {
                    const [key, value] = a.split(":", 2);
                    config[this.camelize(key)] ||= [];
                    config[this.camelize(key)].push(value);
                } else {
                    const [key, value] = a.split("=", 2);
                    const val = { true: true, false: false }[value] || value;
                    config[this.camelize(key)] = val;
                }
            }
        }
        return config;
    },
    loadQuery() {
        const query = new URLSearchParams(location.search.slice(1));
        const version = query.get("version");
        const shareableString = query.get("shareable");
        let shareable: { code: string; config: Record<string, any> } | null = null;
        if (shareableString) {
            try {
                shareable = JSON.parse(decodeURIComponent(atob(shareableString)));
            } catch {}
        }
        return { version, shareable };
    },
    updateQuery(version: string, shareable: object) {
        const query = new URLSearchParams();
        query.set("version", version);
        query.set("shareable", btoa(encodeURIComponent(JSON.stringify(shareable))));
        const url = location.origin + location.pathname + "?" + query.toString();
        history.pushState({ path: url }, "", url);
    },
    showError(message: string) {
        const el = $("#error") as HTMLElement;
        el.style.display = "";
        el.textContent = message;
    },
    hideError() {
        const el = $("#error") as HTMLElement;
        el.style.display = "none";
    },
};

(async function () {
    const query = utils.loadQuery();
    console.log(query);

    $("#theme").addEventListener("click", () => {
        document.body.classList.toggle("light");
    });
    const version = query.version || (await utils.version());
    $("#version").textContent = version;
    await utils.esbuild(version);
    leave($("#mask"));

    (window as any).esbuild = esbuild;

    if (query.shareable?.config != null) {
        ($("#config") as HTMLInputElement).value = utils.cfg2cli(query.shareable?.config);
    }

    if (query.shareable?.code != null) {
        ($("#editor") as HTMLTextAreaElement).value = query.shareable?.code;
        ($("#output") as HTMLTextAreaElement).value = "";
    }

    let config = utils.cli2cfg(($("#config") as HTMLInputElement).value);
    let code = ($("#editor") as HTMLTextAreaElement).value;

    $("#config").addEventListener("change", (e) => {
        const el = e.target as HTMLInputElement;
        config = utils.cli2cfg(el.value);
        el.value = utils.cfg2cli(config);
        refresh();
    });

    $("#editor").addEventListener("keydown", (e) => {
        if ((e as KeyboardEvent).key === "Tab") {
            e.preventDefault();
            const textarea = e.target as HTMLTextAreaElement;
            const code = textarea.value;
            const before = code.substring(0, textarea.selectionStart);
            const endPos = textarea.selectionEnd;
            const after = code.substring(endPos);
            textarea.value = before + "    " + after;
            textarea.selectionStart = textarea.selectionEnd = endPos + 4;
        }
    });

    async function refresh(first = false) {
        code = ($("#editor") as HTMLTextAreaElement).value;
        try {
            const t = performance.now();
            const result = await esbuild?.transform(code, config);
            const duration = performance.now() - t;
            if (result) {
                ($("#output") as HTMLTextAreaElement).value = result.code;
                utils.hideError();
                if (!first) $("#duration").textContent = duration.toFixed(2) + "ms";
            }
        } catch (e) {
            utils.showError(e.message);
        }
        try {
            utils.updateQuery(version, { code, config });
        } catch {}
    }

    $("#editor").addEventListener("input", () => refresh(false));

    refresh(true);
})().catch((reason) => {
    console.error(reason);
    $("#mask").textContent = reason?.message || reason;
});

if (import.meta.env.PROD)
    navigator.serviceWorker
        .register("./sw.js")
        .then((e) => console.log("registered sw.js in scope:", e.scope))
        .catch((e) => console.log("failed to register sw.js:", e));
