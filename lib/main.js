const { CompositeDisposable, Disposable } = require("atom");

module.exports = {
  activate() {
    this.disposables = new CompositeDisposable(
      atom.config.observe("scrollmap-navigation.maxDepth", (value) => {
        this.maxDepth = value;
      }),
    );
    this.naviService = null;
    // Layers handed over by the scrollmap hub, keyed by editor.
    this.layers = new Map();
  },

  deactivate() {
    this.naviService = null;
    this.layers.clear();
    this.disposables.dispose();
  },

  getHeaders(editor) {
    if (!this.naviService) {
      return [];
    }
    const naviEditor = this.naviService.getEditor();
    if (!naviEditor || naviEditor.buffer !== editor.buffer) {
      return [];
    }
    return this.naviService.getFlattenHeaders?.() || [];
  },

  consumeNavigationHeaders(naviService) {
    this.naviService = naviService;
    let subscription = naviService.onDidUpdateHeaders?.((naviEditor) => {
      if (!naviEditor) return;
      for (const [editor, layer] of this.layers) {
        if (naviEditor.buffer !== editor.buffer) continue;
        layer.cache.set("data", this.getHeaders(editor));
        layer.update();
      }
    });
    return new Disposable(() => {
      this.naviService = null;
      subscription?.dispose();
    });
  },

  provideScrollmapLayer() {
    return {
      name: "navigation",
      description: "Navigation-panel header markers",
      threshold: "scrollmap-navigation.threshold",
      initialize: (layer) => {
        this.layers.set(layer.editor, layer);
        layer.disposables.add(
          new Disposable(() => this.layers.delete(layer.editor)),
          atom.config.onDidChange("scrollmap-navigation.maxDepth", layer.update),
        );
      },
      getItems: ({ editor, cache }) => {
        const items = [];
        for (const header of cache.get("data") || []) {
          if (this.maxDepth && header.revel > this.maxDepth) {
            continue;
          }
          if (!header.startPoint) {
            continue;
          }
          items.push({
            row: editor.screenPositionForBufferPosition(header.startPoint).row,
            cls: `navigation-marker navigation-marker-${header.revel}`,
          });
        }
        return items;
      },
    };
  },
};
