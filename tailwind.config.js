module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./src/components/ui/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
      extend: {
        animation: {
          fadeIn: "fadeIn 0.3s ease-in-out",
          fadeOut: "fadeOut 0.3s ease-in-out",
          shine: 'shine 5s linear infinite',
          scrollDown: 'scrollDown 1.5s infinite',
          slideOutLeft: 'slideOutLeft 2s ease-in-out infinite',
          slideOutRight: 'slideOutRight 2s ease-in-out infinite',
        },
        keyframes: {
          slideOutLeft: {
          '0%, 100%': { transform: 'translateY(-50%) translateX(0)' },
          '50%': { transform: 'translateY(-50%) translateX(-0.5rem)' },
          },
          slideOutRight: {
             '0%, 100%': { transform: 'translateY(-50%) translateX(0)' },
            '50%': { transform: 'translateY(-50%) translateX(0.5rem)' },
          },
          scrollDown: {
            '0%': { transform: 'translateY(0)' },
            '20%': { transform: 'translateY(15px)' },
            '40%,100%': { transform: 'translateY(0)' },
          },
          shine: {
            '0%': { 'background-position': '100%' },
            '100%': { 'background-position': '-100%' },
          },
          fadeIn: {
            from: { opacity: 0 },
            to: { opacity: 1 },
          },
          fadeOut: {
            from: { opacity: 1 },
            to: { opacity: 0 },
          },
          
        },
      
        colors: {
          'navy-700': '#1B2559',
          'blue-500': '#3B82F6',
          'blue-600': '#2563EB',
          'gray-200': '#E2E8F0',
          'gray-400': '#A0AEC0',
          'green-500': '#22C55E',    // Adjust if needed
          'red-500': '#EF4444',      // Adjust if needed
          'red-600': '#DC2626',
          'amber-500': '#F59E0B',    // Adjust if needed
          'white': '#FFFFFF',
          'oxford-blue': '#002147',
          'oxford-blue-dark': '#001a33', // Define a darker shade for hover
          'orange-red': '#FF4500',
          'orange-red-dark': '#cc3700', // Define a darker shade for hover
          lightPrimary: "#F4F7FE",
          },
      },
      screens: {
        "iphone-pm": "200px",  // iPhone 14/15/16 Pro Max (~430px)
        "samsung": "412px",  // Samsung Galaxy S22 Ultra (~412px)
        "xs": "375px",  // iPhone 12/13/14/15 Standard (~375px)
        "sm": "640px",  // Máy tính bảng nhỏ
        "md": "768px",  // Tablet (iPad Mini, iPad Air)
        "lg": "1024px",  // Laptop 13 inch (MacBook Air, ThinkPad X1 Carbon)
        "xl": "1366px",  // Laptop 15.6 inch (Dell XPS 15, ThinkPad T15)
        "xll": "1600px",  // Laptop 15.6 inch (Dell XPS 15, ThinkPad T15)
        "2xl": "1920px",  // Desktop 24 inch (iMac 24", Màn hình FullHD)
      },
    },
  plugins: [
    require('@tailwindcss/forms'),
  ],
};

