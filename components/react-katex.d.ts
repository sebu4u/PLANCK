declare module 'react-katex' {
  import * as React from 'react';
  export interface InlineMathProps {
    math: string;
    className?: string;
    onClick?: () => void;
  }
  export interface BlockMathProps {
    math: string;
    className?: string;
    onClick?: () => void;
  }
  export const InlineMath: React.FC<InlineMathProps>;
  export const BlockMath: React.FC<BlockMathProps>;
  export default { InlineMath, BlockMath };
} 