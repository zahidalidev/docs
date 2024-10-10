"use client"

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon, Bars3Icon } from '@heroicons/react/20/solid';
import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';
import '@stoplight/elements/styles.min.css';

import './styles.css';

interface OpenApiProps {
  apiDescriptionUrl: string;
  router: 'history' | 'hash' | 'memory';
}

// @ts-ignore - Ignoring TypeScript errors for dynamic import
const OpenAPi = dynamic<OpenApiProps>(() => import('@stoplight/elements').then(mod => mod.API), {
  ssr: false
});

const OpenApiPage: React.FC = () => {
  const { theme = 'dark', systemTheme = 'dark' } = useTheme();
  const currentTheme = theme === 'system' ? `openapi-${systemTheme}` : `openapi-${theme}`;

  // State to manage the drawer
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [sidebarContent, setSidebarContent] = useState<HTMLElement | null>(null);

  // Function to toggle the drawer
  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

  // Effect to grab the sidebar content and store it in state
  useEffect(() => {
    const sidebarElement = document.querySelector('.openapi-light .sl-elements-api > .sl-flex') as HTMLElement;


    if (sidebarElement) {
      setSidebarContent(sidebarElement.cloneNode(true) as HTMLElement); // Clone the sidebar content
      sidebarElement.style.display = 'none';
    }
  }, [isDrawerOpen]);

  return (
    <div className={`open-api-container ${currentTheme}`}>
      <nav className={`p-6 bg-${currentTheme === 'openapi-light' ? 'white' : '[#14171F]'}`}>
        <Link
          href='/'
          className={`!font-grotesk group inline-flex items-center text-sm ${currentTheme === 'openapi-light' ? 'text-gray-600 hover:text-gray-800' : 'text-white hover:text-gray-400'
            } font-medium`}
        >
          <ArrowLeftIcon className="inline h-3 mr-2 transition-transform group-hover:-translate-x-1" />
          Back to Docs
        </Link>

        <div className="drawer-icon" onClick={toggleDrawer}>
          <Bars3Icon className="h-6 w-6 text-gray-700" />
        </div>
      </nav>


      <div className={`drawer ${isDrawerOpen ? 'open' : ''}`}>
        {/* <div className={`sl-elements sl-antialiased sl-h-full sl-text-base sl-font-ui sl-text-body`}>
        <div className={`sl-flex sl-overflow-y-auto sl-flex-col sl-sticky sl-inset-y-0 sl-pt-8 sl-bg-canvas-100 sl-border-r`}>
        <div className={`sl-elements-api sl-flex sl-inset-0 sl-h-full`}>
        <div className={`sl-flex`}> */}
          {sidebarContent && <div dangerouslySetInnerHTML={{ __html: sidebarContent.innerHTML }} />}
        {/* </div>
        </div>
        </div>
        </div> */}
      </div>

      <OpenAPi
        apiDescriptionUrl="https://sourcegraph.github.io/openapi/openapi.Sourcegraph.Latest.yaml"
        router="hash"
      />
    </div>
  );
};

export default OpenApiPage;
