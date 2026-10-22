import "./globals.css";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", weight: ["600","700","800"] });

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://miu.edu.ng"),
  title: "Mewar International University Nigeria",
  description: "Explore Mewar International University Nigeria’s public programme catalogue, academic information and admissions guidance. Confirm current approvals and intake details with the University.",
  openGraph: { title: "Mewar International University Nigeria", description: "Education for Knowledge, Peace & Prosperity. Explore the public university information and programme catalogue.", images: ["/assets/hero-campus.jpg"] },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jakarta.variable}`}>
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
