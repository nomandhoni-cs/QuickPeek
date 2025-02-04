import NewTabCommandBox from "@/components/NewTabCommandBox";
import ShortcutManager from "@/components/shortcut-manager-wxt";
const App = () => {
  return (
    <div>
      <NewTabCommandBox />
      <div className="mt-40">
        <ShortcutManager />
      </div>
    </div>
  );
};

export default App;
