interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

export const Pagination = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
}: PaginationProps) => {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex items-center justify-between mt-4 px-1">
      <p className="text-sm text-ios-secondary-label">
        Showing {startItem} to {endItem} of {totalItems} items
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1.5 text-sm font-medium rounded-full bg-ios-gray6 text-ios-label hover:bg-ios-gray5 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <span className="px-3 py-1.5 text-sm font-medium bg-brand text-ios-label rounded-full">
          {currentPage} / {totalPages}
        </span>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="px-3 py-1.5 text-sm font-medium rounded-full bg-ios-gray6 text-ios-label hover:bg-ios-gray5 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
};
