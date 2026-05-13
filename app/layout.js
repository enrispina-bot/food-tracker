export const metadata = {
  title: "Food Tracker",
  description: "App alimentazione",
};

export default function RootLayout({ children }) {
  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
