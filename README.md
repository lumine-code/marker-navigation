# scrollmap-navigation

Show navigation headers on the scrollbar.

A layer package for [scrollmap](https://github.com/lumine-code/scrollmap) that renders the document outline gathered by [navigation-panel](https://github.com/lumine-code/navigation-panel).

## Features

- **Header markers**: shows navigation-panel section headers as scrollbar markers.
- **Level colors**: markers are colored by header level via the navigation-panel marker palette.
- **Depth limit**: optionally hide headers deeper than a configured level.
- **Threshold**: optionally hide all markers when the header count gets too large.

## Installation

To install `scrollmap-navigation` search for _scrollmap-navigation_ in the Install pane of the Lumine settings or run `lumine --install lumine-code/scrollmap-navigation`.

## Customization

Markers follow the `--navigation-marker-*-color` properties defined by navigation-panel, so overriding those recolors the editor lines and the scrollbar together. The style can also be adjusted in the `styles.less` file, e.g. recolor scrollbar markers of a given header level:

```less
.scrollmap .marker.marker-navigation {
  &.navigation-marker-1 {
    background: var(--text-color-info);
  }
}
```

## Services

- **[navigation.headers](https://lumine-code.github.io/docs.html#services/navigation.headers)** (`^1.0.0`): consumed to read the flattened header outline of the active editor and follow its updates.
- **[scrollmap.layer](https://lumine-code.github.io/docs.html#services/scrollmap.layer)** (`1.0.0`): provided to register the `navigation` marker layer rendered on the editor scrollbar.

## Contributing

Got ideas to make this package better, found a bug, or want to help add new features? Just drop your thoughts on GitHub. Any feedback is welcome!
