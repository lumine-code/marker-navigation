# marker-navigation

Show navigation headers on the scrollbar and minimap.

A layer package for [scrollmap](https://github.com/lumine-code/scrollmap) and [minimap](https://github.com/lumine-code/minimap) that renders the document outline gathered by [navigation-panel](https://github.com/lumine-code/navigation-panel).

## Features

- **Header markers**: shows navigation-panel section headers as markers on every installed map.
- **Level colors**: markers are colored by header level via the navigation-panel marker palette.
- **Depth limit**: optionally hide headers deeper than a configured level.
- **Threshold**: optionally hide all markers when the header count gets too large.

## Installation

To install `marker-navigation` search for it in the Install pane of the Lumine settings, or run the command `lumine --install lumine-code/marker-navigation`.

## Customization

Markers follow the `--navigation-marker-*-color` properties defined by navigation-panel, so overriding those recolors the editor lines and the markers together. The style can also be adjusted in the `styles.css` file, e.g. recolor the markers of a given header level:

```css
.marker.marker-navigation.navigation-marker-1 {
  background: var(--text-color-info);
}
```

## Services

- `navigation.headers`: consumed to read the flattened header outline of the active editor and follow its updates.
- `marker.layer`: provided to register the `navigation` marker layer that each map draws.

## Contributing

Got ideas to make this package better, found a bug, or want to help add new features? Just drop your thoughts on GitHub. Any feedback is welcome!
