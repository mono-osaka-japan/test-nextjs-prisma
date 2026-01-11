import { render, screen } from '@testing-library/react';

describe('Example Test', () => {
  it('should pass a basic test', () => {
    render(<div>Hello World</div>);
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });
});
