# @bonadocs/cli

Bonadocs CLI lets you generate widgets for your solidity docs and interact with the
protocol registry. For a GUI interface, check out our editor at [bonadocs.com](https://bonadocs.com).

## Installation

```bash
npm i @bonadocs/docgen
```

## Quick Usage Guide

```bash
bonadocs --help
```

### Generate a widget

```bash
bonadocs collections <collection> widget

# Example
bonadocs collections uniswap widget
```


### Find a protocol on the registry

```bash
bonadocs registry search -q <protocol>
```

### Open a protocol from the registry on your local device

```bash
bonadocs registry open -s <protocol>
```

Full documentation can be found at [bonadocs.com/docs](https://bonadocs.com/docs).
