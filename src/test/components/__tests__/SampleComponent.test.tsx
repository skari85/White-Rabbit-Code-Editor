import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SampleComponent } from '../SampleComponent';

// Mock any external dependencies if needed
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

describe('SampleComponent', () => {
  it('renders without crashing', () => {
    render(<SampleComponent />);
    expect(screen.getByTestId('sample-component')).toBeInTheDocument();
  });

  it('displays the correct text', () => {
    render(<SampleComponent text="Hello World" />);
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('handles click events', async () => {
    const mockOnClick = vi.fn();
    render(<SampleComponent onClick={mockOnClick} />);
    
    const button = screen.getByRole('button');
    button.click();
    
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('applies custom className', () => {
    render(<SampleComponent className="custom-class" />);
    const element = screen.getByTestId('sample-component');
    expect(element).toHaveClass('custom-class');
  });
});

// Example of testing async behavior
describe('SampleComponent Async', () => {
  it('handles async operations', async () => {
    const mockAsyncOperation = vi.fn().mockResolvedValue('success');
    
    render(<SampleComponent asyncOperation={mockAsyncOperation} />);
    
    const button = screen.getByText('Load Data');
    button.click();
    
    // Wait for async operation to complete
    await screen.findByText('Data loaded');
    
    expect(mockAsyncOperation).toHaveBeenCalledTimes(1);
  });
});

// Example of testing error states
describe('SampleComponent Error Handling', () => {
  it('displays error message when operation fails', async () => {
    const mockAsyncOperation = vi.fn().mockRejectedValue(new Error('Failed'));
    
    render(<SampleComponent asyncOperation={mockAsyncOperation} />);
    
    const button = screen.getByText('Load Data');
    button.click();
    
    // Wait for error to be displayed
    await screen.findByText('Error: Failed');
    
    expect(screen.getByText('Error: Failed')).toBeInTheDocument();
  });
});
