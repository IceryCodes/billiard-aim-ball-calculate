module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
    'postcss-nesting': {},
    'postcss-preset-env': {
      stage: 1,
      features: {
        'nesting-rules': false,
        'custom-properties': false,
      },
    },
  },
};
