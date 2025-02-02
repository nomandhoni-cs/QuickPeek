import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ThemeProviderProps } from "next-themes";
import NewTabCommandBox from "@/components/NewTabCommandBox";
const App = () => {
  return (
    <>
      <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
        <NewTabCommandBox />
      </NextThemesProvider>
    </>
  );
};

export default App;
