import "./globals.css"
import { Inter, Plus_Jakarta_Sans } from "next/font/google"
import Providers from "./providers"
import { LITE_MOTION_SCRIPT } from "@/lib/motion/liteScript"

const inter = Inter({
    subsets: ["latin"],
    display: "swap",
    fallback: ["system-ui", "arial"],
    variable: "--font-inter",
})

// Kitchen UI face. Self-hosted by next/font instead of a render-blocking
// Google Fonts @import injected at runtime.
const jakarta = Plus_Jakarta_Sans({
    subsets: ["latin"],
    display: "swap",
    weight: ["400", "500", "600", "700", "800"],
    variable: "--font-jakarta",
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
                {/* Tag phones and low-end devices before paint so heavy effects never start there. */}
                <script dangerouslySetInnerHTML={{ __html: LITE_MOTION_SCRIPT }} />
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
            <body className={`${inter.className} ${inter.variable} ${jakarta.variable}`}>
                <Providers>{children}</Providers>
            </body>
        </html>
    )
}
