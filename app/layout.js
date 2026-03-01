import "./globals.css"
import { Inter } from "next/font/google"
import Providers from "./providers"

const inter = Inter({
    subsets: ["latin"],
    display: "swap",
    fallback: ["system-ui", "arial"],
    variable: "--font-inter",
})

export const metadata = {
    title: "Flavour AI",
    description: "Designed by Hoopers",
    icons: {
        icon: './icon.png'
    }
}

export default function RootLayout({ children }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={inter.className}>
                <Providers>{children}</Providers>
            </body>
        </html>
    )
}
