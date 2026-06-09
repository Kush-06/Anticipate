import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import { DecoderPage } from './DecoderPage';
import { MemoryRouter } from 'react-router';

// Mock useNavigate since it's used in DecoderPage
const mockNavigate = vi.fn();
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('DecoderPage', () => {
  it('renders the list of documents', () => {
    render(
      <MemoryRouter>
        <DecoderPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Practice reading realistic financial documents ahead of time/)).toBeInTheDocument();
    expect(screen.getByText('Monthly payslip')).toBeInTheDocument();
    expect(screen.getByText('Student loan')).toBeInTheDocument();
    expect(screen.getByText('Tenancy agreement')).toBeInTheDocument();
  });

  it('opens the Student Loan Statement when clicked', () => {
    render(
      <MemoryRouter>
        <DecoderPage />
      </MemoryRouter>
    );

    const studentLoanTrack = screen.getByText('Student loan').closest('.anp-l-track');
    if (!studentLoanTrack) throw new Error('Student loan track not found');
    
    fireEvent.click(studentLoanTrack);

    // Should now show the Student Loan Statement component
    expect(screen.getByText('Annual Statement 2024–25')).toBeInTheDocument();
    expect(screen.getByText('Jamie L. Carter')).toBeInTheDocument();
  });

  it('returns to the list when the back button is clicked in a document', () => {
    render(
      <MemoryRouter>
        <DecoderPage />
      </MemoryRouter>
    );

    // Open Student Loan
    const studentLoanTrack = screen.getByText('Student loan').closest('.anp-l-track');
    if (!studentLoanTrack) throw new Error('Student loan track not found');
    fireEvent.click(studentLoanTrack);

    // Verify it's open
    expect(screen.queryByText('Monthly payslip')).not.toBeInTheDocument();

    // Click back button (ArrowLeft)
    const backButton = screen.getByRole('button'); // The only button in StudentLoanStatement header
    fireEvent.click(backButton);

    // Should be back on the list
    expect(screen.getByText('Monthly payslip')).toBeInTheDocument();
  });
});
