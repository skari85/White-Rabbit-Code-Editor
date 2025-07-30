
import React, { useState } from 'react';
import { ChevronRight, File, Folder } from 'lucide-react';
import { LocalFile } from '@/hooks/use-local-storage';

interface FileTreeProps {
  files: LocalFile[];
  onSelect: (file: LocalFile) => void;
}

interface TreeNode {
  name: string;
  type: 'file' | 'folder';
  path: string;
  children?: TreeNode[];
  file?: LocalFile;
}

const buildFileTree = (files: LocalFile[]): TreeNode[] => {
  const root: TreeNode = { name: 'root', type: 'folder', path: '', children: [] };

  files.forEach(file => {
    const pathParts = file.name.split('/');
    let currentNode = root;

    pathParts.forEach((part, index) => {
      const isFile = index === pathParts.length - 1;
      let childNode = currentNode.children?.find(child => child.name === part);

      if (!childNode) {
        childNode = {
          name: part,
          type: isFile ? 'file' : 'folder',
          path: pathParts.slice(0, index + 1).join('/'),
          children: isFile ? undefined : [],
          file: isFile ? file : undefined,
        };
        currentNode.children?.push(childNode);
      }

      if (!isFile) {
        currentNode = childNode;
      }
    });
  });

  return root.children || [];
};

const FileSystemTree: React.FC<{ tree: TreeNode[], onSelect: (file: LocalFile) => void, level?: number }> = ({ tree, onSelect, level = 0 }) => {
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => ({ ...prev, [path]: !prev[path] }));
  };

  return (
    <ul className="space-y-1">
      {tree.map(node => (
        <li key={node.path}>
          {node.type === 'folder' ? (
            <div>
              <div
                className="flex items-center cursor-pointer hover:bg-gray-800 rounded p-1"
                style={{ paddingLeft: `${level * 1.5}rem` }}
                onClick={() => toggleFolder(node.path)}
              >
                <ChevronRight className={`h-4 w-4 mr-1 transition-transform ${expandedFolders[node.path] ? 'rotate-90' : ''}`} />
                <Folder className="h-4 w-4 mr-2 text-blue-400" />
                <span>{node.name}</span>
              </div>
              {expandedFolders[node.path] && node.children && (
                <FileSystemTree tree={node.children} onSelect={onSelect} level={level + 1} />
              )}
            </div>
          ) : (
            <div
              className="flex items-center cursor-pointer hover:bg-gray-800 rounded p-1"
              style={{ paddingLeft: `${level * 1.5}rem` }}
              onClick={() => onSelect(node.file!)}
            >
              <File className="h-4 w-4 mr-2 text-gray-500" />
              <span>{node.name}</span>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
};

export const FileTree: React.FC<FileTreeProps> = ({ files, onSelect }) => {
  const fileTree = buildFileTree(files);

  return (
    <div className="p-2">
      <FileSystemTree tree={fileTree} onSelect={onSelect} />
    </div>
  );
};
