import { Plus_Jakarta_Sans } from "next/font/google";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({ subsets: ["latin"] });

export const metadata = {
  title: "Registaration | IADR-APR 2025",
  description: "Registaration form for Iadr-apr 2025",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={plusJakartaSans.className}>
        {children}
         <ToastContainer position="top-right" autoClose={3000} />
      </body>
    </html>
  );
}
