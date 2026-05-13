export const metadata = {
  title: "Food Tracker",
  description: "App alimentazione",
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
