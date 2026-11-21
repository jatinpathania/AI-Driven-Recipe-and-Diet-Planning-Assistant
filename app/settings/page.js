import { redirect } from "next/navigation"

// Settings moved into the kitchen shell so it inherits the sidebar and theme.
export default function SettingsRedirect() {
    redirect("/kitchen/settings")
}
