const { CompositeDisposable, Disposable } = require("lumine");

module.exports = {
  activate() {
    this.naviService = null;
    // Layers handed over by the marker hub, keyed by editor. The hub builds
    // exactly one layer per editor, however many overview maps draw it.
    this.layers = new Map();
    this.disposables = new CompositeDisposable(
      // Subscribed once for the package rather than once per editor: the depth
      // limit is the same answer everywhere.
      lumine.config.observe("marker-navigation.maxDepth", (value) => {
        this.maxDepth = value;
        for (const layer of this.layers.values()) {
          layer.update();
        }
      }),
    );
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
    const subscription = naviService.onDidUpdateHeaders?.((naviEditor) => {
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

  provideMarkerLayer() {
    return {
      name: "navigation",
      description: "Navigation-panel header markers",
      threshold: "marker-navigation.threshold",
      initialize: (layer) => {
        this.layers.set(layer.editor, layer);
        // A layer can attach long after the panel last published, so seed
        // it instead of leaving it blank until the next update.
        layer.cache.set("data", this.getHeaders(layer.editor));
        layer.disposables.add(new Disposable(() => this.layers.delete(layer.editor)));
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
