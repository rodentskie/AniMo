import type { Metadata } from "next"
import { EmotionRegistry } from "@/components/ui/emotion-registry"
import { Provider } from "@/components/ui/provider"

export const metadata: Metadata = {
  title: {
    default: "AniMo",
    template: "%s | AniMo",
  },
  description:
    "AniMo estimates rice yield trends using an ARIMAX (Autoregressive Integrated Moving Average with Exogenous Variables) time-series model.",
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <EmotionRegistry>
          <Provider defaultTheme="dark">
            {props.children}
          </Provider>
        </EmotionRegistry>
      </body>
    </html>
  )
}
