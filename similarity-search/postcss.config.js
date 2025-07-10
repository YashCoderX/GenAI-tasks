module.exports = {
  plugins: [
    require('postcss-preset-env')({
      features: {
        'user-select-none': false
      }
    })
  ]
}; 