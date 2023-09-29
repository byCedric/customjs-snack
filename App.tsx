import { StatusBar } from 'expo-status-bar';
import { Button, Platform, StyleSheet, Text, View } from 'react-native';

import { System } from './src/customjs';
import { ReactElement, createElement, useState } from 'react';

// Pipe core libraries through SystemJS
System.set('react', require('react'));
System.set('react/jsx-runtime', require('react/jsx-runtime'));
System.set('react-native', Platform.select({
  default: require('react-native'),
  web: require('react-native-web'),
}))

async function setFiles() {
  System.addFiles({
    './index.js': `export { App } from './app.js';`,
    './app.js': `
      import { Text } from 'react-native';

      export function App() {
        return <Text>hello world</Text>;
      }
    `,

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

    const result = await System.import('./index.js');
    if (result) {
      console.log('RESULT', result);
      setSnack(createElement(result.App || result));
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
