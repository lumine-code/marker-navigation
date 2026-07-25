const { CompositeDisposable, Emitter } = require("atom");

describe("scrollmap-navigation", () => {
  let workspaceElement, editor, mainModule;

  beforeEach(async () => {
    workspaceElement = atom.views.getView(atom.workspace);
    jasmine.attachToDOM(workspaceElement);
    editor = await atom.workspace.open();
    editor.setText(Array(30).fill("lorem ipsum").join("\n"));
    const pack = await atom.packages.activatePackage("scrollmap-navigation");
    mainModule = pack.mainModule;
  });

  function createNaviService(targetEditor, headers) {
    const emitter = new Emitter();
    return {
      emitter,
      getEditor: () => targetEditor,
      getFlattenHeaders: () => headers,
      onDidUpdateHeaders: (callback) => {
        return emitter.on("did-update-headers", ({ editor, headers }) => callback(editor, headers));
      },
    };
  }

  function createLayer(layerEditor) {
    const layer = {
      editor: layerEditor,
      cache: new Map(),
      disposables: new CompositeDisposable(),
      update: jasmine.createSpy("update"),
    };
    // Register through the provider contract, exactly like the scrollmap hub.
    mainModule.provideScrollmap().initialize(layer);
    return layer;
  }

  describe("activation", () => {
    it("activates and observes its configuration", () => {
      expect(atom.packages.isPackageActive("scrollmap-navigation")).toBe(true);
      expect(mainModule.maxDepth).toBe(0);

      atom.config.set("scrollmap-navigation.maxDepth", 3);
      expect(mainModule.maxDepth).toBe(3);
    });
  });

  describe("scrollmap service provider", () => {
    let provider;

    beforeEach(() => {
      provider = mainModule.provideScrollmap();
    });

    it("describes the navigation layer", () => {
      expect(provider.name).toBe("navigation");
      expect(provider.threshold).toBe("scrollmap-navigation.threshold");
      expect(typeof provider.initialize).toBe("function");
      expect(typeof provider.getItems).toBe("function");
    });

    it("re-runs the layer when the max depth changes", () => {
      const layer = createLayer(editor);
      provider.initialize(layer);

      atom.config.set("scrollmap-navigation.maxDepth", 4);
      expect(layer.update).toHaveBeenCalled();
      layer.disposables.dispose();
    });

    it("maps cached headers to marker items with level classes", () => {
      const layer = createLayer(editor);
      layer.cache.set("data", [
        { revel: 1, startPoint: { row: 2, column: 0 } },
        { revel: 3, startPoint: { row: 10, column: 0 } },
      ]);

      const items = provider.getItems(layer);
      expect(items).toEqual([
        { row: 2, cls: "navigation-marker navigation-marker-1" },
        { row: 10, cls: "navigation-marker navigation-marker-3" },
      ]);
    });

    it("skips headers without a start point", () => {
      const layer = createLayer(editor);
      layer.cache.set("data", [{ revel: 1 }, { revel: 2, startPoint: { row: 5, column: 0 } }]);

      const items = provider.getItems(layer);
      expect(items.length).toBe(1);
      expect(items[0].row).toBe(5);
    });

    it("filters headers deeper than maxDepth", () => {
      atom.config.set("scrollmap-navigation.maxDepth", 2);
      const layer = createLayer(editor);
      layer.cache.set("data", [
        { revel: 1, startPoint: { row: 1, column: 0 } },
        { revel: 2, startPoint: { row: 2, column: 0 } },
        { revel: 3, startPoint: { row: 3, column: 0 } },
      ]);

      const items = provider.getItems(layer);
      expect(items.map((item) => item.row)).toEqual([1, 2]);
    });

    it("returns no items without cached data", () => {
      const layer = createLayer(editor);
      expect(provider.getItems(layer)).toEqual([]);
    });
  });

  describe("navigation-panel service consumer", () => {
    it("returns headers only for the buffer tracked by the navigation panel", () => {
      const headers = [{ revel: 1, startPoint: { row: 0, column: 0 } }];
      const service = createNaviService(editor, headers);
      const disposable = mainModule.consumeNaviService(service);

      expect(mainModule.getHeaders(editor)).toEqual(headers);

      const otherEditor = atom.workspace.buildTextEditor();
      expect(mainModule.getHeaders(otherEditor)).toEqual([]);

      disposable.dispose();
      otherEditor.destroy();
    });

    it("returns no headers when no service is consumed", () => {
      expect(mainModule.getHeaders(editor)).toEqual([]);
    });

    it("pushes fresh headers into the navigation layer on header updates", () => {
      const headers = [{ revel: 2, startPoint: { row: 4, column: 0 } }];
      const service = createNaviService(editor, headers);
      const disposable = mainModule.consumeNaviService(service);

      const layer = createLayer(editor);

      service.emitter.emit("did-update-headers", { editor, headers });

      expect(layer.cache.get("data")).toEqual(headers);
      expect(layer.update).toHaveBeenCalled();

      layer.disposables.dispose();
      disposable.dispose();
    });

    it("detaches the service on disposal", () => {
      const service = createNaviService(editor, []);
      const disposable = mainModule.consumeNaviService(service);
      expect(mainModule.naviService).toBe(service);

      disposable.dispose();
      expect(mainModule.naviService).toBe(null);
      expect(mainModule.getHeaders(editor)).toEqual([]);
    });
  });
});
