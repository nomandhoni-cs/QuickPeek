interface RowSkeletonProps {
  count: number;
}

const RowSkeleton = ({ count }: RowSkeletonProps) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={`flex items-center p-2 rounded-lg border cursor-pointer animate-pulse mb-4`}
        >
          {/* Skeleton for Icon */}
          <div className="w-8 h-8 bg-gray-300 rounded-full mr-4"></div>

          {/* Skeleton for Text */}
          <div className="flex-grow overflow-hidden max-w-full">
            <div className="w-4/5 h-4 bg-gray-300 rounded mb-2"></div>
            <div className="w-3/4 h-3 bg-gray-300 rounded"></div>
          </div>
        </div>
      ))}
    </>
  );
};

export default RowSkeleton;
