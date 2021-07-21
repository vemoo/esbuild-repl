import { basicSetup, EditorState, EditorView } from "@codemirror/basic-setup";
import { javascript } from "@codemirror/lang-javascript";

navigator.serviceWorker
  .register("./sw.js")
  .then(r => console.log("registered service worker with scope:", r.scope))
  .catch(err => console.log("failed to register service worker", err));

let editor = new EditorView({
  state: EditorState.create({
    extensions: [basicSetup, javascript()],
  }),
  parent: document.querySelector("#app")!,
});
