interface TabsProps {
  tabs: string[];
  activeTab: number;
  onTabChange: (index: number) => void;
}

export default function Tabs({ tabs, activeTab, onTabChange }: TabsProps) {
  return (
    <div className="flex border-b border-gray-200 w-full">
      {tabs.map((tab, index) => (
        <button
          key={tab}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
            activeTab === index
              ? "text-gray-900 border-b-2 border-gray-900"
              : "text-gray-400 hover:text-gray-600"
          }`}
          onClick={() => onTabChange(index)}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
