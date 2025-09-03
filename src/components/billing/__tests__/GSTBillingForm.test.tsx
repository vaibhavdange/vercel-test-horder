import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import GSTBillingForm from '../GSTBillingForm';
import { OrderItem } from '@/types/orders';

// Mock the hooks
jest.mock('@/hooks/use-region', () => ({
  useRegion: () => ({
    currentRegion: {
      id: 'india',
      name: 'India',
      currency: 'INR',
      currencySymbol: '₹',
      dateFormat: 'DD/MM/YYYY',
      invoiceTemplate: 'indian-gst',
      taxRules: [
        {
          id: 'food-tax',
          name: 'Food Tax',
          rate: 0.05,
          appliesTo: 'food',
          isActive: true,
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    regions: [
      {
        id: 'india',
        name: 'India',
        currency: 'INR',
        currencySymbol: '₹',
        dateFormat: 'DD/MM/YYYY',
        invoiceTemplate: 'indian-gst',
        taxRules: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ]
  })
}));

jest.mock('@/hooks/useCurrency', () => ({
  useCurrency: () => ({
    format: (amount: number) => `₹${amount.toFixed(2)}`
  })
}));

// Mock GSTService
jest.mock('@/lib/services/gst-service', () => ({
  GSTService: jest.fn().mockImplementation(() => ({
    getHSNCodeForCategory: jest.fn((category: string) => {
      if (category.includes('food')) return '9963';
      if (category.includes('beverage')) return '2202';
      return '9963';
    }),
    getTaxRateForCategory: jest.fn((category: string) => {
      if (category.includes('food')) return 5;
      if (category.includes('beverage')) return 18;
      return 5;
    }),
    calculateTaxSummary: jest.fn(() => ({
      cgstAmount: 25,
      sgstAmount: 25,
      igstAmount: 0,
      totalTaxAmount: 50,
    })),
    calculateItemGST: jest.fn(() => ({
      taxAmount: 25,
      lineTotal: 525,
    })),
    generateInvoiceNumber: jest.fn(() => 'INV-20240101-1234'),
    amountInWords: jest.fn((amount: number) => 'Five Hundred Twenty Five Rupees Only'),
  }))
}));

// Mock data
const mockOrderItems: OrderItem[] = [
  {
    id: 'item-1',
    productId: 'product-1',
    productName: 'Pizza Margherita',
    quantity: 2,
    unitPrice: 300,
    totalPrice: 600,
    customizationNotes: '',
    product: {
      id: 'product-1',
      name: 'Pizza Margherita',
      price: 300,
      category: {
        id: 'cat-1',
        name: 'food',
        description: 'Food items',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    }
  },
  {
    id: 'item-2',
    productId: 'product-2',
    productName: 'Beer',
    quantity: 1,
    unitPrice: 150,
    totalPrice: 150,
    customizationNotes: '',
    product: {
      id: 'product-2',
      name: 'Beer',
      price: 150,
      category: {
        id: 'cat-2',
        name: 'beverages',
        description: 'Beverages',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    }
  }
];

describe('GSTBillingForm', () => {
  const mockOnInvoiceGenerated = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the form with correct title', () => {
    render(
      <GSTBillingForm
        orderItems={mockOrderItems}
        onInvoiceGenerated={mockOnInvoiceGenerated}
      />
    );

    expect(screen.getByText('GST Billing - India')).toBeInTheDocument();
  });

  it('should display customer details section', () => {
    render(
      <GSTBillingForm
        orderItems={mockOrderItems}
        onInvoiceGenerated={mockOnInvoiceGenerated}
      />
    );

    expect(screen.getByText('Customer Details')).toBeInTheDocument();
    expect(screen.getByLabelText('Customer Name *')).toBeInTheDocument();
    expect(screen.getByLabelText('Phone Number')).toBeInTheDocument();
    expect(screen.getByLabelText('GSTIN (Optional)')).toBeInTheDocument();
    expect(screen.getByLabelText('Address')).toBeInTheDocument();
  });

  it('should display billing items table', () => {
    render(
      <GSTBillingForm
        orderItems={mockOrderItems}
        onInvoiceGenerated={mockOnInvoiceGenerated}
      />
    );

    expect(screen.getByText('Billing Items')).toBeInTheDocument();
    expect(screen.getByText('Pizza Margherita')).toBeInTheDocument();
    expect(screen.getByText('Beer')).toBeInTheDocument();
    expect(screen.getByText('₹300.00')).toBeInTheDocument();
    expect(screen.getByText('₹150.00')).toBeInTheDocument();
  });

  it('should display bill summary section', () => {
    render(
      <GSTBillingForm
        orderItems={mockOrderItems}
        onInvoiceGenerated={mockOnInvoiceGenerated}
      />
    );

    expect(screen.getByText('Bill Summary')).toBeInTheDocument();
    expect(screen.getByText('Subtotal:')).toBeInTheDocument();
    expect(screen.getByText('CGST:')).toBeInTheDocument();
    expect(screen.getByText('SGST:')).toBeInTheDocument();
    expect(screen.getByText('Total Tax:')).toBeInTheDocument();
    expect(screen.getByText('Discount:')).toBeInTheDocument();
    expect(screen.getByText('Total Amount:')).toBeInTheDocument();
  });

  it('should allow customer name input', () => {
    render(
      <GSTBillingForm
        orderItems={mockOrderItems}
        onInvoiceGenerated={mockOnInvoiceGenerated}
      />
    );

    const customerNameInput = screen.getByLabelText('Customer Name *');
    fireEvent.change(customerNameInput, { target: { value: 'John Doe' } });

    expect(customerNameInput).toHaveValue('John Doe');
  });

  it('should allow phone number input', () => {
    render(
      <GSTBillingForm
        orderItems={mockOrderItems}
        onInvoiceGenerated={mockOnInvoiceGenerated}
      />
    );

    const phoneInput = screen.getByLabelText('Phone Number');
    fireEvent.change(phoneInput, { target: { value: '9876543210' } });

    expect(phoneInput).toHaveValue('9876543210');
  });

  it('should allow GSTIN input', () => {
    render(
      <GSTBillingForm
        orderItems={mockOrderItems}
        onInvoiceGenerated={mockOnInvoiceGenerated}
      />
    );

    const gstinInput = screen.getByLabelText('GSTIN (Optional)');
    fireEvent.change(gstinInput, { target: { value: '12ABCDE1234F1Z5' } });

    expect(gstinInput).toHaveValue('12ABCDE1234F1Z5');
  });

  it('should allow address input', () => {
    render(
      <GSTBillingForm
        orderItems={mockOrderItems}
        onInvoiceGenerated={mockOnInvoiceGenerated}
      />
    );

    const addressInput = screen.getByLabelText('Address');
    fireEvent.change(addressInput, { target: { value: '123 Main Street' } });

    expect(addressInput).toHaveValue('123 Main Street');
  });

  it('should allow discount input', () => {
    render(
      <GSTBillingForm
        orderItems={mockOrderItems}
        onInvoiceGenerated={mockOnInvoiceGenerated}
      />
    );

    const discountInput = screen.getByDisplayValue('0');
    fireEvent.change(discountInput, { target: { value: '50' } });

    expect(discountInput).toHaveValue(50);
  });

  it('should allow tax rate changes for items', () => {
    render(
      <GSTBillingForm
        orderItems={mockOrderItems}
        onInvoiceGenerated={mockOnInvoiceGenerated}
      />
    );

    const taxSelects = screen.getAllByDisplayValue('5');
    expect(taxSelects).toHaveLength(2); // One for each item

    fireEvent.change(taxSelects[0], { target: { value: '18' } });
    expect(taxSelects[0]).toHaveValue('18');
  });

  it('should show generate invoice button', () => {
    render(
      <GSTBillingForm
        orderItems={mockOrderItems}
        onInvoiceGenerated={mockOnInvoiceGenerated}
      />
    );

    const generateButton = screen.getByText('Generate Invoice');
    expect(generateButton).toBeInTheDocument();
  });

  it('should disable generate invoice button when customer name is empty', () => {
    render(
      <GSTBillingForm
        orderItems={mockOrderItems}
        onInvoiceGenerated={mockOnInvoiceGenerated}
      />
    );

    const generateButton = screen.getByText('Generate Invoice');
    expect(generateButton).toBeDisabled();
  });

  it('should enable generate invoice button when customer name is provided', () => {
    render(
      <GSTBillingForm
        orderItems={mockOrderItems}
        onInvoiceGenerated={mockOnInvoiceGenerated}
      />
    );

    const customerNameInput = screen.getByLabelText('Customer Name *');
    fireEvent.change(customerNameInput, { target: { value: 'John Doe' } });

    const generateButton = screen.getByText('Generate Invoice');
    expect(generateButton).not.toBeDisabled();
  });

  it('should show preview button', () => {
    render(
      <GSTBillingForm
        orderItems={mockOrderItems}
        onInvoiceGenerated={mockOnInvoiceGenerated}
      />
    );

    const previewButton = screen.getByText('Preview');
    expect(previewButton).toBeInTheDocument();
  });

  it('should show export button', () => {
    render(
      <GSTBillingForm
        orderItems={mockOrderItems}
        onInvoiceGenerated={mockOnInvoiceGenerated}
      />
    );

    const exportButton = screen.getByText('Export');
    expect(exportButton).toBeInTheDocument();
  });

  it('should handle invoice generation', async () => {
    render(
      <GSTBillingForm
        orderItems={mockOrderItems}
        onInvoiceGenerated={mockOnInvoiceGenerated}
      />
    );

    // Fill in customer name
    const customerNameInput = screen.getByLabelText('Customer Name *');
    fireEvent.change(customerNameInput, { target: { value: 'John Doe' } });

    // Click generate invoice
    const generateButton = screen.getByText('Generate Invoice');
    fireEvent.click(generateButton);

    // Should show generating state
    expect(screen.getByText('Generating...')).toBeInTheDocument();

    // Wait for the invoice generation to complete
    await waitFor(() => {
      expect(mockOnInvoiceGenerated).toHaveBeenCalledWith(
        expect.objectContaining({
          invoiceNumber: 'INV-20240101-1234',
          customerName: 'John Doe',
          items: expect.any(Array),
          taxSummary: expect.any(Object),
          subtotal: expect.any(Number),
          discount: expect.any(Number),
          totalAmount: expect.any(Number),
          amountInWords: 'Five Hundred Twenty Five Rupees Only',
          region: expect.any(Object),
          generatedAt: expect.any(Date),
        })
      );
    });
  });

  it('should show alert when trying to generate invoice without customer name', () => {
    // Mock window.alert
    const mockAlert = jest.spyOn(window, 'alert').mockImplementation(() => {});

    render(
      <GSTBillingForm
        orderItems={mockOrderItems}
        onInvoiceGenerated={mockOnInvoiceGenerated}
      />
    );

    // Try to generate invoice without customer name
    const generateButton = screen.getByText('Generate Invoice');
    fireEvent.click(generateButton);

    expect(mockAlert).toHaveBeenCalledWith('Please enter customer name');

    mockAlert.mockRestore();
  });

  it('should show invoice preview modal when preview button is clicked', () => {
    render(
      <GSTBillingForm
        orderItems={mockOrderItems}
        onInvoiceGenerated={mockOnInvoiceGenerated}
      />
    );

    const previewButton = screen.getByText('Preview');
    fireEvent.click(previewButton);

    expect(screen.getByText('Invoice Preview')).toBeInTheDocument();
    expect(screen.getByText('Print')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Download PDF')).toBeInTheDocument();
  });

  it('should close invoice preview modal when close button is clicked', () => {
    render(
      <GSTBillingForm
        orderItems={mockOrderItems}
        onInvoiceGenerated={mockOnInvoiceGenerated}
      />
    );

    // Open preview modal
    const previewButton = screen.getByText('Preview');
    fireEvent.click(previewButton);

    expect(screen.getByText('Invoice Preview')).toBeInTheDocument();

    // Close modal
    const closeButton = screen.getByText('✕');
    fireEvent.click(closeButton);

    expect(screen.queryByText('Invoice Preview')).not.toBeInTheDocument();
  });

  it('should handle export functionality', () => {
    // Mock console.log
    const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});

    render(
      <GSTBillingForm
        orderItems={mockOrderItems}
        onInvoiceGenerated={mockOnInvoiceGenerated}
      />
    );

    const exportButton = screen.getByText('Export');
    fireEvent.click(exportButton);

    expect(mockConsoleLog).toHaveBeenCalledWith('Exporting as pdf');

    mockConsoleLog.mockRestore();
  });

  it('should handle print functionality', () => {
    // Mock console.log
    const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});

    render(
      <GSTBillingForm
        orderItems={mockOrderItems}
        onInvoiceGenerated={mockOnInvoiceGenerated}
      />
    );

    // Open preview modal first
    const previewButton = screen.getByText('Preview');
    fireEvent.click(previewButton);

    const printButton = screen.getByText('Print');
    fireEvent.click(printButton);

    expect(mockConsoleLog).toHaveBeenCalledWith('Printing invoice');

    mockConsoleLog.mockRestore();
  });

  it('should handle email functionality', () => {
    // Mock console.log
    const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});

    render(
      <GSTBillingForm
        orderItems={mockOrderItems}
        onInvoiceGenerated={mockOnInvoiceGenerated}
      />
    );

    // Open preview modal first
    const previewButton = screen.getByText('Preview');
    fireEvent.click(previewButton);

    const emailButton = screen.getByText('Email');
    fireEvent.click(emailButton);

    expect(mockConsoleLog).toHaveBeenCalledWith('Sending invoice via email');

    mockConsoleLog.mockRestore();
  });

  it('should display correct currency and date format', () => {
    render(
      <GSTBillingForm
        orderItems={mockOrderItems}
        onInvoiceGenerated={mockOnInvoiceGenerated}
      />
    );

    expect(screen.getByText('INR • DD/MM/YYYY')).toBeInTheDocument();
  });

  it('should handle empty order items', () => {
    render(
      <GSTBillingForm
        orderItems={[]}
        onInvoiceGenerated={mockOnInvoiceGenerated}
      />
    );

    expect(screen.getByText('Billing Items')).toBeInTheDocument();
    // Should not crash with empty items
  });

  it('should apply custom className', () => {
    const { container } = render(
      <GSTBillingForm
        orderItems={mockOrderItems}
        onInvoiceGenerated={mockOnInvoiceGenerated}
        className="custom-class"
      />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });
});
