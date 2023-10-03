import { StatusBar } from 'expo-status-bar';
import { Button, Platform, StyleSheet, Text, View } from 'react-native';

import { System } from './src/customjs';
import { ReactElement, createElement, useState } from 'react';

// Pipe core libraries through SystemJS
System.set('react', require('react')); // Required because we are rendering in the App's React instance (can't have multiple React instances)
// System.set('react/jsx-runtime', require('react/jsx-runtime'));
// System.set("react-dom/client", require("react-dom/client"));

if (Platform.OS === 'ios') {
  System.set('react-native', require('react-native'));
}

// System.set('react-native', Platform.select({
//   // default: require('react-native'),
//   web: require('react-native-web'),
// }))

async function setFiles() {
  System.addFiles({
    './web-app/component.tsx': `
      import { Text } from 'react-native';
      // import Debug from 'debug';

      // Debug.enable('*');

      // const debug = Debug.debug('web-app');

      export function App() {
        // debug('Rendering...');
        return <Text>Jey</Text>;
      }
    `,
    './web-app.tsx': `
      export { App as default } from './web-app/component.tsx';
    `,

    './common-test.js': `
      module.exports = require('./empty-export.js');
    `,

    // './index.js': `export { App } from './app.js';`,
    // './app.js': `
    //   import { Text } from 'react-native';

    //   export function App() {
    //     return <Text>hello world</Text>;
    //   }
    // `,

    // './world.js': `console.log('world!');`,
    // './hello.js': `
    //   console.log('hello!');
    //   require('./world.js');
    // `,
  });
}

export default function App() {
  const [snack, setSnack] = useState<ReactElement | undefined>(undefined);

  async function onLoadSnack() {
    setFiles();

    // return console.log('Loaded', await System.import('./common-test.js'))

    console.time('Loaded app');
    const result = await System.import('./web-app.tsx');
    console.timeEnd('Loaded app');
    if (result) {
      console.log('RESULT', result);
      let App = result;
      // TODO: replace with babel interop default require
      while (typeof App.default !== 'undefined') {
        App = App.default;
      }
      console.log('App:', App);
      setSnack(createElement(App));
    }
  }

  return (
    <View style={styles.container}>
      {snack ? snack : (
        <Button onPress={onLoadSnack} title="Run System" />
      )}
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
