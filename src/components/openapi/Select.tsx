'use client';

import React, { ReactNode, useMemo } from 'react';
import { Select as SelectRoot, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SelectOptionData {
  title: string;
  content: ReactNode;
}

export function CodeSelect({ children }: SelectOptionProps) {
  const [selected, setSelected] = React.useState(0);
  
  const options: SelectOptionData[] = useMemo(
    () =>
      (
        React.Children.map(children, child => {
          if (!React.isValidElement(child)) return null;
          const title = child.props.title;
          const content = child.props.children;
          return { title, content };
        }) as SelectOptionData[]
      ).filter(Boolean),
    [children]
  );

  return (
    <div className="w-full rounded-lg">
      <SelectRoot value={selected.toString()} onValueChange={(value) => setSelected(Number(value))}>
        <SelectTrigger className="w-full bg-white dark:bg-black text-gray-900 dark:text-gray-300 border border-gray-300 dark:border-gray-700 shadow-sm dark:shadow-black">
          <SelectValue>{options[selected].title}</SelectValue>
        </SelectTrigger>

        <SelectContent className='bg-white dark:bg-black text-gray-900 dark:text-gray-300 shadow-sm dark:shadow-black' >
          {options.map((option, index) => (
            <SelectItem key={index} value={index.toString()}>
              {option.title}
            </SelectItem>
          ))}
        </SelectContent>
      </SelectRoot>
      
      <div className="mt-4">
        {options[selected].content}
      </div>
    </div>
  );
}


interface SelectOptionProps {
  title?: string;
  children: ReactNode;
}

export function SelectOption({ children, ...props }: SelectOptionProps) {
  return children;
}
