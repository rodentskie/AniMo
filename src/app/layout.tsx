import { EmotionRegistry } from "@/components/ui/emotion-registry"
import { Provider } from "@/components/ui/provider"


export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning>
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