import type React from "react";

const AuroraBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-gray-900">
        <div className="absolute inset-0 overflow-hidden">
          <div className="aurora-container">
            <div className="aurora-1"></div>
            <div className="aurora-2"></div>
            <div className="aurora-3"></div>
            <div className="aurora-4"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuroraBackground;
