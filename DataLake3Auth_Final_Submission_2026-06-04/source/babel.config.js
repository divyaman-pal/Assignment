module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./'],
        alias: {
          '@': './src',
          '@screens': './src/screens',
          '@components': './src/components',
          '@services': './src/services',
          '@utils': './src/utils',
          '@hooks': './src/hooks',
          '@types': './src/types',
          '@constants': './src/constants',
        },
      },
    ],
  ],
};
