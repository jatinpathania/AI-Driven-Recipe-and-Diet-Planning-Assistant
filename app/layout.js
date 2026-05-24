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
        icon: '/icon.png'
    }
}

export default function RootLayout({ children }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <script dangerouslySetInnerHTML={{__html: `
                    (function() {
                        try {
                            var defaultApplied = localStorage.getItem('kitchen-theme-default-dark-v1');
                            if (!defaultApplied) {
                                localStorage.setItem('kitchen-theme', 'dark');
                                localStorage.setItem('kitchen-theme-default-dark-v1', '1');
                            }
                            var savedTheme = localStorage.getItem('kitchen-theme') || 'dark';
                            var isHomePage = window.location.pathname === '/';
                            if (savedTheme === 'dark' && !isHomePage) {
                                document.documentElement.classList.add('dark');
                                document.documentElement.style.colorScheme = 'dark';
                            } else {
                                document.documentElement.classList.remove('dark');
                                document.documentElement.style.colorScheme = 'light';
                            }
                        } catch (e) {}
                    })();
                `}} />
            </head>
            <body className={inter.className}>
                <Providers>{children}</Providers>
            </body>
        </html>
    )
}
