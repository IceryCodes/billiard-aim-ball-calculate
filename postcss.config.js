module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
    'postcss-nesting': {},
    'postcss-preset-env': {
      features: { 'nesting-rules': false },
    },
  },
};
