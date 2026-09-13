import { useEffect, useRef } from "react";
import grapesjs from "grapesjs";
import gjsPresetWebpage from "grapesjs-preset-webpage";
import "grapesjs/dist/css/grapes.min.css";

/**
 * Herbruikbare WYSIWYG-editor, gebruikt voor zowel thema-templates als paginacontent.
 * `initialHtml`/`initialCss` vullen de editor bij het laden.
 * `onSave({ html, css })` wordt aangeroepen als de gebruiker op "Opslaan" klikt —
 * de aanroepende pagina bepaalt zelf waar dat naartoe wordt opgeslagen (template of pagina).
 */
export default function GrapesEditor({ initialHtml, initialCss, onSave, saving }) {
  const containerRef = useRef(null);
  const editorRef = useRef(null);

  useEffect(() => {
    const editor = grapesjs.init({
      container: containerRef.current,
      height: "70vh",
      width: "auto",
      fromElement: false,
      storageManager: false, // wij beheren opslaan zelf, via onze eigen API
      plugins: [gjsPresetWebpage],
    });

    editor.setComponents(initialHtml || "<h1>Nieuwe content</h1>");
    editor.setStyle(initialCss || "");
    editorRef.current = editor;

    return () => editor.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSave() {
    if (!editorRef.current) return;
    const html = editorRef.current.getHtml();
    const css = editorRef.current.getCss();
    onSave({ html, css });
  }

  return (
    <div>
      <div style={{ marginBottom: "0.75rem", display: "flex", justifyContent: "flex-end" }}>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? "Opslaan..." : "Opslaan"}
        </button>
      </div>
      <div ref={containerRef} />
    </div>
  );
}
