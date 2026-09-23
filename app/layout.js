import "./globals.css";
import "./eventra-expansion.css";

export const metadata = {
  title: "Eventra — Festival Management",
  description: "Run festivals, campus events and programmes from one place."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}