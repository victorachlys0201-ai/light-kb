/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  // 这里的配置决定了 prose 类名是否有用
  plugins: [
    require('@tailwindcss/typography'),
  ],
}