'use client';

import { useState, useEffect } from 'react';
import { getMDXComponent } from 'next-contentlayer/hooks';
import clsx from 'clsx';

import { allPosts } from 'contentlayer/generated';
import MdxComponents from '@/components/MdxComponents';

export function ContentTabs({ children }) {
  const [selectedTab, setSelectedTab] = useState(null);
  const [postContent, setPostContent] = useState(null);

  useEffect(() => {
    // Function to update the tab based on the current URL
    const updateTabFromURL = () => {
      const path = window.location.pathname;
      const selectedPost = allPosts.find(post => post._raw.flattenedPath === path);
      if (selectedPost) {
        const Content = getMDXComponent(selectedPost.body.code);
        setSelectedTab(path);
        setPostContent(<Content components={MdxComponents()} />);
      } else {
        // If no matching post is found, default to the first tab
        const defaultTab = children[0].props.href;
        setSelectedTab(defaultTab);
        const defaultPost = allPosts.find(post => post._raw.flattenedPath === defaultTab);
        if (defaultPost) {
          const Content = getMDXComponent(defaultPost.body.code);
          setPostContent(<Content components={MdxComponents()} />);
        }
      }
    };

    // Call the function initially to set the tab based on URL
    updateTabFromURL();

    // Listen for URL changes to update the tab accordingly
    window.addEventListener('popstate', updateTabFromURL);

    return () => {
      window.removeEventListener('popstate', updateTabFromURL);
    };
  }, [children]);

  useEffect(() => {
    if (selectedTab) {
      const url = new URL(window.location.href);
      url.pathname = selectedTab;
      window.history.replaceState(null, null, url.toString());
    }
  }, [selectedTab]);

  return (
    <div>
      <div className="flex space-x-4 border-b">
        {children.map((child, index) => (
          <button
            key={index}
            className={clsx(
              'py-2 px-4 text-sm transition-colors duration-300 whitespace-nowrap',
              selectedTab === child.props.href ? 'font-semibold border-b-2 border-[#3098AA] text-[#3098AA]' : 'hover:border-b-2 hover:border-gray-300 text-gray-500'
            )}
            onClick={() => setSelectedTab(child.props.href)}
          >
            {child.props.title}
          </button>
        ))}
      </div>
      <div className="mt-4">
        {postContent}
      </div>
    </div>
  );
}

export function ContentTab({ title, href }) {
  return null;
}
