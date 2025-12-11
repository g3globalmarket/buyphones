import "./LoadingSkeleton.css";

interface LoadingSkeletonProps {
  lines?: number;
  className?: string;
}

export const LoadingSkeleton = ({
  lines = 3,
  className = "",
}: LoadingSkeletonProps) => {
  return (
    <div className={`pb-skel ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="pb-skel-line" />
      ))}
    </div>
  );
};

export default LoadingSkeleton;
