const { CompositeDisposable, Disposable } = require("atom");

module.exports = {
  activate() {
    this.naviService = null;
    // Layers handed over by the marker hosts, keyed by editor. Every renderer
    // builds its own layer from the descriptor, so an editor holds a set of
    // them and a push has to reach all of them.
    this.layers = new Map();
    this.disposables = new CompositeDisposable(
      // Subscribed once for the package rather than once per layer: the depth
      // limit is the same answer for every editor and every renderer.
      atom.config.observe("marker-navigation.maxDepth", (value) => {
        this.maxDepth = value;
        for (const layers of this.layers.values()) {
          for (const layer of layers) {
            layer.update();
          }
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
      for (const [editor, layers] of this.layers) {
        if (naviEditor.buffer !== editor.buffer) continue;
        // Read once per editor; the layers only ever read the array back.
        const headers = this.getHeaders(editor);
        for (const layer of layers) {
          layer.cache.set("data", headers);
          layer.update();
        }
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
        let layers = this.layers.get(layer.editor);
        if (!layers) {
          layers = new Set();
          this.layers.set(layer.editor, layers);
        }
        layers.add(layer);
        // A renderer can attach long after the panel last published, so seed
        // the layer instead of leaving it blank until the next update.
        layer.cache.set("data", this.getHeaders(layer.editor));
        layer.disposables.add(
          new Disposable(() => {
            layers.delete(layer);
            if (layers.size === 0) {
              this.layers.delete(layer.editor);
            }
          }),
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
