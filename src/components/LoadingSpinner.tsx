import '../styles/spinner.css';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingSpinner = ({ size = 'md' }: LoadingSpinnerProps) => {
  const sizeClass = size === 'sm' ? 'spinner-small' : size === 'lg' ? 'spinner-large' : '';
  
  return (
    <div className={`spinner ${sizeClass}`} />
  );
};
