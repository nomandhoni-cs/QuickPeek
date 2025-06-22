import ShortcutManager from "@/components/shortcut-manager-wxt";
import ChromeTopSites from "@/components/ChromeTopSites";
import SearchInterface from "@/components/SearchInterface";
const App = () => {
  return (
    <div className="h-screen flex items-center justify-center">
      <div>
        <SearchInterface />
        <ChromeTopSites />
        <ShortcutManager />
      </div>
    </div>
  );
};

export default App;
