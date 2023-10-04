import { StatusBar } from 'expo-status-bar';
import { Button, Platform, StyleSheet, View } from 'react-native';

import { System } from './src/customjs';
import { ReactElement, useState } from 'react';

// Adding this to avoid having to fetch from Metro or anything else
// Just reuse the exact same instance from the app's bundle
System.alias('react', require('react'));
System.alias('react/jsx-runtime', require('react/jsx-runtime'));
System.alias('react-native', Platform.select({
  default: require('react-native'),
  web: require('react-native-web'),
}));

async function setFiles() {
  System.addFiles({
    './index.js': `export * from './app.js';
export { default } from './app.js';
`,
    './app.js': `import { Text, View, StyleSheet } from 'react-native';

// Test top-level await, this forces "execute" to be an async function
await Promise.resolve();

function App() {
  return (
    <View>
      <Text style={styles.paragraph}>
        Hello from <Text style={{ color: 'red' }}>ESM</Text>
      </Text>
    </View>
  );
}

export default App;
export const styles = StyleSheet.create({
  paragraph: {
    fontSize: 18,
  },
});

export const otherValue = 'alsotest';
`,

    // './other.js': `
    //   System.register('./other.js', [], function (_export, _context) {
    //     return {
    //       setters: [],
    //       execute() {
    //         console.log('Other is being executed');
    //         _export('value', 'Hello World');
    //       }
    //     }
    //   });
    // `,

    // './index.js': `
    //   System.register('./index.js', [], function (_export, _context) {
    //     return {
    //       setters: [],
    //       execute() {
    //         console.log('Index is being executed');

    //         console.log('REQUIRE', typeof require);

    //         _export('default', () => {
    //           return System.import('./other.js')
    //             .then((other) => other.value);
    //         });
    //         _export('otherValue', 'alsotest');
    //       }
    //     }
    //   });
    // `,

    './without-transpile.js': `
      System.register('./index.js', [], function (_export, _context) {
        return {
          setters: [],
          execute() {
            async function test() {
              return 'Hello world';
            }

            const otherValue = 'alsotest';

            _export('default', test);
            _export('otherValue', otherValue);
          }
        }
      });
    `,
  });
}

export default function App() {
  const [snack, setSnack] = useState<ReactElement | undefined>(undefined);

  async function onLoadSnack() {
    setFiles();

    console.time('Loaded app');
    const result = await System.import('./index.js');
    console.timeEnd('Loaded app');

    if (result) {
      console.log(result);
      setSnack(result.default);
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
