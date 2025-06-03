# Project Refactoring Guide

This project has been refactored from pnpm to use Yarn 4.x + PnP (Plug'n'Play) mode for dependency management, and uses volta for Node.js version management.

## Environment Requirements

### Install Volta and Corepack

```bash
# Install volta
curl https://get.volta.sh | bash

# Restart terminal or execute
source ~/.bashrc  # or ~/.zshrc

# Enable Corepack (built-in with Node.js 16+)
corepack enable
```

### Initialize Environment

```bash
# Install specified versions of Node.js and Yarn
yarn run initenv

# Or install manually
volta install node@18.17.0
volta install yarn@4.2.2
corepack enable
```

## Project Structure Changes

### Deleted Files

- `pnpm-workspace.yaml` - Replaced with workspaces configuration in package.json
- `pnpm-lock.yaml` - Replaced with yarn.lock (Yarn 4.x format)
- `.nvmrc` - Replaced with volta configuration in package.json
- `node_modules/` - Replaced by PnP's `.pnp.cjs` file

### Modified Files

- `package.json` - Added volta configuration, workspaces configuration and PnP configuration
- `.yarnrc.yml` - Added Yarn 4.x and PnP related configurations
- `.gitignore` - Updated PnP related ignore rules
- All script commands changed from `pnpm` to `yarn workspace`

## Common Commands

```bash
# Install dependencies
yarn install

# Development mode
yarn client:dev    # Start client
yarn server:dev    # Start server
yarn ext:dev       # Start browser extension

# Build
yarn client:build  # Build client
yarn server:build  # Build server
yarn ext:build     # Build browser extension

# Clean node_modules
yarn clean

# Code formatting
yarn format
```

## Yarn PnP Advantages

1. **Lightning-fast installation**: No need to copy files to node_modules, only generates a single `.pnp.cjs` file
2. **Perfect deduplication**: All projects share the same dependency cache, saving disk space
3. **Strict dependencies**: Prevents phantom dependencies, ensures only declared dependencies can be accessed
4. **Semantic errors**: Provides clearer dependency resolution error messages
5. **Zero installs**: Can commit `.pnp.cjs` to repository for zero-install deployment

## Volta Advantages

1. **Automatic version switching**: Automatically switches to specified Node.js and Yarn versions when entering project directory
2. **Team consistency**: Ensures all team members use the same tool versions
3. **Simplified configuration**: No need to manually manage multiple Node.js versions
4. **Cross-platform support**: Supports macOS, Linux and Windows

## PnP Considerations

### IDE Support

Most modern IDEs support Yarn PnP, but may require additional configuration:

- **VS Code**: Install "ZipFS" extension to support packages in zip files
- **WebStorm**: Built-in PnP support
- **Other editors**: May need to install corresponding PnP plugins

### Compatibility

- Most modern npm packages are compatible with PnP
- If compatibility issues arise, configure `packageExtensions` in `.yarnrc.yml`
- React Native projects do not currently support PnP, need to use traditional node_modules mode

## Migration Complete

The project has been successfully migrated from pnpm to Yarn 4.x PnP + volta management. All dependencies have been reinstalled, workspace configuration has been updated, and PnP mode has been enabled.
