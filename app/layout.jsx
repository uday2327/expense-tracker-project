import "./globals.css";

export const metadata = {
  title: "Shared Expenses",
  description: "Date-aware shared expenses with CSV anomaly review"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

