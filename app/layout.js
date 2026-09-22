import "./globals.css";

export const metadata = {
  title: "Eventra — Festival Management",
  description: "Run festivals, competitions and campus events from one place."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}