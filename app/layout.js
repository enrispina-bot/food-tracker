import "./globals.css";

export const metadata = {
  title: "Food Tracker",
  description: "App alimentazione",
  
icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },

};

export default function RootLayout({ children }) {
  return (
    <html lang="it">
      <body>
        {children}
      </body>
    </html>
  );
}
