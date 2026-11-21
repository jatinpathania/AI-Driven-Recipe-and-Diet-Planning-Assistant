import { redirect } from "next/navigation"

// The favourites experience lives inside the kitchen shell now; this route is
// kept because the marketing footer (and older links) still point at it.
export default function FavouritesRedirect() {
    redirect("/kitchen/favourites")
}
