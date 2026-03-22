/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // 重点：这一行没写，点击按钮页面就不会变！
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}