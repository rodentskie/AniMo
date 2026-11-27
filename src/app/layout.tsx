import type { Metadata } from "next"
import { EmotionRegistry } from "@/components/ui/emotion-registry"
import { Provider } from "@/components/ui/provider"
import { Toaster } from "@/components/ui/toaster"

export const metadata: Metadata = {
  title: {
    default: "AniMo",
    template: "%s | AniMo",
  },
  description:
    "AniMo estimates rice production using an ARIMA (Autoregressive Integrated Moving Average) time-series model.",
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <EmotionRegistry>
          <Provider defaultTheme="dark">
            {props.children}
            <Toaster />
          </Provider>
        </EmotionRegistry>
      </body>
    </html>
  )
}
