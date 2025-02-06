import NewTabCommandBox from "@/components/NewTabCommandBox";
import ShortcutManager from "@/components/shortcut-manager-wxt";
import ChromeTopSites from "@/components/ChromeTopSites";
const App = () => {
  return (
    <div>
      <NewTabCommandBox />
      <div className="mt-52">
        <ChromeTopSites />
        <ShortcutManager />
      </div>
    </div>
  );
};

export default App;
