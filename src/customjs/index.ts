// Initialize the core system
// This adds all hooks of the `resolve`, `fetch`, `transpile`, and `evaluate` pipeline.
// It does not implement any of the hooks, but does configure the order of hooks in `instantiate`.
import './core/setup-resolve';
import './core/setup-fetch';
import './core/setup-evaluate';
import './core/setup-instantiate';

export * from './core/system';

// Initialize extras
import 'systemjs/src/extras/named-register';

// Initialize the React Native specific features
import './features/registry';
import './features/globals';
import './features/rn-evaluate';
import './features/snack-files';
import './features/metro-resolve';
// import './features/bun-resolve'; // DO NOT USE THIS, ITS NOT GOOD
import './features/commonjs';

