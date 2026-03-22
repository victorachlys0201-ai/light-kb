/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  // ✅ 确保这里添加了这行
  plugins: [
    require('@tailwindcss/typography'),
  ],
}