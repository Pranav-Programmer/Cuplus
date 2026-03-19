// src/components/DeleteConfirmation.tsx
"use client";

import React from "react";

interface DeleteConfirmationProps {
  isOpen: boolean;
  itemName: string;
  type: 'task' | 'project' | 'note';
  permanent?: boolean;   // true = delete forever, false/undefined = move to Recycle Bin
  onConfirm: () => void;
  onCancel: () => void;
}
const DeleteConfirmation: React.FC<DeleteConfirmationProps> = ({
  isOpen,
  itemName,
  type,
  permanent = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const getTitle = () => {
    if (type === 'task') return 'Delete Task?';
    if (type === 'note') return permanent ? 'Delete Note?' : 'Remove Note?';
    if (type === 'project') return permanent ? 'Delete Project?' : 'Remove Project?';
    return 'Remove Item?';
  }

  const getMessage = () => {
  // Tasks are always permanently deleted (no Recycle Bin for tasks)
  if (type === 'task') {
    return {
      sentence: `Are you sure you want to permanently delete this task?`,
    };
  }

  // Notes / Projects being moved to Recycle Bin from main page
  if (!permanent) {
    return {
      sentence: `Are you sure you want to move this ${type} to the Recycle Bin?`,
    };
  }

  // Notes / Projects being permanently deleted from Recycle Bin
  return {
    sentence: `Are you sure you want to permanently delete this ${type}?`,
  };
};

const { sentence, warning } = getMessage();

  const getConfirmButton = () => {
    return type === "task" ? "Delete" : "Remove";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-surface-dark rounded-xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto border border-gray-800">
        <h3 className="text-lg font-bold text-white mb-4">{getTitle()}</h3>
        <p className="text-[#94A3B8] text-sm">
          {sentence}{' '}
          <span className="text-white font-medium">&quot;{itemName}&quot;</span>
        </p>
        <p className="text-xs text-[#94A3B8]/60 mt-1">{warning}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-400 hover:text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors"
          >
            {getConfirmButton()}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmation;