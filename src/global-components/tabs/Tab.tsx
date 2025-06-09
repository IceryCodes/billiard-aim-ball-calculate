import { ReactElement, ReactNode, useState } from 'react';

import { Button } from '../buttons/Button';

interface TabProps {
  tabs: ({ title: string; content: ReactNode } | undefined)[]; // An array of tab titles and their respective content
  otherButton?: { title: string; onClick: () => void }[];
}

const Tab = ({ tabs, otherButton }: TabProps): ReactElement => {
  if (tabs.length === 0) {
    throw new Error('At least one tab must be provided.');
  }

  const [activeTab, setActiveTab] = useState<number>(0);

  return (
    <>
      {/* Tabs header */}
      <div className="flex space-x-4 border-b border-gray-200">
        {tabs.map((tab, index: number) =>
          !tab ? (
            <div key={index}></div>
          ) : (
            <Button
              key={index}
              element={<>{tab.title}</>}
              onClick={() => setActiveTab(index)}
              className={`py-2 px-4 ${
                activeTab === index ? 'text-link border-b-4 border-link' : 'text-foreground hover:text-link'
              }`}
            />
          )
        )}
        {!!otherButton &&
          otherButton.length &&
          otherButton?.map(({ title, onClick }) => (
            <Button
              key={title}
              element={<>{title}</>}
              onClick={onClick}
              className="py-2 px-4 text-foreground hover:text-link"
            />
          ))}
      </div>

      {/* Tab content */}
      <div className="text-background">{tabs[activeTab] && tabs[activeTab].content}</div>
    </>
  );
};

export default Tab;
